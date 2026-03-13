/**
 * Battlegrounds-specific constants for the tracker application.
 */

// ── Log Reader Configuration ────────────────────────────────────────
/** Interval in ms between polling the Power.log file for new lines */
export const LOG_POLL_INTERVAL_MS = 100;

/** Maximum number of log lines to buffer before processing */
export const MAX_LOG_LINE_BUFFER = 100_000;

// ── Combat Simulation ───────────────────────────────────────────────
/** Number of Monte Carlo iterations per simulation run */
export const SIMULATION_ITERATIONS = 10_000;

/** Timeout in ms for standard board simulation */
export const SIMULATION_TIMEOUT_MS = 1_500;

/** Timeout in ms for complex boards (many deathrattles, reborn, etc.) */
export const SIMULATION_TIMEOUT_COMPLEX_MS = 3_000;

// ── Board & Game Limits ─────────────────────────────────────────────
/** Maximum number of minions on one side of the board */
export const MAX_BOARD_SIZE = 7;

/** Maximum number of players in a Battlegrounds lobby */
export const MAX_PLAYERS = 8;

/** Maximum tavern tier (Bob's Tavern upgrade level) */
export const MAX_TAVERN_TIER = 6;

// ── Hearthstone Process Detection ───────────────────────────────────
/**
 * Window titles used to detect the Hearthstone client process.
 * Includes localized variants for Korean, Traditional Chinese, and Simplified Chinese.
 */
export const HEARTHSTONE_WINDOW_NAMES = [
  "Hearthstone",
  "하스스톤",
  "《爐石戰記》",
  "炉石传说",
] as const;

/** Unity window class name used by the Hearthstone client */
export const HEARTHSTONE_WINDOW_CLASS = "UnityWndClass";

// ── Log File Paths ──────────────────────────────────────────────────
/**
 * Default Hearthstone log directory path on Windows.
 * Corresponds to %LOCALAPPDATA%\Blizzard\Hearthstone\Logs
 *
 * Reference: HDT uses Config.Instance.HearthstoneDirectory + "Logs"
 */
export const DEFAULT_LOG_PATH =
  "%LOCALAPPDATA%\\Blizzard\\Hearthstone\\Logs";

/** Power.log filename - the primary log file parsed by the tracker */
export const POWER_LOG_FILENAME = "Power.log";

/** Log config file path for enabling Power.log output */
export const LOG_CONFIG_PATH =
  "%LOCALAPPDATA%\\Blizzard\\Hearthstone\\log.config";

// ── Tavern Tier Upgrade Costs ───────────────────────────────────────
/**
 * Gold cost to upgrade Bob's Tavern to the next tier.
 * Index corresponds to the tier being upgraded TO (1-indexed).
 * E.g., TAVERN_UPGRADE_COST[2] = cost to upgrade from tier 1 to tier 2.
 */
export const TAVERN_UPGRADE_COST: Readonly<Record<number, number>> = {
  2: 5,   // Tier 1 -> 2
  3: 7,   // Tier 2 -> 3
  4: 8,   // Tier 3 -> 4
  5: 9,   // Tier 4 -> 5
  6: 10,  // Tier 5 -> 6
};

// ── Battlegrounds Turn Timing ───────────────────────────────────────
/** Duration of the recruit (shopping) phase in seconds per turn */
export const RECRUIT_PHASE_DURATION_SECONDS = [
  0,   // Turn 0 (unused)
  30,  // Turn 1
  30,  // Turn 2
  35,  // Turn 3
  35,  // Turn 4
  40,  // Turn 5
  40,  // Turn 6
  45,  // Turn 7
  45,  // Turn 8
  45,  // Turn 9
  50,  // Turn 10+
] as const;
