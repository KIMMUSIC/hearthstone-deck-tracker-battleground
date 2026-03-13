/**
 * Regex patterns for parsing Hearthstone's Power.log file.
 *
 * Ported from HDT's LogConstants.cs:
 * https://github.com/HearthSim/Hearthstone-Deck-Tracker/blob/master/
 *   Hearthstone%20Deck%20Tracker/LogReader/LogConstants.cs
 *
 * C# named groups (?<name>...) are preserved as-is since JavaScript
 * supports named capture groups (ES2018+).
 */

// ── Timestamp / Log Line Parsing ────────────────────────────────────

/**
 * Extracts timestamp and log content from a raw Power.log line.
 * Power.log lines are formatted as:
 *   D HH:MM:SS.FFFFFFF <content>
 *
 * Example: "D 23:05:12.3456789 GameState.DebugPrintPower() - ..."
 */
export const LOG_LINE_REGEX =
  /^D (?<timestamp>\d{2}:\d{2}:\d{2}\.\d+)\s+(?<content>.+)$/;

// ── Game Mode ───────────────────────────────────────────────────────

/** Matches game mode transitions: prevMode=X currMode=Y */
export const GAME_MODE_REGEX =
  /prevMode=(?<prev>\w+).*currMode=(?<curr>\w+)/;

/** Matches next game mode transitions: prevMode=X nextMode=Y */
export const NEXT_GAME_MODE_REGEX =
  /prevMode=(?<prev>\w+).*nextMode=(?<next>\w+)/;

// ── PowerTaskList Patterns ──────────────────────────────────────────

/**
 * Matches BLOCK_START lines from PowerTaskList.
 *
 * Captures: type, id, Id (cardId), player, effectCardId, target, subOption, triggerKeyword
 *
 * Original C# pattern:
 *   @".*BLOCK_START.*BlockType=(?<type>(\w+)).*id=(?<id>\d*).*
 *     (cardId=(?<Id>(\w*))).*player=(?<player>\d).*
 *     EffectCardId=(?<effectCardId>(.*))\sEffectIndex=.*
 *     Target=(?<target>(.+)).*SubOption=(?<subOption>[^\s]*)
 *     (?:\sTriggerKeyword=(?<triggerKeyword>\w+))?"
 */
export const BLOCK_START_REGEX =
  /.*BLOCK_START.*BlockType=(?<type>\w+).*id=(?<id>\d*).*(cardId=(?<Id>\w*)).*player=(?<player>\d).*EffectCardId=(?<effectCardId>.*)\sEffectIndex=.*Target=(?<target>.+).*SubOption=(?<subOption>[^\s]*)(?:\sTriggerKeyword=(?<triggerKeyword>\w+))?/;

/**
 * Matches BLOCK_END lines.
 * Block end is a simple marker without captures.
 */
export const BLOCK_END_REGEX = /BLOCK_END/;

/**
 * Matches GameEntity creation lines.
 *
 * Captures: id
 *
 * Original C# pattern:
 *   @"GameEntity\ EntityID=(?<id>(\d+))"
 */
export const GAME_ENTITY_REGEX =
  /GameEntity EntityID=(?<id>\d+)/;

/**
 * Matches Player entity creation lines.
 *
 * Captures: id, playerId, gameAccountId
 *
 * Original C# pattern:
 *   @"Player\ EntityID=(?<id>(\d+))\ PlayerID=(?<playerId>(\d+))
 *     \ GameAccountId=(?<gameAccountId>(.+))"
 */
export const PLAYER_ENTITY_REGEX =
  /Player EntityID=(?<id>\d+) PlayerID=(?<playerId>\d+) GameAccountId=(?<gameAccountId>.+)/;

/**
 * Matches TAG_CHANGE lines.
 *
 * Captures: entity, tag, value
 *
 * Original C# pattern:
 *   @"TAG_CHANGE\ Entity=(?<entity>(.+))\ tag=(?<tag>(\w+))\ value=(?<value>(\w+))"
 */
export const TAG_CHANGE_REGEX =
  /TAG_CHANGE Entity=(?<entity>.+) tag=(?<tag>\w+) value=(?<value>\w+)/;

/**
 * Matches FULL_ENTITY (entity creation) lines.
 *
 * Captures: id, zone, cardId
 *
 * Original C# pattern:
 *   @"FULL_ENTITY - Updating.*id=(?<id>(\d+)).*zone=(?<zone>(\w+))
 *     .*CardID=(?<cardId>(\w*))"
 */
export const FULL_ENTITY_REGEX =
  /FULL_ENTITY - Updating.*id=(?<id>\d+).*zone=(?<zone>\w+).*CardID=(?<cardId>\w*)/;

