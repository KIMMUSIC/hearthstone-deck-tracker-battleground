//! Enchantment system for combat simulation.
//!
//! Enchantments are buffs/debuffs applied to minions that modify their
//! stats or grant keywords. Some enchantments are temporary (lasting
//! only for the current combat), while others are permanent.
//!
//! Examples: +1/+1 from a buff, temporary Divine Shield, stat modifiers
//! from auras, etc.

use crate::minion::Minion;

/// Represents a single enchantment applied to a minion.
#[derive(Debug, Clone)]
pub struct Enchantment {
    /// The card ID of the enchantment
    pub card_id: String,
    /// Entity ID of the source that applied this enchantment
    pub source_entity_id: i32,
    /// Stat and keyword modifiers applied by this enchantment
    pub modifiers: EnchantmentModifiers,
}

/// Stat and keyword modifiers that an enchantment can apply.
#[derive(Debug, Clone, Default)]
pub struct EnchantmentModifiers {
    /// Attack modifier (positive = buff, negative = debuff)
    pub attack: i32,
    /// Health modifier (positive = buff, negative = debuff)
    pub health: i32,
    /// Grant Taunt
    pub taunt: Option<bool>,
    /// Grant Divine Shield
    pub divine_shield: Option<bool>,
    /// Grant Poisonous
    pub poisonous: Option<bool>,
    /// Grant Windfury
    pub windfury: Option<bool>,
    /// Grant Reborn
    pub reborn: Option<bool>,
    /// Grant Stealth
    pub stealth: Option<bool>,
}

impl Enchantment {
    /// Apply this enchantment's modifiers to a minion.
    ///
    /// # TODO
    /// - Apply attack/health modifiers
    /// - Apply keyword grants
    /// - Handle temporary vs permanent enchantments
    /// - Handle aura-based enchantments (removed when source dies)
    pub fn apply(&self, minion: &mut Minion) {
        // Apply stat modifiers
        minion.attack += self.modifiers.attack;
        minion.health += self.modifiers.health;

        // Apply keyword grants (only if the enchantment explicitly sets them)
        if let Some(taunt) = self.modifiers.taunt {
            minion.taunt = taunt;
        }
        if let Some(divine_shield) = self.modifiers.divine_shield {
            minion.divine_shield = divine_shield;
        }
        if let Some(poisonous) = self.modifiers.poisonous {
            minion.poisonous = poisonous;
        }
        if let Some(windfury) = self.modifiers.windfury {
            minion.windfury = windfury;
        }
        if let Some(reborn) = self.modifiers.reborn {
            minion.reborn = reborn;
        }
        if let Some(stealth) = self.modifiers.stealth {
            minion.stealth = stealth;
        }
    }
}
