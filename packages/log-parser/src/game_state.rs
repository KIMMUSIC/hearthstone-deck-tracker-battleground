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

/// Represents a single game entity (minion, hero, spell, enchantment, etc.)
#[derive(Debug, Clone)]
pub struct Entity {
    /// Unique entity ID assigned by the game
    pub id: i32,
    /// The card ID (e.g., "BG_DragonMinion_001") or empty if hidden
    pub card_id: String,
    /// All tags on this entity, keyed by tag enum value
    /// Common tags: ZONE (49), CONTROLLER (50), CARDTYPE (202), etc.
    pub tags: HashMap<i32, i32>,
    /// Current zone (HAND, PLAY, GRAVEYARD, SETASIDE, etc.)
    pub zone: String,
}

impl Entity {
    /// Create a new entity with the given ID.
    pub fn new(id: i32) -> Self {
        Self {
            id,
            card_id: String::new(),
            tags: HashMap::new(),
            zone: String::new(),
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
        }
    }

    /// Reset the game state for a new game.
    pub fn reset(&mut self) {
        self.entities.clear();
        self.block_stack.clear();
        self.player_entity_id = 0;
        self.opponent_entity_id = 0;
        self.game_entity_id = 0;
    }

    /// Process a parsed event and update the game state accordingly.
    pub fn process_event(&mut self, event: &ParsedEvent) {
        match event {
            ParsedEvent::GameEntity { entity_id } => {
                self.game_entity_id = *entity_id;
                self.entities
                    .entry(*entity_id)
                    .or_insert_with(|| Entity::new(*entity_id));
            }
            ParsedEvent::PlayerEntity {
                entity_id,
                player_id: _,
            } => {
                self.entities
                    .entry(*entity_id)
                    .or_insert_with(|| Entity::new(*entity_id));
            }
            ParsedEvent::TagChange { entity: _, tag: _, value: _ } => {
                self.handle_tag_change(event);
            }
            ParsedEvent::FullEntity { id, .. } => {
                self.handle_full_entity(event);
                let _ = id; // suppress unused warning
            }
            ParsedEvent::BlockStart { .. } => {
                self.handle_block_start(event);
            }
            ParsedEvent::BlockEnd => {
                self.handle_block_end();
            }
            ParsedEvent::CreationTag { .. } => {
                // Creation tags are processed in context of the most recent
                // FULL_ENTITY; handled by handle_full_entity's follow-up
            }
        }
    }

    /// Handle a TAG_CHANGE event by updating the entity's tag map.
    ///
    /// # TODO
    /// - Resolve entity references (by name or by ID)
    /// - Parse tag names to numeric tag IDs
    /// - Parse tag values to numeric values
    /// - Detect zone transitions and emit appropriate state changes
    fn handle_tag_change(&mut self, _event: &ParsedEvent) {
        // TODO: Implement tag change handling
        // 1. Resolve entity reference to entity ID
        // 2. Parse tag name to numeric enum value
        // 3. Parse value to numeric value
        // 4. Update entity.tags
        // 5. Check for zone transitions (ZONE tag changes)
        // 6. Notify bg_state of relevant changes
    }

    /// Handle a FULL_ENTITY event by creating or updating an entity.
    ///
    /// # TODO
    /// - Create new Entity with the given ID and card_id
    /// - Set initial zone and zone position
    /// - Process subsequent CreationTag lines to populate tags
    fn handle_full_entity(&mut self, _event: &ParsedEvent) {
        // TODO: Implement full entity handling
        // 1. Create Entity with id and card_id
        // 2. Set zone and zone_pos
        // 3. Insert into entities map
        // 4. Following CreationTag events fill in tags
    }

    /// Handle BLOCK_START by pushing a new block onto the stack.
    ///
    /// Block context is important for understanding what action
    /// triggered tag changes (e.g., ATTACK block means combat damage).
    fn handle_block_start(&mut self, event: &ParsedEvent) {
        if let ParsedEvent::BlockStart { block_type, entity } = event {
            self.block_stack.push(Block {
                block_type: block_type.clone(),
                entity: entity.clone(),
            });
        }
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
