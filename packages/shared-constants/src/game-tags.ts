/**
 * GameTag enum ported from HearthDb.Enums.GameTag
 * https://github.com/HearthSim/HearthDb
 *
 * These are the integer tag IDs used in Hearthstone's Power.log
 * to identify entity properties and state changes.
 */
export enum GameTag {
  // ── Core Entity Tags ──────────────────────────────────────────────
  TAG_SCRIPT_DATA_NUM_1 = 2,
  PLAYSTATE = 17,
  LAST_AFFECTED_BY = 18,
  STEP = 19,
  TURN = 20,
  FATIGUE = 22,
  FIRST_PLAYER = 24,
  RESOURCES_USED = 25,
  HERO_ENTITY = 27,
  MAXHANDSIZE = 28,
  PLAYER_ID = 30,
  DEFENDING = 36,
  PROPOSED_DEFENDER = 37,
  ATTACKING = 38,
  PROPOSED_ATTACKER = 39,
  ATTACHED = 40,
  EXHAUSTED = 43,
  DAMAGE = 44,
  HEALTH = 45,
  ATK = 47,
  COST = 48,
  ZONE = 49,
  CONTROLLER = 50,
  ENTITY_ID = 53,

  // ── Resource Tags ─────────────────────────────────────────────────
  MAXRESOURCES = 176,

  // ── Minion Mechanics ──────────────────────────────────────────────
  WINDFURY = 189,
  TAUNT = 190,
  STEALTH = 191,
  DIVINE_SHIELD = 194,
  CHARGE = 197,
  CLASS = 199,
  CARDRACE = 200,
  CARDTYPE = 202,
  STATE = 204,
  DEATHRATTLE = 217,
  BATTLECRY = 218,
  SECRET = 219,
  CANT_ATTACK = 227,
  CANT_PLAY = 231,
  FROZEN = 260,
  JUST_PLAYED = 261,
  LINKED_ENTITY = 262,
  ZONE_POSITION = 263,
  CARD_TARGET = 267,
  NUM_TURNS_IN_PLAY = 271,
  ARMOR = 292,
  NUM_ATTACKS_THIS_TURN = 297,
  MULLIGAN_STATE = 305,
  CREATOR = 313,
  PARENT_CARD = 316,
  PREDAMAGE = 318,
  POISONOUS = 363,
  DISPLAYED_CREATOR = 385,
  HIDE_STATS = 402,
  REVEALED = 410,
  TRANSFORMED_FROM_CARD = 435,
  CHOOSE_ONE = 443,
  QUEST = 462,

  // ── Premium / Golden ──────────────────────────────────────────────
  PREMIUM = 12,

  // ── Magnetic / Modular ────────────────────────────────────────────
  MODULAR = 849,

  // ── Quest & Questline ─────────────────────────────────────────────
  WHIZBANG_DECK_ID = 1048,
  SHRINE = 1057,
  REBORN = 1085,
  QUEST_REWARD_DATABASE_ID = 1089,
  SIDEQUEST = 1192,
  MEGA_WINDFURY = 1207,

  // ── Battlegrounds Core Tags ───────────────────────────────────────
  BACON_DUMMY_PLAYER = 1349,
  NEXT_OPPONENT_PLAYER_ID = 1360,
  PLAYER_TECH_LEVEL = 1377,
  TECH_LEVEL = 1440,
  PLAYER_TRIPLES = 1447,
  IS_BACON_POOL_MINION = 1456,
  BACON_HERO_CAN_BE_DRAFTED = 1491,
  DORMANT = 1518,
  START_OF_COMBAT = 1531,
  COPIED_FROM_ENTITY_ID = 1565,

  // ── Mercenaries (legacy, used for zone faking) ────────────────────
  LETTUCE_CONTROLLER = 1653,
  LETTUCE_ABILITY_TILE_VISUAL_SELF_ONLY = 1697,
  LETTUCE_ABILITY_TILE_VISUAL_ALL_VISIBLE = 1698,
  FAKE_ZONE = 1702,
  FAKE_ZONE_POSITION = 1703,

  // ── Questline ─────────────────────────────────────────────────────
  QUESTLINE = 1725,
  SIGIL = 1749,

  // ── Questline Part ────────────────────────────────────────────────
  QUESTLINE_PART = 1993,

  // ── Battlegrounds Skin & Setup ────────────────────────────────────
  BACON_SKIN = 2038,
  BACON_SKIN_PARENT_ID = 2039,

