import { Minion } from './entities';
import { CombatResult, GameMode, Race } from './game-state';

export interface MatchData {
  id: string;
  gameMode: GameMode;
  heroCardId: string;
  placement: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  mmrBefore: number;
  mmrAfter: number;
  turnCount: number;
  anomalyCardId: string | null;
  availableRaces: Race[];
  startedAt: Date;
  endedAt: Date;
}

export interface MatchOpponent {
  playerIdInGame: number;
  heroCardId: string;
  tavernTier: number;
  lastKnownBoard: Minion[];
  damageDealt: number;
  damageTaken: number;
}

export interface MatchTurn {
  turnNumber: number;
  tavernTier: number;
  health: number;
  boardState: Minion[];
  combatResult: CombatResult;
  damageDelta: number;
}

export interface MatchUploadPayload {
  matchData: MatchData;
  opponents: MatchOpponent[];
  turns: MatchTurn[];
  signature: string;
  timestamp: number;
}

export interface SessionStats {
  startingMmr: number;
  currentMmr: number;
  gamesPlayed: number;
  recentMatches: MatchData[];
}
