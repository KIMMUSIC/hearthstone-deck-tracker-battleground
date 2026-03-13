export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfile {
  id: string;
  battleTag: string;
  battleNetId: string;
  createdAt: Date;
}

export enum AuthState {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHENTICATED = 'AUTHENTICATED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
}
