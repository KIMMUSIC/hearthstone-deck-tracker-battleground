import { create } from 'zustand';

interface Minion {
  id: number;
  cardId: string;
  attack: number;
  health: number;
  damage: number;
  golden: boolean;
  tier: number;
  race: number;
  taunt: boolean;
  divineShield: boolean;
  poisonous: boolean;
  venomous: boolean;
  windfury: boolean;
  megaWindfury: boolean;
  stealth: boolean;
  reborn: boolean;
  cleave: boolean;
}

interface OpponentInfo {
  heroCardId: string;
  entityId: number;
  health: number;
  tavernTier: number;
  lastKnownBoard: Minion[];
  isDead: boolean;
}

interface SimResult {
  winRate: number;
  lossRate: number;
  tieRate: number;
  myDeathRate: number;
  theirDeathRate: number;
  simulationCount: number;
}

interface GameState {
  // Phase & turn
  phase: string;
  turn: number;
  gameMode: string;

  // Player state
  playerHeroCardId: string;
  playerTavernTier: number;
  playerHealth: number;
  playerBoard: Minion[];

  // Opponent state (current combat)
  opponentHeroCardId: string;
  opponentBoard: Minion[];

  // All opponents
  opponents: Map<number, OpponentInfo>;

  // Races
  availableRaces: number[];
  anomalyCardId: string | null;

  // Combat simulation
  simResult: SimResult | null;

  // Last combat result
  lastCombatResult: string | null;
  lastDamageDelta: number;

  // Game over
  placement: number | null;
  mmrDelta: number | null;

  // Actions
  handleBgEvent: (eventJson: string) => void;
  reset: () => void;
}

const initialState = {
  phase: 'LOBBY',
  turn: 0,
  gameMode: '',
  playerHeroCardId: '',
  playerTavernTier: 1,
  playerHealth: 30,
  playerBoard: [] as Minion[],
  opponentHeroCardId: '',
  opponentBoard: [] as Minion[],
  opponents: new Map<number, OpponentInfo>(),
  availableRaces: [] as number[],
  anomalyCardId: null as string | null,
  simResult: null as SimResult | null,
  lastCombatResult: null as string | null,
  lastDamageDelta: 0,
  placement: null as number | null,
  mmrDelta: null as number | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  handleBgEvent: (eventJson: string) => {
    try {
      const event = JSON.parse(eventJson);

      switch (event.type) {
        case 'GameStarted':
          set({ ...initialState, gameMode: event.game_mode ?? event.gameMode ?? '' });
          break;

        case 'PhaseChanged':
          set({ phase: event.phase, simResult: null });
          break;

        case 'TurnChanged':
          set({ turn: event.turn });
          break;

        case 'HeroSelected':
          set({ playerHeroCardId: event.hero_card_id ?? event.heroCardId ?? '' });
          break;

        case 'TavernTierChanged':
          set({ playerTavernTier: event.tier });
          break;

        case 'CombatStarted':
          set({
            opponentHeroCardId: event.opponent_hero_card_id ?? event.opponentHeroCardId ?? '',
            simResult: null,
          });
          break;

        case 'CombatEnded':
          set({
            lastCombatResult: event.result,
            lastDamageDelta: event.damage_delta ?? event.damageDelta ?? 0,
          });
          break;

        case 'BoardStateSnapshot':
          set({
            playerBoard: parseBoard(event.player_board ?? event.playerBoard),
            opponentBoard: parseBoard(event.opponent_board ?? event.opponentBoard),
          });
          break;

        case 'OpponentInfoUpdated':
          set((state) => {
            const opponents = new Map(state.opponents);
            const id = event.opponent_id ?? event.opponentId;
            opponents.set(id, {
              heroCardId: event.hero_card_id ?? event.heroCardId ?? '',
              entityId: id,
              health: event.health,
              tavernTier: event.tavern_tier ?? event.tavernTier ?? 1,
              lastKnownBoard: opponents.get(id)?.lastKnownBoard ?? [],
              isDead: event.health <= 0,
            });
            return { opponents };
          });
          break;

        case 'GameEnded':
          set({
            placement: event.placement,
            mmrDelta: event.mmr_delta ?? event.mmrDelta ?? 0,
          });
          break;

        case 'RacesAvailable':
          set({ availableRaces: event.races });
          break;

        case 'AnomalyDetected':
          set({ anomalyCardId: event.card_id ?? event.cardId ?? null });
          break;

        case 'SimulationResult':
          set({
            simResult: {
              winRate: event.win_rate,
              lossRate: event.loss_rate,
              tieRate: event.tie_rate,
              myDeathRate: event.my_death_rate,
              theirDeathRate: event.their_death_rate,
              simulationCount: event.simulation_count,
            },
          });
          break;
      }
    } catch (error) {
      console.error('[GameStore] Failed to handle event:', error);
    }
  },

  reset: () => set(initialState),
}));

function parseBoard(boardData: string | Minion[]): Minion[] {
  if (!boardData) return [];
  if (Array.isArray(boardData)) return boardData;
  try {
    return JSON.parse(boardData);
  } catch {
    return [];
  }
}
