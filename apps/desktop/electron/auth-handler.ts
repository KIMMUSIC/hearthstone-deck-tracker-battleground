import { shell } from 'electron';
import crypto from 'crypto';
import Store from 'electron-store';
import { AuthState } from '@bg-tracker/shared-types';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  battleTag: string;
  battleNetId: string;
  clientSecret: string;
}

const AUTH_STORE_KEY = 'auth';
const API_BASE_URL = process.env.BG_TRACKER_API_URL || 'https://api.bgtracker.gg';

// Battle.net OAuth configuration
const BNET_AUTH_URL = 'https://oauth.battle.net/authorize';
const CLIENT_ID = process.env.BNET_CLIENT_ID || '';
const REDIRECT_URI = 'bg-tracker://auth/callback';

export class AuthHandler {
  private store: Store;
  private state: AuthState = AuthState.UNAUTHENTICATED;
  private pendingAuthState: string | null = null;

  constructor() {
    this.store = new Store({ encryptionKey: 'bg-tracker-auth-v1' });

    // Check for existing auth
    const stored = this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined;
    if (stored && stored.accessToken) {
      if (Date.now() < stored.expiresAt) {
        this.state = AuthState.AUTHENTICATED;
      } else if (stored.refreshToken) {
        this.state = AuthState.TOKEN_EXPIRED;
        this.refreshTokens().catch(() => {
          this.state = AuthState.UNAUTHENTICATED;
        });
      }
    }
  }

  async startLogin(): Promise<void> {
    this.state = AuthState.AUTHENTICATING;

    // Generate state parameter for CSRF protection
    this.pendingAuthState = crypto.randomBytes(32).toString('hex');

    const authUrl = new URL(BNET_AUTH_URL);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid');
    authUrl.searchParams.set('state', this.pendingAuthState);

    // Open in system browser
    await shell.openExternal(authUrl.toString());
  }

  async handleCallback(url: string): Promise<void> {
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');

      if (!code || state !== this.pendingAuthState) {
        throw new Error('Invalid OAuth callback');
      }

      this.pendingAuthState = null;

      // Exchange code for tokens via backend
      const response = await fetch(`${API_BASE_URL}/api/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      });

      if (!response.ok) {
        throw new Error(`Auth callback failed: ${response.status}`);
      }

      const data = await response.json();

      // Generate client secret for HMAC signing
      let clientSecret = (this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined)?.clientSecret;
      if (!clientSecret) {
        clientSecret = crypto.randomBytes(32).toString('hex');

        // Register client secret with backend
        await fetch(`${API_BASE_URL}/api/auth/register-client`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.accessToken}`,
          },
          body: JSON.stringify({ clientSecret }),
        });
      }

      // Store auth data
      const authData: StoredAuth = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        battleTag: data.battleTag,
        battleNetId: data.battleNetId,
        clientSecret,
      };

      this.store.set(AUTH_STORE_KEY, authData);
      this.state = AuthState.AUTHENTICATED;
    } catch (error) {
      console.error('[AuthHandler] OAuth callback failed:', error);
      this.state = AuthState.UNAUTHENTICATED;
      throw error;
    }
  }

  async refreshTokens(): Promise<void> {
    const stored = this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined;
    if (!stored?.refreshToken) {
      this.state = AuthState.UNAUTHENTICATED;
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      stored.accessToken = data.accessToken;
      stored.refreshToken = data.refreshToken || stored.refreshToken;
      stored.expiresAt = Date.now() + data.expiresIn * 1000;

      this.store.set(AUTH_STORE_KEY, stored);
      this.state = AuthState.AUTHENTICATED;
    } catch (error) {
      console.error('[AuthHandler] Token refresh failed:', error);
      this.state = AuthState.UNAUTHENTICATED;
      throw error;
    }
  }

  logout(): void {
    this.store.delete(AUTH_STORE_KEY);
    this.state = AuthState.UNAUTHENTICATED;
  }

  getProfile(): string | null {
    const stored = this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined;
    if (!stored) return null;
    return JSON.stringify({
      battleTag: stored.battleTag,
      battleNetId: stored.battleNetId,
    });
  }

  getState(): string {
    return this.state;
  }

  getAccessToken(): string | null {
    const stored = this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined;
    if (!stored) return null;

    // Auto-refresh if expired
    if (Date.now() >= stored.expiresAt) {
      this.refreshTokens().catch(() => {});
      return null;
    }

    return stored.accessToken;
  }

  getClientSecret(): string | null {
    const stored = this.store.get(AUTH_STORE_KEY) as StoredAuth | undefined;
    return stored?.clientSecret ?? null;
  }
}
