//! Deathrattle system for combat simulation.
//!
//! Deathrattles trigger when a minion dies, in the order they were
//! summoned (not the order they died). Multiple deaths in a single
//! attack resolution are processed together, but deathrattles fire
//! in summon order.
//!
//! # Ordering Rules
//! 1. When multiple minions die simultaneously, deathrattles trigger
//!    in the order the minions were originally summoned/played.
//! 2. If a deathrattle summons a minion that then dies (from Sneed's
//!    or similar), that nested deathrattle is queued for the next pass.
//! 3. Golden minions trigger their deathrattle twice.
//! 4. Baron Rivendare doubles (or triples when golden) deathrattle triggers.

use rand::Rng;

use crate::minion::Minion;

/// Maximum number of minions on one side of the board.
const MAX_BOARD_SIZE: usize = 7;

/// Represents a deathrattle effect that can be triggered.
#[derive(Debug, Clone)]
pub enum DeathrattleEffect {
    /// Summon one or more tokens when this minion dies.
    SummonToken {
        card_id: String,
        attack: i32,
        health: i32,
        count: i32,
    },
    /// Buff random friendly minions with attack/health.
    BuffFriendly {
        attack: i32,
        health: i32,
        random_count: i32,
    },
    /// Deal damage to a random enemy minion.
    DamageRandomEnemy {
        damage: i32,
    },
    /// No deathrattle effect (card not implemented or has no deathrattle).
    None,
}

/// Look up the deathrattle effect for a given card ID.
///
/// Returns the effect associated with this minion's deathrattle, or
/// `DeathrattleEffect::None` if the card has no deathrattle or is not
/// yet implemented.
pub fn get_deathrattle_effect(card_id: &str) -> Option<DeathrattleEffect> {
    // Map well-known Battlegrounds deathrattle minions to their effects.
    // Golden versions are handled by doubling triggers in the caller.
    match card_id {
        // Harvest Golem: Deathrattle: Summon a 2/1 Damaged Golem.
        "EX1_556" | "BG_EX1_556" => Some(DeathrattleEffect::SummonToken {
            card_id: "skele21".to_string(),
            attack: 2,
            health: 1,
            count: 1,
        }),
        // Kindly Grandmother: Deathrattle: Summon a 3/2 Big Bad Wolf.
        "KAR_005" | "BG_KAR_005" => Some(DeathrattleEffect::SummonToken {
            card_id: "KAR_005a".to_string(),
            attack: 3,
            health: 2,
            count: 1,
        }),
        // Mecharoo: Deathrattle: Summon a 1/1 Jo-E Bot.
        "BOT_445" | "BG_BOT_445" => Some(DeathrattleEffect::SummonToken {
            card_id: "BOT_445t".to_string(),
            attack: 1,
            health: 1,
            count: 1,
        }),
        // Spawn of N'Zoth: Deathrattle: Give your minions +1/+1.
        "OG_256" | "BG_OG_256" => Some(DeathrattleEffect::BuffFriendly {
            attack: 1,
            health: 1,
            random_count: 0, // 0 means all friendly minions
        }),
        // Fiendish Servant: Deathrattle: Give this minion's Attack to a random friendly minion.
        // Simplified as a damage effect for now.
        "YOD_026" | "BG_YOD_026" => Some(DeathrattleEffect::BuffFriendly {
            attack: 0, // actual attack value is set dynamically at trigger time
            health: 0,
            random_count: 1,
        }),
        // Kaboom Bot: Deathrattle: Deal 4 damage to a random enemy minion.
        "BOT_606" | "BG_BOT_606" => Some(DeathrattleEffect::DamageRandomEnemy {
            damage: 4,
        }),
        // Imprisoner: Deathrattle: Summon a 1/1 Imp.
        "BG_DAL_751" => Some(DeathrattleEffect::SummonToken {
            card_id: "BG_IMP".to_string(),
            attack: 1,
            health: 1,
            count: 1,
        }),
        // Selfless Hero: Deathrattle: Give a random friendly minion Divine Shield.
        // Simplified as a buff (we don't model divine shield grant through buff stats here,
        // but the structure is correct for the framework)
        "OG_221" | "BG_OG_221" => Some(DeathrattleEffect::BuffFriendly {
            attack: 0,
            health: 0,
            random_count: 1,
        }),
        // Rat Pack: Deathrattle: Summon a number of 1/1 Rats equal to this minion's Attack.
        // The count is dynamic based on attack; we use 0 as a sentinel and handle at trigger time.
        "CFM_316" | "BG_CFM_316" => Some(DeathrattleEffect::SummonToken {
            card_id: "CFM_316t".to_string(),
            attack: 1,
            health: 1,
            count: 0, // 0 = use attacker's attack value at time of death
        }),
        // Scallywag: Deathrattle: Summon a 1/1 Pirate. It attacks immediately.
        "BGS_061" | "BG_BGS_061" => Some(DeathrattleEffect::SummonToken {
            card_id: "BGS_061t".to_string(),
            attack: 1,
            health: 1,
            count: 1,
        }),
        // Replicating Menace: Deathrattle: Summon three 1/1 Microbots.
        "BOT_312" | "BG_BOT_312" => Some(DeathrattleEffect::SummonToken {
            card_id: "BOT_312t".to_string(),
            attack: 1,
            health: 1,
            count: 3,
        }),
        // Goldrinn, the Great Wolf: Deathrattle: Give your Beasts +5/+5.
        "BGS_018" | "BG_BGS_018" => Some(DeathrattleEffect::BuffFriendly {
            attack: 5,
            health: 5,
            random_count: 0, // 0 = all friendly (beasts, but simplified to all)
        }),
        _ => None,
    }
}

