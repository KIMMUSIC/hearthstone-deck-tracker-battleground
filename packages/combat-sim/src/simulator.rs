//! Core combat simulation engine.
//!
//! Runs Monte Carlo simulations of Battlegrounds combat to determine
//! win/loss/tie probabilities and damage distributions. Uses rayon
//! for parallel simulation across multiple threads.
//!
//! # Algorithm Overview
//!
//! Each simulation iteration:
//! 1. Clone the board state for both players
//! 2. Determine which player attacks first (fewer minions goes first, coin flip if equal)
//! 3. Combat loop:
//!    a. Select the next attacker (leftmost minion that hasn't attacked)
//!    b. Select a random defender (Taunt minions take priority)
//!    c. Resolve the attack (damage, divine shield, poisonous, cleave)
//!    d. Remove dead minions and process deathrattles (in summon order)
//!    e. Handle Reborn (resummon with 1 health)
//!    f. Swap attacking player
//!    g. Repeat until one or both boards are empty
//! 4. Calculate damage (tavern tier of surviving minions + hero tier)
//! 5. Record result (win/loss/tie + damage amount)

use std::collections::HashMap;

use rand::prelude::*;
use rand::rngs::SmallRng;
use rayon::prelude::*;

use crate::deathrattle::resolve_deathrattles;
use crate::input::{SimulationInput, SimulationOutput};
use crate::minion::Minion;

/// The combat simulator engine.
///
/// Configurable number of iterations and thread count for parallel
/// execution via rayon.
pub struct Simulator {
    /// Number of simulation iterations to run
    pub iterations: usize,
    /// Number of threads for parallel simulation (0 = use rayon default)
    pub thread_count: usize,
}

impl Simulator {
    /// Create a new simulator with default settings.
    ///
    /// Default: 10,000 iterations, using all available CPU cores.
    pub fn new() -> Self {
        Self {
            iterations: 10_000,
            thread_count: 0,
        }
    }

    /// Create a simulator with custom iteration count.
    pub fn with_iterations(iterations: usize) -> Self {
        Self {
            iterations,
            thread_count: 0,
        }
    }

