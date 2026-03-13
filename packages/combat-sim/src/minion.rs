//! Minion struct and combat mechanics.
//!
//! The `Minion` struct holds all combat-relevant state for a single minion
//! during simulation. The `MinionEffect` trait defines hooks for minions
//! with special abilities (e.g., on-attack triggers, deathrattles).

use crate::input::MinionInput;

/// A minion instance during combat simulation.
///
/// Unlike `MinionInput` (which is immutable input data), `Minion` is
/// mutable and tracks changes during the simulation (damage taken,
/// shields lost, death state, etc.).
#[derive(Debug, Clone)]
pub struct Minion {
    /// The card ID (e.g., "BG_DragonMinion_001")
    pub card_id: String,
    /// Current attack value (can be buffed during combat)
    pub attack: i32,
    /// Maximum health value
    pub health: i32,
    /// Damage taken so far
    pub damage: i32,
    /// Whether this is a golden (tripled) minion
    pub golden: bool,
    /// Tavern tier of the minion
    pub tier: i32,
    /// Race enum value
    pub race: i32,
    /// Has Taunt keyword
    pub taunt: bool,
    /// Has Divine Shield keyword (absorbs one hit)
    pub divine_shield: bool,
    /// Has Poisonous keyword (kills any minion it damages)
    pub poisonous: bool,
    /// Has Venomous keyword
    pub venomous: bool,
    /// Has Windfury keyword (attacks twice per round)
    pub windfury: bool,
    /// Has Mega Windfury keyword (attacks four times per round)
    pub mega_windfury: bool,
    /// Has Stealth keyword (can't be targeted by random attacks until first attack)
    pub stealth: bool,
    /// Has Reborn keyword (resummons with 1 health on death)
    pub reborn: bool,
    /// Has Cleave keyword (damages adjacent minions on attack)
    pub cleave: bool,
    /// Whether this minion has already attacked this round
    pub has_attacked: bool,
    /// Number of times this minion should attack per round
    pub attacks_per_round: i32,
    /// Whether the reborn has already been consumed
    pub reborn_consumed: bool,
}

impl Minion {
    /// Create a Minion from simulation input data.
    pub fn from_input(input: &MinionInput) -> Self {
        let attacks_per_round = if input.mega_windfury {
            4
        } else if input.windfury {
            2
        } else {
            1
        };

        Self {
            card_id: input.card_id.clone(),
            attack: input.attack,
            health: input.health,
            damage: input.damage,
            golden: input.golden,
            tier: input.tier,
            race: input.race,
            taunt: input.taunt,
            divine_shield: input.divine_shield,
            poisonous: input.poisonous,
            venomous: input.venomous,
            windfury: input.windfury,
            mega_windfury: input.mega_windfury,
            stealth: input.stealth,
            reborn: input.reborn,
            cleave: input.cleave,
            has_attacked: false,
            attacks_per_round,
            reborn_consumed: false,
        }
    }

    /// Deal damage to this minion. Returns true if the minion was killed.
    ///
    /// Handles Divine Shield absorption: if the minion has Divine Shield,
    /// the shield is removed and no damage is dealt.
    pub fn take_damage(&mut self, amount: i32) -> bool {
        if amount <= 0 {
            return false;
        }

        if self.divine_shield {
            self.divine_shield = false;
            return false;
        }

        self.damage += amount;
        !self.is_alive()
    }

    /// Check whether this minion is still alive.
    ///
    /// A minion is alive if its effective health (health - damage) is > 0.
    pub fn is_alive(&self) -> bool {
        self.health - self.damage > 0
    }

    /// Get the effective (remaining) health of this minion.
    pub fn effective_health(&self) -> i32 {
        self.health - self.damage
    }

    /// Reset the attack state for a new round.
    pub fn reset_attack_state(&mut self) {
        self.has_attacked = false;
    }
}

/// Trait for minions with special combat effects.
///
/// Implementing this trait allows a minion to hook into various
/// combat events. Not all minions need special effects; those that
/// do should implement only the relevant methods.
///
/// # TODO
/// Implement specific minion effects by card_id lookup. Each method
/// receives the combat state and can modify it (buff allies, damage
/// enemies, summon tokens, etc.).
pub trait MinionEffect {
    /// Called when this minion attacks.
    ///
    /// # TODO
    /// - Implement effects like "whenever this attacks" triggers
    fn on_attack(&self, _attacker: &Minion, _defender: &Minion) {
        // Default: no special effect
    }

    /// Called when this minion takes damage (after Divine Shield check).
    ///
    /// # TODO
    /// - Implement effects like "whenever this takes damage" triggers
    fn on_damage(&self, _target: &Minion, _amount: i32) {
        // Default: no special effect
    }

    /// Called when this minion dies.
    ///
    /// # TODO
    /// - Implement deathrattle effects
    /// - Handle Reborn resummon
    fn on_death(&self, _minion: &Minion) {
        // Default: no special effect
    }

    /// Called when a minion is summoned to the board.
    ///
    /// # TODO
    /// - Implement "whenever a minion is summoned" triggers
    fn on_summon(&self, _summoned: &Minion) {
        // Default: no special effect
    }

    /// Called at the start of combat (before any attacks).
    ///
    /// # TODO
    /// - Implement start-of-combat effects (e.g., Red Whelp)
    fn on_start_of_combat(&self) {
        // Default: no special effect
    }
}
