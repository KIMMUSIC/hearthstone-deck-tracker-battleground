//! Hearthstone Battlegrounds combat simulator - napi-rs native addon.
//!
//! Runs Monte Carlo simulations of Battlegrounds combat to predict
//! win/loss/tie probabilities and damage distributions. Uses Rayon
//! for parallel simulation across CPU cores for maximum performance.
//!
//! # Architecture
//!
//! - `input`: JSON input/output structures for the FFI boundary
//! - `simulator`: Core Monte Carlo simulation engine
//! - `minion`: Minion struct and combat mechanics
//! - `hero_power`: Hero power effects during combat
//! - `enchantment`: Buff/debuff system
//! - `deathrattle`: Death trigger resolution
//! - `trinket`: Trinket passive effects
//! - `anomaly`: Game-wide anomaly modifiers
//!
//! # Usage from Node.js
//!
//! ```js
//! const { runSimulation, setSimulationConfig } = require('@bg-tracker/combat-sim');
//!
//! // Optionally configure simulation parameters
//! setSimulationConfig(20000, 5000, 0); // 20k iterations, 5s timeout, auto threads
//!
//! const result = await runSimulation(JSON.stringify({
//!     player: { health: 30, tier: 4, board: [...], ... },
//!     opponent: { health: 25, tier: 3, board: [...], ... },
//!     available_races: [1, 2, 5, 14, 23],
//!     anomaly_card_id: null,
//!     turn: 8
//! }));
//! const output = JSON.parse(result);
//! console.log(`Win: ${output.win_rate}, Loss: ${output.loss_rate}`);
//! ```

#[macro_use]
extern crate napi_derive;

mod anomaly;
mod deathrattle;
mod enchantment;
mod hero_power;
mod input;
mod minion;
mod simulator;
mod trinket;

use napi::bindgen_prelude::*;
use parking_lot::Mutex;

use crate::input::SimulationInput;
use crate::simulator::Simulator;

/// Global simulation configuration, protected by a mutex.
static SIM_CONFIG: Mutex<SimConfig> = Mutex::new(SimConfig {
    iterations: 10_000,
    timeout_ms: 5_000,
    thread_count: 0,
});

/// Simulation configuration parameters.
struct SimConfig {
    /// Number of Monte Carlo iterations to run
    iterations: usize,
    /// Maximum time in milliseconds before aborting (reserved for future use)
    timeout_ms: u64,
    /// Number of threads for rayon (0 = use all available cores)
    thread_count: usize,
}

/// Set the simulation configuration parameters.
///
/// Call this before `runSimulation` to customize iteration count,
/// timeout, and thread count. Settings persist across simulation calls.
///
/// # Arguments
/// * `iterations` - Number of Monte Carlo iterations (must be > 0, default 10000)
/// * `timeout_ms` - Maximum simulation time in ms (must be > 0, default 5000)
/// * `thread_count` - Number of threads (0 = auto-detect, default 0)
///
/// # Errors
/// Returns an error if iterations or timeout_ms are <= 0.
#[napi]
pub fn set_simulation_config(
    iterations: i32,
    timeout_ms: i32,
    thread_count: i32,
) -> Result<()> {
    if iterations <= 0 {
        return Err(Error::from_reason(
            "iterations must be a positive integer".to_string(),
        ));
    }
    if timeout_ms <= 0 {
        return Err(Error::from_reason(
            "timeout_ms must be a positive integer".to_string(),
        ));
    }
    if thread_count < 0 {
        return Err(Error::from_reason(
            "thread_count must be >= 0 (0 = auto-detect)".to_string(),
        ));
    }

    let mut config = SIM_CONFIG.lock();
    config.iterations = iterations as usize;
    config.timeout_ms = timeout_ms as u64;
    config.thread_count = thread_count as usize;

    Ok(())
}

/// Run a combat simulation with the given input.
///
/// Takes a JSON string containing the simulation input (both players'
/// boards, game context) and returns a JSON string with the results
/// (win/loss/tie rates, damage distribution).
///
/// This function is async to avoid blocking the Node.js event loop
/// during long simulation runs. The actual simulation is CPU-bound
/// and uses Rayon for parallel execution.
///
/// # Arguments
/// * `input_json` - JSON string matching the `SimulationInput` schema
///
/// # Returns
/// JSON string matching the `SimulationOutput` schema
///
/// # Errors
/// Returns an error if the input JSON is malformed, missing required fields,
/// or contains invalid values (e.g., negative attack/health).
#[napi]
pub async fn run_simulation(input_json: String) -> Result<String> {
    // Parse the JSON input
    let input: SimulationInput = serde_json::from_str(&input_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse simulation input: {}", e)))?;

    // Validate input
    validate_input(&input)?;

    // Read config
    let config = SIM_CONFIG.lock();
    let iterations = config.iterations;
    let thread_count = config.thread_count;
    drop(config); // Release lock before simulation

    // Create simulator with config
    let mut simulator = Simulator::with_iterations(iterations);
    simulator.thread_count = thread_count;

    // Run the simulation
    let output = simulator.simulate(&input);

    // Serialize the output to JSON
    let output_json = serde_json::to_string(&output)
        .map_err(|e| Error::from_reason(format!("Failed to serialize simulation output: {}", e)))?;

    Ok(output_json)
}

/// Validate simulation input for correctness.
///
/// Checks:
/// - At least one side must have minions on the board
/// - All minion attack values must be >= 0
/// - All minion health values must be > 0
/// - Tier values must be >= 1
fn validate_input(input: &SimulationInput) -> Result<()> {
    // At least one side must have minions
    if input.player.board.is_empty() && input.opponent.board.is_empty() {
        return Err(Error::from_reason(
            "At least one side must have minions on the board".to_string(),
        ));
    }

    // Validate player board
    for (i, minion) in input.player.board.iter().enumerate() {
        if minion.attack < 0 {
            return Err(Error::from_reason(format!(
                "Player minion {} has negative attack: {}",
                i, minion.attack
            )));
        }
        if minion.health <= 0 {
            return Err(Error::from_reason(format!(
                "Player minion {} has non-positive health: {}",
                i, minion.health
            )));
        }
    }

    // Validate opponent board
    for (i, minion) in input.opponent.board.iter().enumerate() {
        if minion.attack < 0 {
            return Err(Error::from_reason(format!(
                "Opponent minion {} has negative attack: {}",
                i, minion.attack
            )));
        }
        if minion.health <= 0 {
            return Err(Error::from_reason(format!(
                "Opponent minion {} has non-positive health: {}",
                i, minion.health
            )));
        }
    }

    // Validate tiers
    if input.player.tier < 1 {
        return Err(Error::from_reason(format!(
            "Player tier must be >= 1, got {}",
            input.player.tier
        )));
    }
    if input.opponent.tier < 1 {
        return Err(Error::from_reason(format!(
            "Opponent tier must be >= 1, got {}",
            input.opponent.tier
        )));
    }

    Ok(())
}
