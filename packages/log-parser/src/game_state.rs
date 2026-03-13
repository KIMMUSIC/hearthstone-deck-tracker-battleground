//! Game state engine that tracks all entities and their tags.
//!
//! Maintains a complete picture of the Hearthstone game state by
//! processing parsed events from the log parser. Entities are stored
//! in a HashMap keyed by entity ID, and power blocks are tracked
//! via a stack to understand action context.
//!
//! This module handles the raw game state; BG-specific logic
//! (hero selection, tavern tier, combat phases) is handled by `bg_state`.

use std::collections::HashMap;

use crate::parser::ParsedEvent;

// ── GameTag constants ──────────────────────────────────────────────

pub const TAG_ZONE: i32 = 49;
pub const TAG_CONTROLLER: i32 = 50;
pub const TAG_CARDTYPE: i32 = 202;
pub const TAG_PLAYSTATE: i32 = 17;
pub const TAG_TURN: i32 = 20;
pub const TAG_STEP: i32 = 19;
pub const TAG_PLAYER_ID: i32 = 30;
pub const TAG_ATK: i32 = 47;
pub const TAG_HEALTH: i32 = 45;
pub const TAG_DAMAGE: i32 = 44;
pub const TAG_TAUNT: i32 = 190;
pub const TAG_DIVINE_SHIELD: i32 = 194;
pub const TAG_POISONOUS: i32 = 363;
pub const TAG_VENOMOUS: i32 = 2853;
pub const TAG_WINDFURY: i32 = 189;
pub const TAG_MEGA_WINDFURY: i32 = 1207;
pub const TAG_STEALTH: i32 = 191;
pub const TAG_REBORN: i32 = 1085;
pub const TAG_TECH_LEVEL: i32 = 1440;
pub const TAG_PLAYER_TECH_LEVEL: i32 = 1377;
pub const TAG_PLAYER_TRIPLES: i32 = 1447;
pub const TAG_BACON_HERO_CAN_BE_DRAFTED: i32 = 1491;
pub const TAG_BACON_GLOBAL_ANOMALY_DBID: i32 = 2897;
pub const TAG_NEXT_OPPONENT_PLAYER_ID: i32 = 1360;
pub const TAG_BACON_DUMMY_PLAYER: i32 = 1349;
pub const TAG_IS_BACON_POOL_MINION: i32 = 1456;
pub const TAG_HERO_ENTITY: i32 = 27;
pub const TAG_CARDRACE: i32 = 200;
pub const TAG_PREMIUM: i32 = 12;
pub const TAG_ARMOR: i32 = 292;
pub const TAG_EXHAUSTED: i32 = 43;
pub const TAG_ZONE_POSITION: i32 = 263;
pub const TAG_STATE: i32 = 204;
pub const TAG_MULLIGAN_STATE: i32 = 305;
pub const TAG_DEATHRATTLE: i32 = 217;
pub const TAG_START_OF_COMBAT: i32 = 1531;
pub const TAG_ATTACHED: i32 = 40;
pub const TAG_FIRST_PLAYER: i32 = 24;

// ── Zone value constants ───────────────────────────────────────────

pub const ZONE_PLAY: i32 = 1;
pub const ZONE_DECK: i32 = 2;
pub const ZONE_HAND: i32 = 3;
pub const ZONE_GRAVEYARD: i32 = 4;
pub const ZONE_SETASIDE: i32 = 6;

// ── PlayState constants ────────────────────────────────────────────

pub const PLAYSTATE_PLAYING: i32 = 1;
pub const PLAYSTATE_WON: i32 = 4;
pub const PLAYSTATE_LOST: i32 = 5;
pub const PLAYSTATE_CONCEDED: i32 = 8;

/// Information about a single tag change, for consumption by bg_state.
#[derive(Debug, Clone)]
pub struct TagChangeInfo {
    pub entity_id: i32,
    pub tag: i32,
    pub value: i32,
    pub old_value: i32,
}

/// Represents a single game entity (minion, hero, spell, enchantment, etc.)
#[derive(Debug, Clone)]
pub struct Entity {
    /// Unique entity ID assigned by the game
    pub id: i32,
    /// The card ID (e.g., "BG_DragonMinion_001") or empty if hidden
    pub card_id: String,
    /// All tags on this entity, keyed by tag enum value
    pub tags: HashMap<i32, i32>,
    /// Current zone (HAND, PLAY, GRAVEYARD, SETASIDE, etc.)
    pub zone: String,
    /// Display name of the entity
    pub name: String,
}

