//! Line parser for Hearthstone's Power.log format.
//!
//! Uses pre-compiled regex patterns (via `once_cell`) to parse individual
//! log lines into structured `ParsedEvent` variants. The patterns match
//! HDT's LogConstants for compatibility with the known log format.
//!
//! Each line in the log follows a format like:
//!   D HH:MM:SS.mmm PowerTaskList.DebugPrintPower() - TAG_CHANGE ...
//!   D HH:MM:SS.mmm GameState.DebugPrintGame() - GameEntity ...

use once_cell::sync::Lazy;
use regex::Regex;

// -- Pre-compiled regex patterns matching HDT's LogConstants --

/// Matches GameEntity lines: `GameEntity EntityID=<id>`
static RE_GAME_ENTITY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"GameEntity\s+EntityID=(\d+)").expect("Invalid GameEntity regex")
});

/// Matches Player entity lines: `Player EntityID=<id> PlayerID=<pid> GameAccountId=...`
static RE_PLAYER_ENTITY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Player\s+EntityID=(\d+)\s+PlayerID=(\d+)").expect("Invalid PlayerEntity regex")
});

/// Matches TAG_CHANGE lines: `TAG_CHANGE Entity=<entity> tag=<tag> value=<value>`
static RE_TAG_CHANGE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"TAG_CHANGE\s+Entity=(.+?)\s+tag=(\w+)\s+value=(\w+)")
        .expect("Invalid TagChange regex")
});

/// Matches FULL_ENTITY lines: `FULL_ENTITY - Updating [entityName=... id=<id> ...]`
static RE_FULL_ENTITY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"FULL_ENTITY\s+-\s+(?:Updating|Creating)\s+\[entityName=(.+?)\s+id=(\d+)\s+zone=(\w+)\s+zonePos=(\d+)\s+cardId=(\w*)\s+player=(\d+)\]")
        .expect("Invalid FullEntity regex")
});

/// Matches SHOW_ENTITY lines: `SHOW_ENTITY - Updating Entity=<entity> CardID=<card_id>`
static RE_SHOW_ENTITY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"SHOW_ENTITY\s+-\s+Updating\s+Entity=(.+)\s+CardID=(\w*)")
        .expect("Invalid ShowEntity regex")
});

/// Matches BLOCK_START lines: `BLOCK_START BlockType=<type> Entity=<entity> ...`
static RE_BLOCK_START: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"BLOCK_START\s+BlockType=(\w+)\s+Entity=(.+?)\s+")
        .expect("Invalid BlockStart regex")
});

/// Matches BLOCK_END lines
static RE_BLOCK_END: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"BLOCK_END").expect("Invalid BlockEnd regex")
});

/// Matches tag lines inside entity blocks: `tag=<tag> value=<value>`
static RE_CREATION_TAG: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^\s+tag=(\w+)\s+value=(\w+)").expect("Invalid CreationTag regex")
});

/// Represents a parsed event extracted from a single log line.
#[derive(Debug, Clone)]
pub enum ParsedEvent {
    /// The game entity definition line
    GameEntity {
        entity_id: i32,
    },
    /// A player entity definition line
    PlayerEntity {
        entity_id: i32,
        player_id: i32,
    },
    /// A tag change on an entity
    TagChange {
        entity: String,
        tag: String,
        value: String,
    },
    /// A full entity creation or update
    FullEntity {
        entity_name: String,
        id: i32,
        zone: String,
        zone_pos: i32,
        card_id: String,
        player: i32,
    },
    /// A show entity update (reveals card identity)
    ShowEntity {
        entity: String,
        card_id: String,
    },
    /// Start of a power block
    BlockStart {
        block_type: String,
        entity: String,
    },
    /// End of a power block
    BlockEnd,
    /// A tag within an entity creation block
    CreationTag {
        tag: String,
        value: String,
    },
}

/// Stateless line parser that converts raw log lines into structured events.
///
/// Uses pre-compiled regex patterns for performance. Each call to
/// `parse_line` is independent and does not maintain state between calls.
pub struct LogLineParser;

impl LogLineParser {
    /// Create a new LogLineParser instance.
    pub fn new() -> Self {
        Self
    }

    /// Attempt to parse a single log line into a structured event.
    ///
    /// Returns `None` if the line does not match any known pattern.
    /// Lines are tried against patterns in priority order:
    /// 1. TAG_CHANGE (most frequent)
    /// 2. FULL_ENTITY
    /// 3. SHOW_ENTITY
    /// 4. BLOCK_START / BLOCK_END
    /// 5. GameEntity / PlayerEntity
    /// 6. CreationTag (indented tag lines)
    pub fn parse_line(&self, line: &str) -> Option<ParsedEvent> {
        // TAG_CHANGE is the most frequent event, check first
        if let Some(caps) = RE_TAG_CHANGE.captures(line) {
            return Some(ParsedEvent::TagChange {
                entity: caps[1].to_string(),
                tag: caps[2].to_string(),
                value: caps[3].to_string(),
            });
        }

        // FULL_ENTITY - entity creation/update
        if let Some(caps) = RE_FULL_ENTITY.captures(line) {
            return Some(ParsedEvent::FullEntity {
                entity_name: caps[1].to_string(),
                id: caps[2].parse().unwrap_or(0),
                zone: caps[3].to_string(),
                zone_pos: caps[4].parse().unwrap_or(0),
                card_id: caps[5].to_string(),
                player: caps[6].parse().unwrap_or(0),
            });
        }

        // SHOW_ENTITY - entity reveal
        if let Some(caps) = RE_SHOW_ENTITY.captures(line) {
            return Some(ParsedEvent::ShowEntity {
                entity: caps[1].to_string(),
                card_id: caps[2].to_string(),
            });
        }

        // BLOCK_START
        if let Some(caps) = RE_BLOCK_START.captures(line) {
            return Some(ParsedEvent::BlockStart {
                block_type: caps[1].to_string(),
                entity: caps[2].to_string(),
            });
        }

        // BLOCK_END
        if RE_BLOCK_END.is_match(line) && line.trim().ends_with("BLOCK_END") {
            return Some(ParsedEvent::BlockEnd);
        }

        // GameEntity
        if let Some(caps) = RE_GAME_ENTITY.captures(line) {
            return Some(ParsedEvent::GameEntity {
                entity_id: caps[1].parse().unwrap_or(0),
            });
        }

        // PlayerEntity
        if let Some(caps) = RE_PLAYER_ENTITY.captures(line) {
            return Some(ParsedEvent::PlayerEntity {
                entity_id: caps[1].parse().unwrap_or(0),
                player_id: caps[2].parse().unwrap_or(0),
            });
        }

        // CreationTag (indented tag=... value=... lines inside entity blocks)
        if let Some(caps) = RE_CREATION_TAG.captures(line) {
            return Some(ParsedEvent::CreationTag {
                tag: caps[1].to_string(),
                value: caps[2].to_string(),
            });
        }

        None
    }
}
