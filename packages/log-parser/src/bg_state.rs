//! Battlegrounds-specific state machine.
//!
//! Tracks the high-level BG game flow (lobby -> hero select -> shopping ->
//! combat -> game over) and maintains BG-specific state such as tavern tier,
//! opponent info, available races, and the anomaly card.
//!
//! This module consumes game state changes from `game_state` and produces
//! `BgEvent` variants that are sent to the Node.js layer.

use std::collections::{HashMap, HashSet};

use serde::Serialize;

use crate::events::BgEvent;
use crate::game_state::{
    self, GameState, TagChangeInfo,
    TAG_ZONE, TAG_HEALTH, TAG_DAMAGE, TAG_STEP, TAG_PLAYSTATE, TAG_TURN,
    TAG_PLAYER_TECH_LEVEL, TAG_PLAYER_TRIPLES, TAG_BACON_HERO_CAN_BE_DRAFTED,
    TAG_BACON_GLOBAL_ANOMALY_DBID, TAG_NEXT_OPPONENT_PLAYER_ID,
    TAG_IS_BACON_POOL_MINION, TAG_HERO_ENTITY, TAG_CARDRACE,
    TAG_PLAYER_ID, TAG_CARDTYPE,
    ZONE_PLAY, PLAYSTATE_WON, PLAYSTATE_LOST, PLAYSTATE_CONCEDED,
};

// ── Step constants ─────────────────────────────────────────────────

const STEP_MAIN_READY: i32 = 6;
const STEP_MAIN_COMBAT: i32 = 11;

/// The current phase of a Battlegrounds game.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
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

impl BgPhase {
    pub fn as_str(&self) -> &str {
        match self {
            BgPhase::Lobby => "Lobby",
            BgPhase::HeroSelect => "HeroSelect",
            BgPhase::Shopping => "Shopping",
            BgPhase::Combat => "Combat",
            BgPhase::GameOver => "GameOver",
        }
    }
}

/// Information about a single opponent in the lobby.
#[derive(Debug, Clone, Serialize)]
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