impl Entity {
    /// Create a new entity with the given ID.
    pub fn new(id: i32) -> Self {
        Self {
            id,
            card_id: String::new(),
            tags: HashMap::new(),
            zone: String::new(),
            name: String::new(),
        }
    }

    /// Get a tag value, returning 0 if not present.
    pub fn get_tag(&self, tag: i32) -> i32 {
        self.tags.get(&tag).copied().unwrap_or(0)
    }

    /// Set a tag value on this entity.
    pub fn set_tag(&mut self, tag: i32, value: i32) {
        self.tags.insert(tag, value);
    }
}

/// Represents a power block (ACTION, TRIGGER, DEATHS, etc.)
#[derive(Debug, Clone)]
pub struct Block {
    /// The block type (e.g., "PLAY", "ATTACK", "TRIGGER", "DEATHS")
    pub block_type: String,
    /// The entity that initiated this block
    pub entity: String,
}

/// Tracks the complete game state by processing parsed log events.
///
/// Maintains all entities and their tags, tracks the block stack
/// for understanding action context, and identifies the player
/// and opponent entity IDs.
pub struct GameState {
    /// All entities in the game, keyed by entity ID
    pub entities: HashMap<i32, Entity>,
    /// Stack of currently active power blocks
    pub block_stack: Vec<Block>,
    /// Entity ID of the local player's player entity
    pub player_entity_id: i32,
    /// Entity ID of the opponent's player entity
    pub opponent_entity_id: i32,
    /// The game entity ID (usually 1)
    pub game_entity_id: i32,
    /// The entity ID currently being created (for CreationTag processing)
    pub current_entity_id: i32,
    /// Mapping from player_id to entity_id
    pub player_map: HashMap<i32, i32>,
}

impl GameState {
    /// Create a new empty game state.
    pub fn new() -> Self {
        Self {
            entities: HashMap::new(),
            block_stack: Vec::new(),
            player_entity_id: 0,
            opponent_entity_id: 0,
            game_entity_id: 0,
            current_entity_id: 0,
            player_map: HashMap::new(),
        }
    }

    /// Reset the game state for a new game.
    pub fn reset(&mut self) {
        self.entities.clear();
        self.block_stack.clear();
        self.player_entity_id = 0;
        self.opponent_entity_id = 0;
        self.game_entity_id = 0;
        self.current_entity_id = 0;
        self.player_map.clear();
    }

    /// Parse a tag name string into its numeric GameTag constant.
    fn parse_tag_name(tag_name: &str) -> i32 {
        match tag_name {
            "ZONE" => TAG_ZONE,
            "CONTROLLER" => TAG_CONTROLLER,
            "CARDTYPE" => TAG_CARDTYPE,
            "PLAYSTATE" => TAG_PLAYSTATE,
            "TURN" => TAG_TURN,
            "STEP" => TAG_STEP,
            "PLAYER_ID" => TAG_PLAYER_ID,
            "ATK" => TAG_ATK,
            "HEALTH" => TAG_HEALTH,
            "DAMAGE" => TAG_DAMAGE,
            "TAUNT" => TAG_TAUNT,
            "DIVINE_SHIELD" => TAG_DIVINE_SHIELD,
            "POISONOUS" => TAG_POISONOUS,
            "VENOMOUS" => TAG_VENOMOUS,
            "WINDFURY" => TAG_WINDFURY,
            "MEGA_WINDFURY" => TAG_MEGA_WINDFURY,
            "STEALTH" => TAG_STEALTH,
            "REBORN" => TAG_REBORN,
            "TECH_LEVEL" => TAG_TECH_LEVEL,
            "PLAYER_TECH_LEVEL" => TAG_PLAYER_TECH_LEVEL,
            "PLAYER_TRIPLES" => TAG_PLAYER_TRIPLES,
            "BACON_HERO_CAN_BE_DRAFTED" => TAG_BACON_HERO_CAN_BE_DRAFTED,
            "BACON_GLOBAL_ANOMALY_DBID" => TAG_BACON_GLOBAL_ANOMALY_DBID,
            "NEXT_OPPONENT_PLAYER_ID" => TAG_NEXT_OPPONENT_PLAYER_ID,
            "BACON_DUMMY_PLAYER" => TAG_BACON_DUMMY_PLAYER,
            "IS_BACON_POOL_MINION" => TAG_IS_BACON_POOL_MINION,
            "HERO_ENTITY" => TAG_HERO_ENTITY,
            "CARDRACE" => TAG_CARDRACE,
            "PREMIUM" => TAG_PREMIUM,
            "ARMOR" => TAG_ARMOR,
            "EXHAUSTED" => TAG_EXHAUSTED,
            "ZONE_POSITION" => TAG_ZONE_POSITION,
            "STATE" => TAG_STATE,
            "MULLIGAN_STATE" => TAG_MULLIGAN_STATE,
            "DEATHRATTLE" => TAG_DEATHRATTLE,
            "START_OF_COMBAT" => TAG_START_OF_COMBAT,
            "ATTACHED" => TAG_ATTACHED,
            "FIRST_PLAYER" => TAG_FIRST_PLAYER,
            // Try parsing as a raw integer (some logs emit numeric tag IDs directly)
            other => other.parse::<i32>().unwrap_or(-1),
        }
    }

