//! Anomaly system for Battlegrounds combat simulation.
//!
//! Anomalies are game-wide modifiers that change the rules for
//! all players in a Battlegrounds game. Some anomalies affect
//! combat directly (e.g., modifying minion stats, changing
//! combat rules, or adding special effects).
//!
//! Only one anomaly is active per game, and it applies to all players.

/// Represents the active anomaly for a game.
#[derive(Debug, Clone)]
pub struct Anomaly {
    /// The card ID of the anomaly
    pub card_id: String,
}

impl Anomaly {
    /// Create a new anomaly from its card ID.
    pub fn new(card_id: String) -> Self {
        Self { card_id }
    }
}

/// Trait for anomaly effects that modify combat.
///
/// # TODO
/// - Implement specific anomaly effects by card_id lookup
/// - Some anomalies modify all minions' stats
/// - Some anomalies change combat resolution rules
/// - Some anomalies add effects to certain events (death, summon, etc.)
pub trait AnomalyEffect {
    /// Modify combat state based on this anomaly's rules.
    ///
    /// Called at the start of each combat simulation iteration,
    /// before any attacks are resolved.
    ///
    /// # TODO
    /// - Define proper parameters (combat state, both boards)
    /// - Implement per-anomaly modification logic
    /// - Handle anomalies that affect minion stats
    /// - Handle anomalies that change combat flow
    fn modify_combat(&self);
}
