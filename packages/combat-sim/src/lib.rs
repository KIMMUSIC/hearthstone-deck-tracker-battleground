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
//! const { runSimulation } = require('@bg-tracker/combat-sim');
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

use crate::input::{SimulationInput, SimulationOutput};
use crate::simulator::Simulator;

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
/// Returns an error if the input JSON is malformed or missing required fields.
#[napi]
pub async fn run_simulation(input_json: String) -> Result<String> {
    // Parse the JSON input
    let input: SimulationInput = serde_json::from_str(&input_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse simulation input: {}", e)))?;

    // Run the simulation
    let simulator = Simulator::new();
    let output = simulator.simulate(&input);

    // Serialize the output to JSON
    let output_json = serde_json::to_string(&output)
        .map_err(|e| Error::from_reason(format!("Failed to serialize simulation output: {}", e)))?;

    Ok(output_json)
}