/// A read-only summary of the current BG state, serializable to JSON.
#[derive(Debug, Clone, Serialize)]
pub struct BgStateSummary {
    pub phase: BgPhase,
    pub turn: i32,
    pub player_hero: String,
    pub tavern_tier: i32,
    pub health: i32,
    pub opponents_alive: i32,
    pub anomaly_card_id: Option<String>,
    pub available_races: Vec<i32>,
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
    /// Set of races already seen (for dedup)
    races_seen: HashSet<i32>,
    /// The anomaly card ID if one is active, or None
    pub anomaly_card_id: Option<String>,
    /// Hero card IDs offered during hero selection
    pub offered_heroes: Vec<String>,
    /// Set of hero entity IDs already offered (for dedup)
    offered_hero_entity_ids: HashSet<i32>,
    /// The current combat opponent's player ID
    pub current_combat_opponent: Option<i32>,
    /// Entity ID of the local player's player entity
    pub player_entity_id: i32,
    /// The game entity ID
    pub game_entity_id: i32,
    /// The local player's player ID (from PLAYER_ID tag)
    pub player_player_id: i32,
    /// Triple counts per player_id
    triple_counts: HashMap<i32, i32>,
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
            races_seen: HashSet::new(),
            anomaly_card_id: None,
            offered_heroes: Vec::new(),
            offered_hero_entity_ids: HashSet::new(),
            current_combat_opponent: None,
            player_entity_id: 0,
            game_entity_id: 0,
            player_player_id: 0,
            triple_counts: HashMap::new(),
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
        self.races_seen.clear();
        self.anomaly_card_id = None;
        self.offered_heroes.clear();
        self.offered_hero_entity_ids.clear();
        self.current_combat_opponent = None;
        self.player_entity_id = 0;
        self.game_entity_id = 0;
        self.player_player_id = 0;
        self.triple_counts.clear();
    }

    /// Synchronize player/game entity IDs from the game state.
    fn sync_ids(&mut self, game_state: &GameState) {
        if self.game_entity_id == 0 {
            self.game_entity_id = game_state.game_entity_id;
        }
        if self.player_entity_id == 0 {
            self.player_entity_id = game_state.player_entity_id;
        }
        // Try to determine our player_id from our player entity
        if self.player_player_id == 0 && self.player_entity_id != 0 {
            if let Some(ent) = game_state.entities.get(&self.player_entity_id) {
                let pid = ent.get_tag(TAG_PLAYER_ID);
                if pid > 0 {
                    self.player_player_id = pid;
                }
            }
        }
    }

    /// Process a tag change and return any BG events generated.
    pub fn process_tag_change(&mut self, tc: &TagChangeInfo, game_state: &GameState) -> Vec<BgEvent> {
        self.sync_ids(game_state);
        let mut events = Vec::new();

        match tc.tag {
            // ── Hero drafting (hero selection phase) ────────────────
            TAG_BACON_HERO_CAN_BE_DRAFTED => {
                if tc.value == 1 {
                    // Collect the card_id of this hero entity
                    if let Some(ent) = game_state.entities.get(&tc.entity_id) {
                        if !ent.card_id.is_empty() && !self.offered_hero_entity_ids.contains(&tc.entity_id) {
                            self.offered_hero_entity_ids.insert(tc.entity_id);
                            self.offered_heroes.push(ent.card_id.clone());
                        }
                    }
                    // Transition to HeroSelect if we're in Lobby
                    if self.phase == BgPhase::Lobby {
                        events.extend(self.transition(BgPhase::HeroSelect));
                        // Emit hero offered after enough heroes collected
                        // (typically 2 or 4 heroes; emit each time we get a new one)
                        events.push(BgEvent::HeroOffered {
                            hero_card_ids: self.offered_heroes.clone(),
                        });
                    }
                }
            }

            // ── Tavern tier changes ────────────────────────────────
            TAG_PLAYER_TECH_LEVEL => {
                if tc.value > 0 && tc.value <= 6 {
                    // Determine which player this belongs to
                    let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                    events.push(BgEvent::TavernTierChanged {
                        player_id,
                        tier: tc.value,
                    });

                    // Update our own tavern tier
                    if player_id == self.player_player_id || tc.entity_id == self.player_entity_id {
                        self.player_tavern_tier = tc.value;
                    }

                    // Update opponent info
                    if player_id > 0 && player_id != self.player_player_id {
                        let opp = self.opponent_info.entry(player_id).or_insert_with(|| OpponentInfo {
                            player_id,
                            hero_card_id: String::new(),
                            tavern_tier: 1,
                            health: 40,
                            is_alive: true,
                        });
                        opp.tavern_tier = tc.value;
                    }
                }
            }

            // ── Triple count tracking ──────────────────────────────
            TAG_PLAYER_TRIPLES => {
                let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                self.triple_counts.insert(player_id, tc.value);
                events.push(BgEvent::TriplesUpdated {
                    player_id,
                    count: tc.value,
                });
            }

            // ── Anomaly detection ──────────────────────────────────
            TAG_BACON_GLOBAL_ANOMALY_DBID => {
                if tc.value > 0 {
                    // The value is a database ID; get the card_id from the entity
                    let card_id = game_state.entities.get(&tc.entity_id)
                        .map(|e| e.card_id.clone())
                        .unwrap_or_else(|| tc.value.to_string());
                    let card_id_str = if card_id.is_empty() { tc.value.to_string() } else { card_id };
                    self.anomaly_card_id = Some(card_id_str.clone());
                    events.push(BgEvent::AnomalyDetected {
                        card_id: card_id_str,
                    });
                }
            }

            // ── Next opponent tracking ─────────────────────────────
            TAG_NEXT_OPPONENT_PLAYER_ID => {
                if tc.value > 0 {
                    self.current_combat_opponent = Some(tc.value);
                }
            }

            // ── Step changes (phase transitions) ───────────────────
            TAG_STEP => {
                if tc.value == STEP_MAIN_COMBAT {
                    // Transition to Combat phase
                    if self.phase == BgPhase::Shopping || self.phase == BgPhase::HeroSelect {
                        events.extend(self.transition(BgPhase::Combat));
                    }
                } else if tc.value == STEP_MAIN_READY {
                    // Transition to Shopping phase (after combat)
                    if self.phase == BgPhase::Combat {
                        events.extend(self.transition(BgPhase::Shopping));
                    }
                }
            }

            // ── Turn tracking ──────────────────────────────────────
            TAG_TURN => {
                if tc.entity_id == self.game_entity_id && tc.value > 0 {
                    // BG turns: each full turn increments by 2 (one for each "player")
                    // The actual round number is (turn + 1) / 2
                    let round = (tc.value + 1) / 2;
                    if round != self.turn {
                        self.turn = round;
                        events.push(BgEvent::TurnChanged { turn: self.turn });
                    }
                }
            }

            // ── Play state (game end detection) ────────────────────
            TAG_PLAYSTATE => {
                if tc.value == PLAYSTATE_WON || tc.value == PLAYSTATE_LOST || tc.value == PLAYSTATE_CONCEDED {
                    // Check if this is the game entity or our player entity
                    if tc.entity_id == self.game_entity_id
                        || tc.entity_id == self.player_entity_id
                    {
                        if self.phase != BgPhase::GameOver {
                            let placement = self.calculate_placement(game_state);
                            events.extend(self.transition(BgPhase::GameOver));
                            events.push(BgEvent::GameEnded {
                                placement,
                                mmr_delta: 0, // MMR delta not available from logs
                            });
                        }
                    } else {
                        // An opponent died
                        let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                        if player_id > 0 {
                            if let Some(opp) = self.opponent_info.get_mut(&player_id) {
                                opp.is_alive = false;
                                opp.health = 0;
                            }
                        }
                    }
                }
            }

            // ── Zone transitions ───────────────────────────────────
            TAG_ZONE => {
                // Track entities moving to PLAY zone for board state
                if tc.value == ZONE_PLAY {
                    // Entity entered the play zone - could be minion placement
                }
            }

            // ── Pool minion race detection ─────────────────────────
            TAG_IS_BACON_POOL_MINION => {
                if tc.value == 1 {
                    // This entity is a BG pool minion; collect its race
                    if let Some(ent) = game_state.entities.get(&tc.entity_id) {
                        let race = ent.get_tag(TAG_CARDRACE);
                        if race > 0 && !self.races_seen.contains(&race) {
                            self.races_seen.insert(race);
                            self.available_races.push(race);
                            events.push(BgEvent::RacesAvailable {
                                races: self.available_races.clone(),
                            });
                        }
                    }
                }
            }

            // ── Health tracking ────────────────────────────────────
            TAG_HEALTH => {
                let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                if player_id > 0 {
                    self.update_player_health(tc.entity_id, player_id, game_state);
                }
            }

            // ── Damage tracking ────────────────────────────────────
            TAG_DAMAGE => {
                let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                if player_id > 0 {
                    self.update_player_health(tc.entity_id, player_id, game_state);
                }
            }

            // ── Hero entity identification ─────────────────────────
            TAG_HERO_ENTITY => {
                if tc.value > 0 {
                    // This player entity's hero is being set
                    if tc.entity_id == self.player_entity_id {
                        if let Some(hero_ent) = game_state.entities.get(&tc.value) {
                            if !hero_ent.card_id.is_empty() {
                                self.player_hero = hero_ent.card_id.clone();
                                events.push(BgEvent::HeroSelected {
                                    hero_card_id: self.player_hero.clone(),
                                });
                            }
                        }
                    } else {
                        // Opponent hero assignment
                        let player_id = self.get_player_id_for_entity(tc.entity_id, game_state);
                        if player_id > 0 && player_id != self.player_player_id {
                            let hero_card_id = game_state.entities.get(&tc.value)
                                .map(|e| e.card_id.clone())
                                .unwrap_or_default();
                            let opp = self.opponent_info.entry(player_id).or_insert_with(|| OpponentInfo {
                                player_id,
                                hero_card_id: String::new(),
                                tavern_tier: 1,
                                health: 40,
                                is_alive: true,
                            });
                            if !hero_card_id.is_empty() {
                                opp.hero_card_id = hero_card_id.clone();
                                events.push(BgEvent::OpponentInfoUpdated {
                                    opponent_id: player_id,
                                    hero_card_id,
                                    tavern_tier: opp.tavern_tier,
                                    health: opp.health,
                                });
                            }
                        }
                    }
                }
            }

            _ => {}
        }

        events
    }

    /// Get the player_id for a given entity_id by looking at the PLAYER_ID tag
    /// or the player_map in game_state.
    fn get_player_id_for_entity(&self, entity_id: i32, game_state: &GameState) -> i32 {
        // Check if the entity itself has a PLAYER_ID tag (player entities do)
        if let Some(ent) = game_state.entities.get(&entity_id) {
            let pid = ent.get_tag(TAG_PLAYER_ID);
            if pid > 0 {
                return pid;
            }
        }

        // Check reverse lookup from player_map
        for (&player_id, &eid) in &game_state.player_map {
            if eid == entity_id {
                return player_id;
            }
        }

        0
    }

    /// Update player/opponent health from HEALTH and DAMAGE tags.
    fn update_player_health(&mut self, entity_id: i32, player_id: i32, game_state: &GameState) {
        if let Some(ent) = game_state.entities.get(&entity_id) {
            // Effective health = HEALTH - DAMAGE
            let health = ent.get_tag(TAG_HEALTH);
            let damage = ent.get_tag(TAG_DAMAGE);
            let effective_health = health - damage;

            if player_id == self.player_player_id || entity_id == self.player_entity_id {
                self.player_health = effective_health;
            } else if player_id > 0 {
                if let Some(opp) = self.opponent_info.get_mut(&player_id) {
                    opp.health = effective_health;
                    if effective_health <= 0 {
                        opp.is_alive = false;
                    }
                }
            }
        }
    }

    /// Calculate approximate placement based on surviving opponents.
    fn calculate_placement(&self, _game_state: &GameState) -> i32 {
        // Count alive opponents + 1 (our position)
        let alive = self.opponent_info.values().filter(|o| o.is_alive).count() as i32;
        // If we died, our placement is alive_opponents + 1
        // (since those still alive placed higher)
        alive + 1
    }

    /// Transition to a new phase, returning any events generated.
    pub fn transition(&mut self, new_phase: BgPhase) -> Vec<BgEvent> {
        let mut events = Vec::new();

        match (&self.phase, &new_phase) {
            (BgPhase::Lobby, BgPhase::HeroSelect) => {
                // Game has started, heroes are being offered
                events.push(BgEvent::GameStarted {
                    game_mode: "Battlegrounds".to_string(),
                });
            }
            (BgPhase::HeroSelect, BgPhase::Shopping) => {
                // Hero selected, first shopping phase begins
                self.turn = 1;
            }
            (BgPhase::HeroSelect, BgPhase::Combat) => {
                // Direct to combat (skip shopping on first turn sometimes)
                self.turn = 1;
                if let Some(opp_pid) = self.current_combat_opponent {
                    let opp_hero = self.opponent_info.get(&opp_pid)
                        .map(|o| o.hero_card_id.clone())
                        .unwrap_or_default();
                    events.push(BgEvent::CombatStarted {
                        turn: self.turn,
                        opponent_hero_card_id: opp_hero,
                    });
                }
            }
            (BgPhase::Shopping, BgPhase::Combat) => {
                // Combat begins
                let opp_hero = self.current_combat_opponent
                    .and_then(|pid| self.opponent_info.get(&pid))
                    .map(|o| o.hero_card_id.clone())
                    .unwrap_or_default();
                events.push(BgEvent::CombatStarted {
                    turn: self.turn,
                    opponent_hero_card_id: opp_hero,
                });
            }
            (BgPhase::Combat, BgPhase::Shopping) => {
                // Combat ended, back to shopping
                self.turn += 1;
            }
            (_, BgPhase::GameOver) => {
                // Game ended from any phase
            }
            _ => {
                // Unexpected transition, allow it but don't emit phase-specific events
            }
        }

        // Always emit a PhaseChanged event
        events.push(BgEvent::PhaseChanged {
            phase: new_phase.as_str().to_string(),
        });

        self.phase = new_phase;
        events
    }

    /// Capture a snapshot of the opponent's board state.
    pub fn snapshot_opponent_board(&self, game_state: &GameState) -> String {
        if let Some(opp_pid) = self.current_combat_opponent {
            // Find opponent's entity_id
            if let Some(&opp_eid) = game_state.player_map.get(&opp_pid) {
                let minions: Vec<_> = game_state.entities.values()
                    .filter(|e| {
                        e.get_tag(game_state::TAG_CONTROLLER) == opp_pid
                            && e.get_tag(TAG_ZONE) == ZONE_PLAY
                            && e.get_tag(TAG_CARDTYPE) == 4 // MINION
                    })
                    .map(|e| {
                        serde_json::json!({
                            "card_id": e.card_id,
                            "attack": e.get_tag(game_state::TAG_ATK),
                            "health": e.get_tag(TAG_HEALTH),
                            "taunt": e.get_tag(game_state::TAG_TAUNT) > 0,
                            "divine_shield": e.get_tag(game_state::TAG_DIVINE_SHIELD) > 0,
                            "poisonous": e.get_tag(game_state::TAG_POISONOUS) > 0,
                            "reborn": e.get_tag(game_state::TAG_REBORN) > 0,
                        })
                    })
                    .collect();
                let _ = opp_eid; // used for lookup
                return serde_json::to_string(&minions).unwrap_or_else(|_| "[]".to_string());
            }
        }
        "[]".to_string()
    }

    /// Get a summary of the current BG state.
    pub fn get_current_state(&self) -> BgStateSummary {
        BgStateSummary {
            phase: self.phase.clone(),
            turn: self.turn,
            player_hero: self.player_hero.clone(),
            tavern_tier: self.player_tavern_tier,
            health: self.player_health,
            opponents_alive: self.opponent_info.values().filter(|o| o.is_alive).count() as i32,
            anomaly_card_id: self.anomaly_card_id.clone(),
            available_races: self.available_races.clone(),
        }
    }
}
