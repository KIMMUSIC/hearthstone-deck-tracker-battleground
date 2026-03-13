//! Hero power system for Battlegrounds combat simulation.
//!
//! Some hero powers have effects that trigger during or modify combat
//! (e.g., Deathwing's "ALL minions have +2 Attack", Greybough's
//! "After a friendly Taunt minion dies, give +1/+2 to a friendly minion").
//!
//! This module defines the `HeroPower` trait and stub implementations
//! for heroes with combat-relevant hero powers.

/// Trait for hero powers that affect combat.
///
/// # TODO
/// - Implement hero power lookup by card_id
/// - Some hero powers modify the board at start of combat
/// - Some hero powers trigger during combat
/// - Some hero powers are passive (always active)
pub trait HeroPower {
    /// Activate the hero power's effect.
    ///
    /// # Arguments
    /// * `player_board` - The player's board (mutable for modifications)
    /// * `opponent_board` - The opponent's board (mutable for some effects)
    ///
    /// # TODO
    /// - Implement per-hero activation logic
    /// - Handle passive vs active hero powers
    /// - Some hero powers have different golden versions
    fn activate(&self);
}

// -- Stub hero power implementations --
// Each struct represents a hero whose hero power affects combat.
// Logic will be implemented when the full card database is integrated.

/// Deathwing - "ALL minions have +2 Attack"
pub struct DeathwingHeroPower;

/// Greybough - Taunt minion death triggers
pub struct GreyboughHeroPower;

/// Al'Akir - "At the start of combat, give your left-most minion
/// Windfury, Divine Shield, and Taunt"
pub struct AlAkirHeroPower;

/// Illidan Stormrage - "Your left and right-most minions attack first"
pub struct IllidanHeroPower;

/// Ysera - "At the start of combat, add a Dragon to your warband"
pub struct YseraHeroPower;

/// Fungalmancer Flurgl - "After you sell a Murloc, add a random Murloc to Bob's Tavern"
/// (Not combat-relevant, included for completeness)
pub struct FlurglHeroPower;