    /// Run the combat simulation and return aggregated results.
    ///
    /// # Arguments
    /// * `input` - The simulation input containing both players' boards
    ///
    /// # Returns
    /// Aggregated `SimulationOutput` with win/loss/tie rates and damage distribution.
    pub fn simulate(&self, input: &SimulationInput) -> SimulationOutput {
        // Convert MinionInput -> Minion for both boards, assigning summon_order
        let player_board: Vec<Minion> = input
            .player
            .board
            .iter()
            .enumerate()
            .map(|(i, m)| {
                let mut minion = Minion::from_input(m);
                minion.summon_order = i;
                minion
            })
            .collect();

        let opponent_board: Vec<Minion> = input
            .opponent
            .board
            .iter()
            .enumerate()
            .map(|(i, m)| {
                let mut minion = Minion::from_input(m);
                minion.summon_order = i;
                minion
            })
            .collect();

        let player_tier = input.player.tier;
        let opponent_tier = input.opponent.tier;
        let player_health = input.player.health;
        let opponent_health = input.opponent.health;

        // Handle edge case: both boards empty
        if player_board.is_empty() && opponent_board.is_empty() {
            let mut damage_distribution = HashMap::new();
            damage_distribution.insert(0, 1.0);
            return SimulationOutput {
                win_rate: 0.0,
                loss_rate: 0.0,
                tie_rate: 1.0,
                my_death_rate: 0.0,
                their_death_rate: 0.0,
                damage_distribution,
                simulation_count: self.iterations as i32,
            };
        }

        // Handle edge case: one board empty
        if player_board.is_empty() {
            let damage: i32 = opponent_board.iter().map(|m| m.tier).sum::<i32>() + opponent_tier;
            let my_death_rate = if damage >= player_health { 1.0 } else { 0.0 };
            let mut damage_distribution = HashMap::new();
            damage_distribution.insert(-damage, 1.0);
            return SimulationOutput {
                win_rate: 0.0,
                loss_rate: 1.0,
                tie_rate: 0.0,
                my_death_rate,
                their_death_rate: 0.0,
                damage_distribution,
                simulation_count: self.iterations as i32,
            };
        }

        if opponent_board.is_empty() {
            let damage: i32 = player_board.iter().map(|m| m.tier).sum::<i32>() + player_tier;
            let their_death_rate = if damage >= opponent_health { 1.0 } else { 0.0 };
            let mut damage_distribution = HashMap::new();
            damage_distribution.insert(damage, 1.0);
            return SimulationOutput {
                win_rate: 1.0,
                loss_rate: 0.0,
                tie_rate: 0.0,
                my_death_rate: 0.0,
                their_death_rate,
                damage_distribution,
                simulation_count: self.iterations as i32,
            };
        }

        // Run iterations in parallel using rayon
        let results: Vec<CombatResult> = (0..self.iterations)
            .into_par_iter()
            .map(|_| {
                // Create a fast per-thread RNG seeded from thread_rng
                let mut rng = SmallRng::from_rng(thread_rng()).unwrap();

                // Clone boards for this iteration
                let mut p_board = player_board.clone();
                let mut o_board = opponent_board.clone();

                // Determine first attacker: player with fewer minions goes first.
                // If equal, random coin flip.
                let player_goes_first = if p_board.len() < o_board.len() {
                    true
                } else if o_board.len() < p_board.len() {
                    false
                } else {
                    rng.gen_bool(0.5)
                };

                // Run the combat loop
                run_combat(
                    &mut p_board,
                    &mut o_board,
                    player_goes_first,
                    &mut rng,
                );

                // Calculate result
                if p_board.is_empty() && o_board.is_empty() {
                    CombatResult::Tie
                } else if !p_board.is_empty() {
                    // Player won
                    let damage: i32 =
                        p_board.iter().map(|m| m.tier).sum::<i32>() + player_tier;
                    CombatResult::Win(damage)
                } else {
                    // Opponent won
                    let damage: i32 =
                        o_board.iter().map(|m| m.tier).sum::<i32>() + opponent_tier;
                    CombatResult::Loss(damage)
                }
            })
            .collect();

        // Aggregate results
        let total = results.len() as f64;
        let mut wins = 0u64;
        let mut losses = 0u64;
        let mut ties = 0u64;
        let mut my_deaths = 0u64;
        let mut their_deaths = 0u64;
        let mut damage_counts: HashMap<i32, u64> = HashMap::new();

        for result in &results {
            match result {
                CombatResult::Win(dmg) => {
                    wins += 1;
                    // Positive damage = dealt to opponent
                    *damage_counts.entry(*dmg).or_insert(0) += 1;
                    if *dmg >= opponent_health {
                        their_deaths += 1;
                    }
                }
                CombatResult::Loss(dmg) => {
                    losses += 1;
                    // Negative damage = taken by player
                    *damage_counts.entry(-*dmg).or_insert(0) += 1;
                    if *dmg >= player_health {
                        my_deaths += 1;
                    }
                }
                CombatResult::Tie => {
                    ties += 1;
                    *damage_counts.entry(0).or_insert(0) += 1;
                }
            }
        }

        // Build damage distribution as probabilities
        let damage_distribution: HashMap<i32, f64> = damage_counts
            .into_iter()
            .map(|(dmg, count)| (dmg, count as f64 / total))
            .collect();

        SimulationOutput {
            win_rate: wins as f64 / total,
            loss_rate: losses as f64 / total,
            tie_rate: ties as f64 / total,
            my_death_rate: my_deaths as f64 / total,
            their_death_rate: their_deaths as f64 / total,
            damage_distribution,
            simulation_count: self.iterations as i32,
        }
    }
}

/// Result of a single combat simulation iteration.
#[derive(Debug, Clone)]
pub enum CombatResult {
    /// Player won, dealing this much damage
    Win(i32),
    /// Player lost, taking this much damage
    Loss(i32),
    /// Combat was a tie (both boards empty simultaneously)
    Tie,
}

/// Maximum number of combat rounds before forcing a tie (safety valve).
const MAX_COMBAT_ROUNDS: usize = 200;