  // ── Avenge keyword ────────────────────────────────────────────────
  AVENGE = 2129,

  // ── Objective ─────────────────────────────────────────────────────
  OBJECTIVE = 2311,

  // ── Immolate ──────────────────────────────────────────────────────
  IMMOLATESTAGE = 2600,

  // ── Corpses (Death Knight) ────────────────────────────────────────
  CORPSES = 2186,
  CORPSES_SPENT_THIS_GAME = 2639,

  // ── Venomous (BG-specific poisonous) ──────────────────────────────
  VENOMOUS = 2853,

  // ── Battlegrounds Anomaly ─────────────────────────────────────────
  BACON_GLOBAL_ANOMALY_DBID = 2897,

  // ── Forge ─────────────────────────────────────────────────────────
  FORGE_REVEALED = 3070,

  // ── Battlegrounds Spells & Pool ───────────────────────────────────
  IS_BACON_POOL_SPELL = 3081,
  IS_BACON_DUOS_EXCLUSIVE = 3166,

  // ── Battlegrounds Trinkets ────────────────────────────────────────
  BACON_TRINKET = 3407,

  // ── Battlegrounds Magic Items ─────────────────────────────────────
  BACON_IS_MAGIC_ITEM_DISCOVER = 3565,

  // ── End of Turn / Rally ───────────────────────────────────────────
  END_OF_TURN_TRIGGER = 3744,

  // ── Battlegrounds Locked Mulligan ─────────────────────────────────
  BACON_LOCKED_MULLIGAN_HERO = 3877,

  // ── Battlegrounds Rally ───────────────────────────────────────────
  BACON_RALLY = 4204,
}

/**
 * Zone enum from HearthDb.Enums.Zone
 */
export enum Zone {
  INVALID = 0,
  PLAY = 1,
  DECK = 2,
  HAND = 3,
  GRAVEYARD = 4,
  REMOVEDFROMGAME = 5,
  SETASIDE = 6,
  SECRET = 7,
}

/**
 * PlayState enum from HearthDb.Enums.PlayState
 */
export enum PlayState {
  INVALID = 0,
  PLAYING = 1,
  WINNING = 2,
  LOSING = 3,
  WON = 4,
  LOST = 5,
  TIED = 6,
  DISCONNECTED = 7,
  CONCEDED = 8,
}

/**
 * Step enum from HearthDb.Enums.Step
 */
export enum Step {
  INVALID = 0,
  BEGIN_FIRST = 1,
  BEGIN_SHUFFLE = 2,
  BEGIN_DRAW = 3,
  BEGIN_MULLIGAN = 4,
  MAIN_BEGIN = 5,
  MAIN_READY = 6,
  MAIN_RESOURCE = 7,
  MAIN_DRAW = 8,
  MAIN_START = 9,
  MAIN_ACTION = 10,
  MAIN_COMBAT = 11,
  MAIN_END = 12,
  MAIN_NEXT = 13,
  FINAL_WRAPUP = 14,
  FINAL_GAMEOVER = 15,
  MAIN_CLEANUP = 16,
  MAIN_START_TRIGGERS = 19,
  MAIN_POST_ACTION = 20,
}

/**
 * CardType enum from HearthDb.Enums.CardType
 */
export enum CardType {
  INVALID = 0,
  GAME = 1,
  PLAYER = 2,
  HERO = 3,
  MINION = 4,
  SPELL = 5,
  ENCHANTMENT = 6,
  WEAPON = 7,
  ITEM = 8,
  TOKEN = 9,
  HERO_POWER = 10,
  BLANK = 11,
  GAME_MODE_BUTTON = 12,
  MOVE_MINION_HOVER_TARGET = 22,
  LETTUCE_ABILITY = 23,
  BATTLEGROUND_HERO_BUDDY = 24,
  LOCATION = 39,
  BATTLEGROUND_QUEST_REWARD = 40,
  BATTLEGROUND_SPELL = 42,
  BATTLEGROUND_ANOMALY = 43,
  BATTLEGROUND_TRINKET = 44,
}

/**
 * Mulligan enum from HearthDb.Enums.Mulligan
 */
export enum Mulligan {
  INVALID = 0,
  INPUT = 1,
  DEALING = 2,
  WAITING = 3,
  DONE = 4,
}

/**
 * State enum from HearthDb.Enums.State
 */
export enum State {
  INVALID = 0,
  LOADING = 1,
  RUNNING = 2,
  COMPLETE = 3,
}
