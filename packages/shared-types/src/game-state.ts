import { Hero, Minion } from './entities';

export enum GamePhase {
  LOBBY = 'LOBBY',
  HERO_SELECT = 'HERO_SELECT',
  SHOPPING = 'SHOPPING',
  COMBAT = 'COMBAT',
  GAME_OVER = 'GAME_OVER',
}

export enum CombatResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  TIE = 'TIE',
}

export enum GameMode {
  SOLO = 'SOLO',
  DUOS = 'DUOS',
}

export enum Race {
  BEAST = 'BEAST',
  DEMON = 'DEMON',
  DRAGON = 'DRAGON',
  ELEMENTAL = 'ELEMENTAL',
  MECH = 'MECH',
  MURLOC = 'MURLOC',
  NAGA = 'NAGA',
  PIRATE = 'PIRATE',
  QUILBOAR = 'QUILBOAR',
  UNDEAD = 'UNDEAD',
  ALL = 'ALL',
  INVALID = 'INVALID',
}

export interface OpponentInfo {
  heroCardId: string;
  entityId: number;
  health: number;
  tavernTier: number;
  lastKnownBoard: Minion[];
  isDead: boolean;
}

export interface BattlegroundsState {
  phase: GamePhase;
  turn: number;
  playerHero: Hero;
  playerBoard: Minion[];
  playerHealth: number;
  playerTavernTier: number;
  opponentHero: Hero | null;
  opponentBoard: Minion[];
  availableRaces: Race[];
  bannedRaces: Race[];
  anomalyCardId: string | null;
  opponents: OpponentInfo[];
}

export interface SimulationResult {
  winRate: number;
  lossRate: number;
  tieRate: number;
  myDeathRate: number;
  theirDeathRate: number;
  damageDistribution: Map<number, number>;
  simulationCount: number;
}