/**
 * Matches SHOW_ENTITY and CHANGE_ENTITY (entity update) lines.
 *
 * Captures: type (SHOW_ENTITY|CHANGE_ENTITY), entity, cardId
 *
 * Original C# pattern:
 *   @"(?<type>(SHOW_ENTITY|CHANGE_ENTITY))\ -\ Updating\ Entity=
 *     (?<entity>(.+))\ CardID=(?<cardId>(\w*))"
 */
export const UPDATING_ENTITY_REGEX =
  /(?<type>SHOW_ENTITY|CHANGE_ENTITY) - Updating Entity=(?<entity>.+) CardID=(?<cardId>\w*)/;

/**
 * Matches HIDE_ENTITY lines.
 *
 * Captures: id
 *
 * Original C# pattern:
 *   @"HIDE_ENTITY\ -\ .* id=(?<id>(\d+))"
 */
export const HIDE_ENTITY_REGEX =
  /HIDE_ENTITY - .* id=(?<id>\d+)/;

/**
 * Matches creation tag lines (within FULL_ENTITY blocks).
 *
 * Captures: tag, value
 *
 * Original C# pattern:
 *   @"tag=(?<tag>(\w+))\ value=(?<value>(\w+))"
 */
export const CREATION_TAG_REGEX =
  /tag=(?<tag>\w+) value=(?<value>\w+)/;

/**
 * Matches entity reference patterns within log lines.
 *
 * Uses lookaheads to extract multiple optional fields from entity strings.
 * Captures: id, name, zone, zonePos, cardId, player, type
 *
 * Original C# pattern:
 *   @"(?=id=(?<id>(\d+)))(?=name=(?<name>(\w+)))?(?=zone=(?<zone>(\w+)))?
 *     (?=zonePos=(?<zonePos>(\d+)))?(?=cardId=(?<cardId>(\w+)))?
 *     (?=player=(?<player>(\d+)))?(?=type=(?<type>(\w+)))?"
 */
export const ENTITY_REGEX =
  /(?=id=(?<id>\d+))(?=name=(?<name>\w+))?(?=zone=(?<zone>\w+))?(?=zonePos=(?<zonePos>\d+))?(?=cardId=(?<cardId>\w+))?(?=player=(?<player>\d+))?(?=type=(?<type>\w+))?/;

/**
 * Matches SHUFFLE_DECK lines.
 *
 * Captures: id (PlayerID)
 *
 * Original C# pattern:
 *   @"SHUFFLE_DECK\ PlayerID=(?<id>(\d+))"
 */
export const SHUFFLE_DECK_REGEX =
  /SHUFFLE_DECK PlayerID=(?<id>\d+)/;

/**
 * Matches cardId within log lines.
 *
 * Captures: cardId
 *
 * Original C# pattern:
 *   @"cardId=(?<cardId>(\w+))"
 */
export const CARD_ID_REGEX =
  /cardId=(?<cardId>\w+)/;

/**
 * Matches SUB_SPELL_START lines.
 *
 * Captures: spellPrefabGuid, source
 */
export const SUB_SPELL_START_REGEX =
  /SUB_SPELL_START - SpellPrefabGUID=(?<spellPrefabGuid>.*) Source=(?<source>\d+)/;

/**
 * Matches MetaInfo lines within blocks.
 *
 * Captures: id
 */
export const META_INFO_REGEX =
  /Info\[\d+\]\s*=\s*(?:.*\bid=(?<id>\d+).*]|\b(?<id2>\d+)\b)/;

// ── Choices Patterns ────────────────────────────────────────────────

/** Matches choices header lines. Captures: id, player, taskList, choiceType */
export const CHOICES_HEADER_REGEX =
  /id=(?<id>\d+) Player=(?<player>.+) TaskList=(?<taskList>\d+)? ChoiceType=(?<choiceType>\w+)/;

/** Matches chosen header lines. Captures: id, player */
export const CHOSEN_HEADER_REGEX =
  /id=(?<id>\d+) Player=(?<player>.+) EntitiesCount=.*/;

/** Matches choices source. Captures: id */
export const CHOICES_SOURCE_REGEX =
  /Source=.* id=(?<id>\d+)/;

/** Matches individual choice entities. Captures: index, id */
export const CHOICES_ENTITY_REGEX =
  /Entities\[(?<index>\d+)]=.* id=(?<id>\d+)/;

/** Matches end of task list. Captures: taskList */
export const END_TASK_LIST_REGEX =
  /m_currentTaskList=(?<taskList>\d+)/;

// ── GameInfo Patterns ───────────────────────────────────────────────

/** Matches player info lines. Captures: playerId, playerName */
export const PLAYER_INFO_REGEX =
  /PlayerID=(?<playerId>\d+), PlayerName=(?<playerName>.+)/;
