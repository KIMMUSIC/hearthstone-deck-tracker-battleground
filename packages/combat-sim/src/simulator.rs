//! Core combat simulation engine.
//!
//! Runs Monte Carlo simulations of Battlegrounds combat to determine
//! win/loss/tie probabilities and damage distributions. Uses rayon
//! for parallel simulation across multiple threads.
//!
//! # Algorithm Overview (to be implemented)
//!
//! Each simulation iteration:
//! 1. Clone the board state for both players
//! 2. Resolve start-of-combat effects (e.g., Red Whelp)
//! 3. Determine which player attacks first (more minions, or coin flip)
//! 4. Combat loop:
//!    a. Select the next attacker (leftmost minion that hasn't attacked)
//!    b. Select a random defender (Taunt minions take priority)
//!    c. Resolve the attack (damage, divine shield, poisonous, cleave)
//!    d. Process deathrattles (in summon order)
//!    e. Process "after attack" triggers
//!    f. Check for dead minions and process deaths
//!    g. Swap attacking player
//!    h. Repeat until one or both boards are empty
//! 5. Calculate damage (tavern tier of surviving minions + hero tier)
//! 6. Record result (win/loss/tie + damage amount)

use std::collections::HashMap;

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
    ///
    /// # TODO
    /// - Clone board state per iteration
    /// - Implement the full combat loop (attacker selection, damage resolution)
    /// - Handle deathrattle chains (process in summon order, handle nested deaths)
    /// - Implement cleave (damage adjacent minions)
    /// - Handle Reborn (resummon with 1 health)
    /// - Calculate lethal damage correctly (sum of surviving minion tiers + hero tier)
    /// - Use rayon for parallel iteration execution
    /// - Track damage distribution across all iterations
    pub fn simulate(&self, input: &SimulationInput) -> SimulationOutput {
        // Stub implementation: return equal probabilities as placeholder
        // This will be replaced with the actual Monte Carlo simulation

        let _player_board: Vec<Minion> = input
            .player
            .board
            .iter()
            .map(Minion::from_input)
            .collect();

        let _opponent_board: Vec<Minion> = input
            .opponent
            .board
            .iter()
            .map(Minion::from_input)
            .collect();

        // Placeholder: 33.3% for each outcome
        let mut damage_distribution = HashMap::new();
        damage_distribution.insert(0, 1.0); // All ties with 0 damage as placeholder

        SimulationOutput {
            win_rate: 1.0 / 3.0,
            loss_rate: 1.0 / 3.0,
            tie_rate: 1.0 / 3.0,
            my_death_rate: 0.0,
            their_death_rate: 0.0,
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
