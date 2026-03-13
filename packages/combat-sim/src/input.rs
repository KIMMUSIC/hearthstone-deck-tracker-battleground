//! Input and output data structures for the combat simulator.
//!
//! These structs define the JSON interface between Node.js and the
//! Rust simulation engine. All structs derive Serialize/Deserialize
//! for seamless JSON conversion across the FFI boundary.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

/// Top-level input for a simulation run.
///
/// Contains both players' board states plus game-level context
/// (available races, anomaly, turn number).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationInput {
    /// The local player's board state
    pub player: PlayerInput,
    /// The opponent's board state
    pub opponent: PlayerInput,
    /// Minion races available in this game (race enum values)
    pub available_races: Vec<i32>,
    /// The anomaly card ID if one is active
    pub anomaly_card_id: Option<String>,
    /// Current turn number
    pub turn: i32,
}

/// A single player's board state input.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerInput {
    /// Current health
    pub health: i32,
    /// Current tavern tier
    pub tier: i32,
    /// Minions on the board (ordered left to right)
    pub board: Vec<MinionInput>,
    /// Hero power card ID, if any
    pub hero_power_card_id: Option<String>,
    /// Whether the hero power has been activated this turn
    pub hero_power_activated: bool,
}

/// A single minion's state for simulation input.
///
/// Contains all combat-relevant attributes. Field names use snake_case
/// for Rust convention; serde handles conversion to/from camelCase JSON.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinionInput {
    /// The card ID (e.g., "BG_DragonMinion_001")
    pub card_id: String,
    /// Current attack value
    pub attack: i32,
    /// Current health value
    pub health: i32,
    /// Damage taken (health - damage = effective health if needed)
    pub damage: i32,
    /// Whether this is a golden (tripled) minion
    pub golden: bool,
    /// Tavern tier of the minion
    pub tier: i32,
    /// Race enum value (0 = neutral, can be multi-race)
    pub race: i32,
    /// Has Taunt keyword
    pub taunt: bool,
    /// Has Divine Shield keyword
    pub divine_shield: bool,
    /// Has Poisonous keyword
    pub poisonous: bool,
    /// Has Venomous keyword (deals damage = target's health)
    pub venomous: bool,
    /// Has Windfury keyword (attacks twice)
    pub windfury: bool,
    /// Has Mega Windfury keyword (attacks four times)
    pub mega_windfury: bool,
    /// Has Stealth keyword
    pub stealth: bool,
    /// Has Reborn keyword
    pub reborn: bool,
    /// Has Cleave keyword (damages adjacent minions)
    pub cleave: bool,
}

/// Output of a simulation run containing win/loss/tie probabilities.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationOutput {
    /// Probability of the player winning (0.0 - 1.0)
    pub win_rate: f64,
    /// Probability of the player losing (0.0 - 1.0)
    pub loss_rate: f64,
    /// Probability of a tie (0.0 - 1.0)
    pub tie_rate: f64,
    /// Probability of the player dying this combat (0.0 - 1.0)
    pub my_death_rate: f64,
    /// Probability of the opponent dying this combat (0.0 - 1.0)
    pub their_death_rate: f64,
    /// Distribution of damage amounts to probabilities
    /// Positive values = damage dealt to opponent, negative = damage taken
    pub damage_distribution: HashMap<i32, f64>,
    /// Total number of simulations run
    pub simulation_count: i32,
}
