import { UserProfile } from './auth';
import { GameMode } from './game-state';
import { MatchUploadPayload } from './match';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export type CreateMatchRequest = MatchUploadPayload;

export interface MmrPoint {
  mmr: number;
  matchId: string;
  recordedAt: string;
}

export interface UserStats {
  totalGames: number;
  avgPlacement: number;
  top4Rate: number;
  favoriteHero: string;
  mmrHistory: MmrPoint[];
}

export interface UserProfileResponse {
  profile: UserProfile;
  stats: UserStats;
}

export interface HeroMetaStats {
  heroCardId: string;
  pickCount: number;
  avgPlacement: number;
  top4Rate: number;
  gamesPlayed: number;
}

export interface MetaStatsResponse {
  heroes: HeroMetaStats[];
  updatedAt: string;
}

export interface MatchHistoryQuery {
  page: number;
  pageSize: number;
  gameMode?: GameMode;
  heroCardId?: string;
  startDate?: string;
  endDate?: string;
}
