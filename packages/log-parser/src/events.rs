//! Event types emitted to Node.js via threadsafe callbacks.
//!
//! Each variant of `BgEvent` represents a distinct game event detected
//! by the log parser. Events are converted to napi Objects before being
//! sent across the FFI boundary to the Node.js callback.

use napi::bindgen_prelude::*;
use serde::Serialize;

/// All Battlegrounds events that can be emitted to the Node.js layer.
///
/// Each variant carries the relevant payload fields. The `to_js_object`
/// method serializes the event into a plain JS object with a `type` field
/// and event-specific data fields.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum BgEvent {
    GameStarted {
        game_mode: String,
    },
    HeroOffered {
        hero_card_ids: Vec<String>,
    },
    HeroSelected {
        hero_card_id: String,
    },
    TavernTierChanged {
        player_id: i32,
        tier: i32,
    },
    CombatStarted {
        turn: i32,
        opponent_hero_card_id: String,
    },
    CombatEnded {
        result: String,
        damage_delta: i32,
    },
    BoardStateSnapshot {
        turn: i32,
        /// JSON-serialized player board state
        player_board: String,
        /// JSON-serialized opponent board state
        opponent_board: String,
    },
    OpponentInfoUpdated {
        opponent_id: i32,
        hero_card_id: String,
        tavern_tier: i32,
        health: i32,
    },
    GameEnded {
        placement: i32,
        mmr_delta: i32,
    },
    RacesAvailable {
        races: Vec<i32>,
    },
    AnomalyDetected {
        card_id: String,
    },
    TriplesUpdated {
        player_id: i32,
        count: i32,
    },
    TurnChanged {
        turn: i32,
    },
    PhaseChanged {
        phase: String,
    },
}

impl BgEvent {
    /// Serialize this event to a JSON string.
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    /// Return the event variant name as a string.
    pub fn event_type(&self) -> &str {
        match self {
            BgEvent::GameStarted { .. } => "GameStarted",
            BgEvent::HeroOffered { .. } => "HeroOffered",
            BgEvent::HeroSelected { .. } => "HeroSelected",
            BgEvent::TavernTierChanged { .. } => "TavernTierChanged",
            BgEvent::CombatStarted { .. } => "CombatStarted",
            BgEvent::CombatEnded { .. } => "CombatEnded",
            BgEvent::BoardStateSnapshot { .. } => "BoardStateSnapshot",
            BgEvent::OpponentInfoUpdated { .. } => "OpponentInfoUpdated",
            BgEvent::GameEnded { .. } => "GameEnded",
            BgEvent::RacesAvailable { .. } => "RacesAvailable",
            BgEvent::AnomalyDetected { .. } => "AnomalyDetected",
            BgEvent::TriplesUpdated { .. } => "TriplesUpdated",
            BgEvent::TurnChanged { .. } => "TurnChanged",
            BgEvent::PhaseChanged { .. } => "PhaseChanged",
        }
    }

    /// Convert this event into a napi-compatible JS object.
    ///
    /// The returned object always has a `type` field (string) identifying
    /// the event kind, plus additional fields specific to that event.
    pub fn to_js_object(&self, env: Env) -> Result<napi::JsObject> {
        let mut obj = env.create_object()?;

        match self {
            BgEvent::GameStarted { game_mode } => {
                obj.set("type", "GameStarted")?;
                obj.set("gameMode", game_mode.as_str())?;
            }
            BgEvent::HeroOffered { hero_card_ids } => {
                obj.set("type", "HeroOffered")?;
                let mut arr = env.create_array(hero_card_ids.len() as u32)?;
                for (i, id) in hero_card_ids.iter().enumerate() {
                    arr.set(i as u32, env.create_string(id)?)?;
                }
                obj.set("heroCardIds", arr)?;
            }
            BgEvent::HeroSelected { hero_card_id } => {
                obj.set("type", "HeroSelected")?;
                obj.set("heroCardId", hero_card_id.as_str())?;
            }
            BgEvent::TavernTierChanged { player_id, tier } => {
                obj.set("type", "TavernTierChanged")?;
                obj.set("playerId", *player_id)?;
                obj.set("tier", *tier)?;
            }
            BgEvent::CombatStarted {
                turn,
                opponent_hero_card_id,
            } => {
                obj.set("type", "CombatStarted")?;
                obj.set("turn", *turn)?;
                obj.set("opponentHeroCardId", opponent_hero_card_id.as_str())?;
            }
            BgEvent::CombatEnded {
                result,
                damage_delta,
            } => {
                obj.set("type", "CombatEnded")?;
                obj.set("result", result.as_str())?;
                obj.set("damageDelta", *damage_delta)?;
            }
            BgEvent::BoardStateSnapshot {
                turn,
                player_board,
                opponent_board,
            } => {
                obj.set("type", "BoardStateSnapshot")?;
                obj.set("turn", *turn)?;
                obj.set("playerBoard", player_board.as_str())?;
                obj.set("opponentBoard", opponent_board.as_str())?;
            }
            BgEvent::OpponentInfoUpdated {
                opponent_id,
                hero_card_id,
                tavern_tier,
                health,
            } => {
                obj.set("type", "OpponentInfoUpdated")?;
                obj.set("opponentId", *opponent_id)?;
                obj.set("heroCardId", hero_card_id.as_str())?;
                obj.set("tavernTier", *tavern_tier)?;
                obj.set("health", *health)?;
            }
            BgEvent::GameEnded {
                placement,
                mmr_delta,
            } => {
                obj.set("type", "GameEnded")?;
                obj.set("placement", *placement)?;
                obj.set("mmrDelta", *mmr_delta)?;
            }
            BgEvent::RacesAvailable { races } => {
                obj.set("type", "RacesAvailable")?;
                let mut arr = env.create_array(races.len() as u32)?;
                for (i, race) in races.iter().enumerate() {
                    arr.set(i as u32, *race)?;
                }
                obj.set("races", arr)?;
            }
            BgEvent::AnomalyDetected { card_id } => {
                obj.set("type", "AnomalyDetected")?;
                obj.set("cardId", card_id.as_str())?;
            }
            BgEvent::TriplesUpdated { player_id, count } => {
                obj.set("type", "TriplesUpdated")?;
                obj.set("playerId", *player_id)?;
                obj.set("count", *count)?;
            }
            BgEvent::TurnChanged { turn } => {
                obj.set("type", "TurnChanged")?;
                obj.set("turn", *turn)?;
            }
            BgEvent::PhaseChanged { phase } => {
                obj.set("type", "PhaseChanged")?;
                obj.set("phase", phase.as_str())?;
            }
        }

        Ok(obj)
    }
}
