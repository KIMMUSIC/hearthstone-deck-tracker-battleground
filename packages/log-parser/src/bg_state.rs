//! Battlegrounds-specific state machine.
//!
//! Tracks the high-level BG game flow (lobby -> hero select -> shopping ->
//! combat -> game over) and maintains BG-specific state such as tavern tier,
//! opponent info, available races, and the anomaly card.
//!
//! This module consumes game state changes from `game_state` and produces
//! `BgEvent` variants that are sent to the Node.js layer.

use std::collections::HashMap;

use crate::events::BgEvent;

/// The current phase of a Battlegrounds game.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BgPhase {
    /// In the lobby, waiting for a game to start
    Lobby,
    /// Hero selection phase (choose from offered heroes)
    HeroSelect,
    /// Shopping phase (recruit, sell, position minions)
    Shopping,
    /// Combat phase (automated fights between players)
    Combat,
    /// Game has ended, placement determined
    GameOver,
}

/// Information about a single opponent in the lobby.
#[derive(Debug, Clone)]
pub struct OpponentInfo {
    /// The opponent's player ID
    pub player_id: i32,
    /// The hero card ID this opponent selected
    pub hero_card_id: String,
    /// Current tavern tier
    pub tavern_tier: i32,
    /// Current health
    pub health: i32,
    /// Whether this opponent is still alive
    pub is_alive: bool,
}

/// Battlegrounds-specific game state that sits on top of the raw GameState.
///
/// Tracks the game phase, turn number, player stats, and opponent info.
/// Emits `BgEvent` variants when significant state transitions occur.
pub struct BgState {
    /// Current game phase
    pub phase: BgPhase,
    /// Current turn number (increments each combat round)
    pub turn: i32,
    /// The local player's selected hero card ID
    pub player_hero: String,
    /// The local player's current tavern tier
    pub player_tavern_tier: i32,
    /// The local player's current health
    pub player_health: i32,
    /// Information about each opponent, keyed by player ID
    pub opponent_info: HashMap<i32, OpponentInfo>,
    /// Available minion races for this game (race enum values)
    pub available_races: Vec<i32>,
    /// The anomaly card ID if one is active, or None
    pub anomaly_card_id: Option<String>,
    /// Hero card IDs offered during hero selection
    pub offered_heroes: Vec<String>,
    /// The current combat opponent's hero card ID
    pub current_combat_opponent: Option<String>,
}

impl BgState {
    /// Create a new BgState in the Lobby phase.
    pub fn new() -> Self {
        Self {
            phase: BgPhase::Lobby,
            turn: 0,
            player_hero: String::new(),
            player_tavern_tier: 1,
            player_health: 40,
            opponent_info: HashMap::new(),
            available_races: Vec::new(),
            anomaly_card_id: None,
            offered_heroes: Vec::new(),
            current_combat_opponent: None,
        }
    }

    /// Reset the state for a new game.
    pub fn reset(&mut self) {
        self.phase = BgPhase::Lobby;
        self.turn = 0;
        self.player_hero.clear();
        self.player_tavern_tier = 1;
        self.player_health = 40;
        self.opponent_info.clear();
        self.available_races.clear();
        self.anomaly_card_id = None;
        self.offered_heroes.clear();
        self.current_combat_opponent = None;
    }

    /// Transition to a new phase, returning any events generated.
    ///
    /// # TODO
    /// - Validate that the transition is legal (e.g., can't go from Lobby to Combat)
    /// - Emit appropriate BgEvent for the transition
    /// - Update internal state (turn counter, etc.)
    pub fn transition(&mut self, new_phase: BgPhase) -> Vec<BgEvent> {
        let mut events = Vec::new();

        // TODO: Implement full transition logic with validation
        match (&self.phase, &new_phase) {
            (BgPhase::Lobby, BgPhase::HeroSelect) => {
                // Game has started, heroes are being offered
            }
            (BgPhase::HeroSelect, BgPhase::Shopping) => {
                // Hero selected, first shopping phase begins
                self.turn = 1;
            }
            (BgPhase::Shopping, BgPhase::Combat) => {
                // Combat begins
                if let Some(ref opp) = self.current_combat_opponent {
                    events.push(BgEvent::CombatStarted {
                        turn: self.turn,
                        opponent_hero_card_id: opp.clone(),
                    });
                }
            }
            (BgPhase::Combat, BgPhase::Shopping) => {
                // Combat ended, back to shopping
                self.turn += 1;
            }
            (_, BgPhase::GameOver) => {
                // Game ended from any phase
            }
            _ => {
                // Invalid or unexpected transition - log warning
            }
        }

        self.phase = new_phase;
        events
    }

    /// Capture a snapshot of the opponent's board state.
    ///
    /// # TODO
    /// - Read opponent's PLAY zone entities from GameState
    /// - Serialize minion stats (attack, health, buffs, keywords)
    /// - Return as JSON string for the BoardStateSnapshot event
    pub fn snapshot_opponent_board(&self) -> String {
        // TODO: Implement board snapshot serialization
        // 1. Get all entities in opponent's PLAY zone
        // 2. Extract minion stats and keywords
        // 3. Serialize to JSON
        String::from("[]")
    }

    /// Get a summary of the current BG state.
    ///
    /// # TODO
    /// - Return a structured view of phase, turn, health, tier, opponents
    pub fn get_current_state(&self) -> BgStateSummary {
        BgStateSummary {
            phase: self.phase.clone(),
            turn: self.turn,
            player_hero: self.player_hero.clone(),
            tavern_tier: self.player_tavern_tier,
            health: self.player_health,
            opponents_alive: self.opponent_info.values().filter(|o| o.is_alive).count() as i32,
        }
    }
}

/// A read-only summary of the current BG state.
#[derive(Debug, Clone)]
pub struct BgStateSummary {
    pub phase: BgPhase,
    pub turn: i32,
    pub player_hero: String,
    pub tavern_tier: i32,
    pub health: i32,
    pub opponents_alive: i32,
}
