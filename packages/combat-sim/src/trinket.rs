//! Trinket system for Battlegrounds combat simulation.
//!
//! Trinkets are passive items that provide various effects during
//! combat. They were introduced in a recent Battlegrounds update
//! and can modify combat behavior in various ways.
//!
//! Each player can have trinkets that affect their minions or
//! modify combat rules.

use crate::minion::Minion;

/// Represents a trinket equipped by a player.
#[derive(Debug, Clone)]
pub struct Trinket {
    /// The card ID of the trinket
    pub card_id: String,
    /// Whether the trinket is currently active/enabled
    pub is_active: bool,
}

impl Trinket {
    /// Create a new trinket.
    pub fn new(card_id: String) -> Self {
        Self {
            card_id,
            is_active: true,
        }
    }
}

/// Trait for trinket effects that modify combat.
///
/// # TODO
/// - Implement specific trinket effects by card_id lookup
/// - Handle trinkets that modify minion stats
/// - Handle trinkets that trigger on specific events
/// - Handle trinkets that modify combat rules
pub trait TrinketEffect {
    /// Apply this trinket's effect.
    ///
    /// The actual signature will depend on the specific effect:
    /// - Some trinkets modify minion stats at start of combat
    /// - Some trinkets trigger on specific combat events
    /// - Some trinkets provide passive aura effects
    ///
    /// # TODO
    /// - Define proper parameters once combat state is finalized
    /// - Implement per-trinket effect logic
    fn apply(&self);
}