    /// Parse a tag value string into its numeric value.
    ///
    /// Handles known string enum values (zone names, play states) and
    /// falls back to numeric parsing.
    fn parse_tag_value(value_str: &str) -> i32 {
        match value_str {
            // Zone values
            "PLAY" => ZONE_PLAY,
            "DECK" => ZONE_DECK,
            "HAND" => ZONE_HAND,
            "GRAVEYARD" => ZONE_GRAVEYARD,
            "SETASIDE" => ZONE_SETASIDE,
            // PlayState values
            "WON" => PLAYSTATE_WON,
            "LOST" => PLAYSTATE_LOST,
            "CONCEDED" => PLAYSTATE_CONCEDED,
            "PLAYING" => PLAYSTATE_PLAYING,
            // Numeric fallback
            other => other.parse::<i32>().unwrap_or(0),
        }
    }

    /// Resolve an entity reference string to an entity ID.
    ///
    /// The entity field in TAG_CHANGE can be:
    /// - A numeric entity ID (e.g., "42")
    /// - An entity name (e.g., "GameEntity" or a player name)
    /// - A bracketed entity reference (e.g., "[entityName=... id=42 ...]")
    fn resolve_entity_id(&self, entity_ref: &str) -> i32 {
        // Try numeric parse first
        if let Ok(id) = entity_ref.parse::<i32>() {
            return id;
        }

        // Check for bracketed format: [entityName=... id=42 ...]
        if entity_ref.starts_with('[') {
            if let Some(id_start) = entity_ref.find("id=") {
                let after_id = &entity_ref[id_start + 3..];
                if let Some(end) = after_id.find(|c: char| !c.is_ascii_digit()) {
                    if let Ok(id) = after_id[..end].parse::<i32>() {
                        return id;
                    }
                } else if let Ok(id) = after_id.trim_end_matches(']').parse::<i32>() {
                    return id;
                }
            }
        }

        // Search entities by name
        if entity_ref == "GameEntity" {
            return self.game_entity_id;
        }

        for entity in self.entities.values() {
            if entity.name == entity_ref {
                return entity.id;
            }
        }

        // Not found
        0
    }

    /// Process a parsed event and update the game state accordingly.
    /// Returns a list of tag changes that occurred, for bg_state consumption.
    pub fn process_event(&mut self, event: &ParsedEvent) -> Vec<TagChangeInfo> {
        match event {
            ParsedEvent::GameEntity { entity_id } => {
                self.game_entity_id = *entity_id;
                self.current_entity_id = *entity_id;
                let ent = self.entities
                    .entry(*entity_id)
                    .or_insert_with(|| Entity::new(*entity_id));
                ent.name = "GameEntity".to_string();
                Vec::new()
            }
            ParsedEvent::PlayerEntity {
                entity_id,
                player_id,
            } => {
                self.current_entity_id = *entity_id;
                let ent = self.entities
                    .entry(*entity_id)
                    .or_insert_with(|| Entity::new(*entity_id));
                ent.set_tag(TAG_PLAYER_ID, *player_id);
                self.handle_player_entity(*entity_id, *player_id);
                Vec::new()
            }
            ParsedEvent::TagChange { entity, tag, value } => {
                self.handle_tag_change(entity, tag, value)
            }
            ParsedEvent::FullEntity {
                entity_name,
                id,
                zone,
                zone_pos,
                card_id,
                player,
            } => {
                self.handle_full_entity(*id, entity_name, card_id, zone, *zone_pos, *player);
                Vec::new()
            }
            ParsedEvent::ShowEntity { entity, card_id } => {
                self.handle_show_entity(entity, card_id);
                Vec::new()
            }
            ParsedEvent::BlockStart { block_type, entity } => {
                self.handle_block_start(block_type, entity);
                Vec::new()
            }
            ParsedEvent::BlockEnd => {
                self.handle_block_end();
                Vec::new()
            }
            ParsedEvent::CreationTag { tag, value } => {
                self.handle_creation_tag(tag, value);
                Vec::new()
            }
        }
    }