/// Run a single combat simulation to completion.
///
/// Mutates both boards in place. When this function returns,
/// at least one board (possibly both) will be empty.
fn run_combat(
    player_board: &mut Vec<Minion>,
    opponent_board: &mut Vec<Minion>,
    player_goes_first: bool,
    rng: &mut impl Rng,
) {
    let mut player_is_attacker = player_goes_first;
    let mut player_attack_idx: usize = 0;
    let mut opponent_attack_idx: usize = 0;
    let mut rounds: usize = 0;

    loop {
        // Safety valve to prevent infinite loops
        rounds += 1;
        if rounds > MAX_COMBAT_ROUNDS {
            break;
        }

        // Check if combat is over
        if player_board.is_empty() || opponent_board.is_empty() {
            break;
        }

        let (attacker_board, defender_board, attack_idx) = if player_is_attacker {
            (
                player_board as *mut Vec<Minion>,
                opponent_board as *mut Vec<Minion>,
                &mut player_attack_idx,
            )
        } else {
            (
                opponent_board as *mut Vec<Minion>,
                player_board as *mut Vec<Minion>,
                &mut opponent_attack_idx,
            )
        };

        // SAFETY: We never hold mutable references to both boards simultaneously
        // through these pointers. We always operate on one at a time or pass both
        // to functions that handle them correctly.
        let (a_board, d_board) = unsafe { (&mut *attacker_board, &mut *defender_board) };

        if a_board.is_empty() || d_board.is_empty() {
            break;
        }

        // Find the next minion that hasn't attacked
        let attacker_minion_idx = find_next_attacker(a_board, attack_idx);

        if let Some(a_idx) = attacker_minion_idx {
            // This minion is now attacking; if it has stealth, remove it
            a_board[a_idx].stealth = false;

            // Perform attacks (windfury = 2, mega windfury = 4)
            let attacks = a_board[a_idx].attacks_per_round;
            for _attack_num in 0..attacks {
                if a_board.is_empty() || d_board.is_empty() {
                    break;
                }

                // Check attacker is still alive (may have died from previous attack's retaliation)
                if a_idx >= a_board.len() || a_board[a_idx].is_dead() {
                    break;
                }

                // Select defender
                let d_idx = match select_defender(d_board, rng) {
                    Some(idx) => idx,
                    None => break,
                };

                // Resolve the attack
                resolve_attack(a_board, a_idx, d_board, d_idx, rng);

                // Process deaths, deathrattles, and reborns for BOTH boards
                process_deaths(a_board, d_board, rng);
                process_deaths(d_board, a_board, rng);

                // After processing deaths, check if attacker and defender boards changed
                if a_board.is_empty() || d_board.is_empty() {
                    break;
                }
            }

            // Mark this minion as having attacked (if it's still alive and on the board)
            if a_idx < a_board.len() && !a_board[a_idx].is_dead() {
                a_board[a_idx].has_attacked = true;
            }

            // Advance attack index
            *attack_idx = a_idx + 1;
        } else {
            // All minions have attacked this round; reset and start over
            for m in a_board.iter_mut() {
                m.reset_attack_state();
            }
            *attack_idx = 0;
        }

        // Swap attacker
        player_is_attacker = !player_is_attacker;
    }
}

/// Find the next minion that should attack.
///
/// Searches from `start_idx` forward (wrapping) for a minion that:
/// - Has not attacked this round
/// - Is alive
/// - Has attack > 0
///
/// Returns `None` if all minions have attacked this round.
fn find_next_attacker(board: &[Minion], start_idx: &usize) -> Option<usize> {
    let len = board.len();
    if len == 0 {
        return None;
    }

    // Search from start_idx forward
    let start = (*start_idx).min(len);
    for i in start..len {
        if !board[i].has_attacked && !board[i].is_dead() && board[i].attack > 0 {
            return Some(i);
        }
    }
    // Wrap around from beginning
    for i in 0..start {
        if !board[i].has_attacked && !board[i].is_dead() && board[i].attack > 0 {
            return Some(i);
        }
    }

    // All minions have attacked (or have 0 attack)
    // Check if there are any minions with 0 attack that haven't attacked
    // (they don't attack but we still need to detect "all attacked" state)
    let all_attacked_or_zero = board
        .iter()
        .all(|m| m.has_attacked || m.attack <= 0 || m.is_dead());
    if all_attacked_or_zero {
        None
    } else {
        // Shouldn't reach here, but just in case
        None
    }
}

/// Select a defender from the opposing board.
///
/// Priority: Taunt minions first (random among taunts).
/// Otherwise, random among all non-stealth minions.
/// If only stealth minions remain, attack a random stealth minion.
///
/// Returns `None` if the board is empty.
fn select_defender(board: &[Minion], rng: &mut impl Rng) -> Option<usize> {
    if board.is_empty() {
        return None;
    }

    // First check for taunt minions
    let taunt_indices: Vec<usize> = board
        .iter()
        .enumerate()
        .filter(|(_, m)| m.taunt && !m.is_dead())
        .map(|(i, _)| i)
        .collect();

    if !taunt_indices.is_empty() {
        let idx = taunt_indices[rng.gen_range(0..taunt_indices.len())];
        return Some(idx);
    }

    // No taunts — pick random non-stealth minion
    let non_stealth_indices: Vec<usize> = board
        .iter()
        .enumerate()
        .filter(|(_, m)| !m.stealth && !m.is_dead())
        .map(|(i, _)| i)
        .collect();

    if !non_stealth_indices.is_empty() {
        let idx = non_stealth_indices[rng.gen_range(0..non_stealth_indices.len())];
        return Some(idx);
    }

    // Only stealth minions remain — attack a random stealth minion
    let alive_indices: Vec<usize> = board
        .iter()
        .enumerate()
        .filter(|(_, m)| !m.is_dead())
        .map(|(i, _)| i)
        .collect();

    if !alive_indices.is_empty() {
        let idx = alive_indices[rng.gen_range(0..alive_indices.len())];
        Some(idx)
    } else {
        None
    }
}