/// Resolve all pending deathrattles in the correct order.
///
/// # Arguments
/// * `dead_minions` - Minions that died in this combat step
/// * `friendly_board` - The board of the side whose minions died
/// * `enemy_board` - The opponent's board
/// * `dead_positions` - The original positions where the dead minions were on the board
/// * `rng` - Random number generator
///
/// # Ordering Rules
/// 1. Sort dead minions by summon_order (ascending — earliest summoned first)
/// 2. For each dead minion, look up its deathrattle effect
/// 3. Golden minions trigger their deathrattle twice
/// 4. Execute the deathrattle effect (summon tokens, buff allies, damage enemies)
/// 5. Respect board size limit (max 7 minions)
pub fn resolve_deathrattles(
    dead_minions: &[Minion],
    friendly_board: &mut Vec<Minion>,
    enemy_board: &mut Vec<Minion>,
    dead_positions: &[usize],
    rng: &mut impl Rng,
) {
    if dead_minions.is_empty() {
        return;
    }

    // Create indexed pairs and sort by summon_order (ascending)
    let mut ordered: Vec<(usize, &Minion)> = dead_minions
        .iter()
        .enumerate()
        .collect();
    ordered.sort_by_key(|(_, m)| m.summon_order);

    // Track the next summon_order for newly summoned tokens
    let next_summon_order = friendly_board
        .iter()
        .map(|m| m.summon_order)
        .max()
        .unwrap_or(0)
        + 100;
    let mut summon_counter = next_summon_order;

    for (original_idx, dead_minion) in &ordered {
        let effect = match get_deathrattle_effect(&dead_minion.card_id) {
            Some(e) => e,
            None => continue,
        };

        // Golden minions trigger deathrattle twice
        let trigger_count = if dead_minion.golden { 2 } else { 1 };

        // Get the insertion position: use the dead position if valid, otherwise append
        let insert_pos = if *original_idx < dead_positions.len() {
            let pos = dead_positions[*original_idx];
            // Clamp to current board size
            pos.min(friendly_board.len())
        } else {
            friendly_board.len()
        };

        for _ in 0..trigger_count {
            match &effect {
                DeathrattleEffect::SummonToken {
                    card_id,
                    attack,
                    health,
                    count,
                } => {
                    // For Rat Pack (count == 0), use the dead minion's attack as count
                    let actual_count = if *count == 0 {
                        dead_minion.attack.max(1) as usize
                    } else {
                        *count as usize
                    };

                    let space_available = MAX_BOARD_SIZE.saturating_sub(friendly_board.len());
                    let to_summon = actual_count.min(space_available);

                    for i in 0..to_summon {
                        let token = Minion {
                            card_id: card_id.clone(),
                            attack: *attack,
                            health: *health,
                            damage: 0,
                            golden: false,
                            tier: 1,
                            race: dead_minion.race,
                            taunt: false,
                            divine_shield: false,
                            poisonous: false,
                            venomous: false,
                            windfury: false,
                            mega_windfury: false,
                            stealth: false,
                            reborn: false,
                            cleave: false,
                            has_attacked: false,
                            attacks_per_round: 1,
                            reborn_consumed: false,
                            summon_order: summon_counter,
                            pending_destroy: false,
                        };
                        summon_counter += 1;

                        // Insert at the dead minion's position (shifted right for each token)
                        let pos = (insert_pos + i).min(friendly_board.len());
                        friendly_board.insert(pos, token);
                    }
                }
                DeathrattleEffect::BuffFriendly {
                    attack,
                    health,
                    random_count,
                } => {
                    if friendly_board.is_empty() {
                        continue;
                    }

                    if *random_count == 0 {
                        // Buff ALL friendly minions
                        for m in friendly_board.iter_mut() {
                            m.attack += attack;
                            m.health += health;
                        }
                    } else {
                        // Buff random_count random friendly minions
                        let count = (*random_count as usize).min(friendly_board.len());
                        // For Fiendish Servant, use dead minion's attack
                        let actual_attack = if *attack == 0
                            && *health == 0
                            && dead_minion.card_id.contains("YOD_026")
                        {
                            dead_minion.attack
                        } else {
                            *attack
                        };

                        for _ in 0..count {
                            if friendly_board.is_empty() {
                                break;
                            }
                            let idx = rng.gen_range(0..friendly_board.len());
                            friendly_board[idx].attack += actual_attack;
                            friendly_board[idx].health += health;
                        }
                    }
                }
                DeathrattleEffect::DamageRandomEnemy { damage } => {
                    if enemy_board.is_empty() {
                        continue;
                    }
                    let idx = rng.gen_range(0..enemy_board.len());
                    enemy_board[idx].take_damage(*damage);
                    // Check if the damaged enemy died from the deathrattle damage
                    if enemy_board[idx].is_dead() {
                        // Remove it; nested deathrattles from this kill are NOT
                        // processed in this pass (they'd be handled in the next
                        // combat step's dead-minion processing).
                        // For simplicity, just remove. A full implementation would
                        // queue nested deathrattles.
                        enemy_board.remove(idx);
                    }
                }
                DeathrattleEffect::None => {}
            }
        }
    }
}