    /// Handle a TAG_CHANGE event by updating the entity's tag map.
    fn handle_tag_change(&mut self, entity_ref: &str, tag_name: &str, value_str: &str) -> Vec<TagChangeInfo> {
        let entity_id = self.resolve_entity_id(entity_ref);
        if entity_id == 0 {
            return Vec::new();
        }

        let tag = Self::parse_tag_name(tag_name);
        if tag == -1 {
            return Vec::new();
        }

        let value = Self::parse_tag_value(value_str);

        // Get old value before updating
        let old_value = self.entities
            .get(&entity_id)
            .map(|e| e.get_tag(tag))
            .unwrap_or(0);

        // Update the entity
        let entity = self.entities
            .entry(entity_id)
            .or_insert_with(|| Entity::new(entity_id));
        entity.set_tag(tag, value);

        // Update zone string if the ZONE tag changed
        if tag == TAG_ZONE {
            entity.zone = value_str.to_string();
        }

        vec![TagChangeInfo {
            entity_id,
            tag,
            value,
            old_value,
        }]
    }

    /// Handle a FULL_ENTITY event by creating or updating an entity.
    fn handle_full_entity(
        &mut self,
        id: i32,
        entity_name: &str,
        card_id: &str,
        zone: &str,
        zone_pos: i32,
        player: i32,
    ) {
        let entity = self.entities
            .entry(id)
            .or_insert_with(|| Entity::new(id));

        entity.card_id = card_id.to_string();
        entity.zone = zone.to_string();
        entity.name = entity_name.to_string();
        entity.set_tag(TAG_ZONE, Self::parse_tag_value(zone));
        entity.set_tag(TAG_ZONE_POSITION, zone_pos);
        entity.set_tag(TAG_CONTROLLER, player);

        // Track current entity for subsequent CreationTag lines
        self.current_entity_id = id;
    }

    /// Handle a SHOW_ENTITY event by updating an entity's card_id.
    fn handle_show_entity(&mut self, entity_ref: &str, card_id: &str) {
        let entity_id = self.resolve_entity_id(entity_ref);
        if entity_id == 0 {
            return;
        }

        let entity = self.entities
            .entry(entity_id)
            .or_insert_with(|| Entity::new(entity_id));

        if !card_id.is_empty() {
            entity.card_id = card_id.to_string();
        }

        // Track current entity for subsequent CreationTag lines
        self.current_entity_id = entity_id;
    }

    /// Handle a CreationTag by applying the tag to the current entity.
    fn handle_creation_tag(&mut self, tag_name: &str, value_str: &str) {
        if self.current_entity_id == 0 {
            return;
        }

        let tag = Self::parse_tag_name(tag_name);
        if tag == -1 {
            return;
        }
        let value = Self::parse_tag_value(value_str);

        if let Some(entity) = self.entities.get_mut(&self.current_entity_id) {
            entity.set_tag(tag, value);

            // Update zone string if it's a ZONE tag
            if tag == TAG_ZONE {
                entity.zone = value_str.to_string();
            }
        }
    }

    /// Store player_id → entity_id mapping.
    fn handle_player_entity(&mut self, entity_id: i32, player_id: i32) {
        self.player_map.insert(player_id, entity_id);

        // The first player entity we see is typically player 1.
        // The local player determination happens later via FIRST_PLAYER tag
        // or by detecting which player entity has certain BG-specific tags.
        // For now, store the mapping and let bg_state resolve ownership.
        if self.player_entity_id == 0 {
            self.player_entity_id = entity_id;
        } else if self.opponent_entity_id == 0 && entity_id != self.player_entity_id {
            self.opponent_entity_id = entity_id;
        }
    }

    /// Handle BLOCK_START by pushing a new block onto the stack.
    fn handle_block_start(&mut self, block_type: &str, entity: &str) {
        self.block_stack.push(Block {
            block_type: block_type.to_string(),
            entity: entity.to_string(),
        });
    }

    /// Handle BLOCK_END by popping the top block from the stack.
    fn handle_block_end(&mut self) {
        self.block_stack.pop();
    }

    /// Get the current innermost block type, if any.
    pub fn current_block_type(&self) -> Option<&str> {
        self.block_stack.last().map(|b| b.block_type.as_str())
    }

    /// Look up an entity by ID.
    pub fn get_entity(&self, id: i32) -> Option<&Entity> {
        self.entities.get(&id)
    }
}