/// Resolve an attack between an attacker and a defender.
///
/// Handles:
/// - Simultaneous damage (attacker damages defender, defender retaliates)
/// - Divine Shield (absorbs damage, removes shield)
/// - Poisonous / Venomous (kills target regardless of damage amount)
/// - Cleave (attacker also damages minions adjacent to defender)
fn resolve_attack(
    attacker_board: &mut Vec<Minion>,
    a_idx: usize,
    defender_board: &mut Vec<Minion>,
    d_idx: usize,
    _rng: &mut impl Rng,
) {
    let attacker_attack = attacker_board[a_idx].attack;
    let attacker_poisonous = attacker_board[a_idx].poisonous || attacker_board[a_idx].venomous;
    let attacker_cleave = attacker_board[a_idx].cleave;

    let defender_attack = defender_board[d_idx].attack;
    let defender_poisonous = defender_board[d_idx].poisonous || defender_board[d_idx].venomous;

    // --- Deal damage from attacker to defender ---
    if attacker_poisonous {
        defender_board[d_idx].take_damage_from_poisonous(attacker_attack);
    } else {
        defender_board[d_idx].take_damage(attacker_attack);
    }

    // --- Handle Cleave: damage adjacent minions ---
    if attacker_cleave {
        // Left neighbor
        if d_idx > 0 {
            let left_idx = d_idx - 1;
            if attacker_poisonous {
                defender_board[left_idx].take_damage_from_poisonous(attacker_attack);
            } else {
                defender_board[left_idx].take_damage(attacker_attack);
            }
        }
        // Right neighbor
        if d_idx + 1 < defender_board.len() {
            let right_idx = d_idx + 1;
            if attacker_poisonous {
                defender_board[right_idx].take_damage_from_poisonous(attacker_attack);
            } else {
                defender_board[right_idx].take_damage(attacker_attack);
            }
        }
    }

    // --- Deal retaliation damage from defender to attacker ---
    if defender_poisonous {
        attacker_board[a_idx].take_damage_from_poisonous(defender_attack);
    } else {
        attacker_board[a_idx].take_damage(defender_attack);
    }
}

/// Process deaths on a board: remove dead minions, trigger deathrattles, handle reborn.
///
/// # Arguments
/// * `board` - The board to check for dead minions
/// * `enemy_board` - The opposing board (for deathrattle effects that target enemies)
/// * `rng` - Random number generator
fn process_deaths(
    board: &mut Vec<Minion>,
    enemy_board: &mut Vec<Minion>,
    rng: &mut impl Rng,
) {
    // Collect dead minions and their positions
    let mut dead_minions: Vec<Minion> = Vec::new();
    let mut dead_positions: Vec<usize> = Vec::new();
    let mut reborn_minions: Vec<(usize, Minion)> = Vec::new();

    // Identify dead minions
    let mut i = 0;
    while i < board.len() {
        if board[i].is_dead() {
            let dead = board.remove(i);

            // Check if this minion has reborn
            if dead.reborn && !dead.reborn_consumed {
                let mut reborn_copy = dead.clone();
                reborn_copy.apply_reborn();
                reborn_minions.push((i, reborn_copy));
            }

            dead_positions.push(i);
            dead_minions.push(dead);
            // Don't increment i since we removed an element
        } else {
            i += 1;
        }
    }

    if dead_minions.is_empty() {
        return;
    }

    // Resolve deathrattles (in summon order)
    resolve_deathrattles(
        &dead_minions,
        board,
        enemy_board,
        &dead_positions,
        rng,
    );

    // Handle Reborn: resummon at their original positions
    // Process in reverse order so positions don't shift
    for (pos, reborn_minion) in reborn_minions.into_iter().rev() {
        if board.len() < 7 {
            let insert_pos = pos.min(board.len());
            board.insert(insert_pos, reborn_minion);
        }
    }
}
