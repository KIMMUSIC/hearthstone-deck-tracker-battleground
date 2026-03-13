import crypto from 'crypto';
import Store from 'electron-store';
import { AuthHandler } from './auth-handler';

interface QueuedMatch {
  payload: string;
  signature: string;
  timestamp: number;
  retryCount: number;
}

const UPLOAD_QUEUE_KEY = 'uploadQueue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 5;
const API_BASE_URL = process.env.BG_TRACKER_API_URL || 'https://api.bgtracker.gg';

export class MatchUploader {
  private store: Store;
  private authHandler: AuthHandler;
  private isProcessing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(authHandler: AuthHandler) {
    this.store = new Store();
    this.authHandler = authHandler;

    // Process any pending uploads on startup
    this.processQueue();
  }

  async queueMatch(matchDataJson: string): Promise<void> {
    const clientSecret = this.authHandler.getClientSecret();
    if (!clientSecret) {
      console.error('[MatchUploader] No client secret available, cannot sign match');
      return;
    }

    // Create deterministic serialization (sorted keys, no whitespace)
    const payload = this.deterministicSerialize(matchDataJson);
    const timestamp = Date.now();

    // Generate HMAC-SHA256 signature
    const signatureInput = payload + timestamp.toString();
    const signature = crypto
      .createHmac('sha256', clientSecret)
      .update(signatureInput)
      .digest('hex');

    const queueItem: QueuedMatch = {
      payload,
      signature,
      timestamp,
      retryCount: 0,
    };

    // Add to queue
    const queue = this.getQueue();
    if (queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest item
      queue.shift();
    }
    queue.push(queueItem);
    this.store.set(UPLOAD_QUEUE_KEY, queue);

    // Process queue
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const remaining: QueuedMatch[] = [];

      for (const item of queue) {
        if (item.retryCount >= MAX_RETRIES) {
          console.warn('[MatchUploader] Max retries exceeded, dropping match');
          continue;
        }

        const success = await this.uploadMatch(item);
        if (!success) {
          item.retryCount++;
          remaining.push(item);
        }
      }

      this.store.set(UPLOAD_QUEUE_KEY, remaining);

      // Schedule retry if there are remaining items
      if (remaining.length > 0) {
        const backoffMs = Math.min(
          1000 * Math.pow(2, remaining[0].retryCount),
          60000,
        );
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          this.processQueue();
        }, backoffMs);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async uploadMatch(item: QueuedMatch): Promise<boolean> {
    const accessToken = this.authHandler.getAccessToken();
    if (!accessToken) {
      // Not authenticated, keep in queue
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Client-Signature': item.signature,
          'X-Timestamp': item.timestamp.toString(),
        },
        body: item.payload,
      });

      if (response.ok) {
        return true;
      }

      switch (response.status) {
        case 401:
          // Token expired, try refresh
          await this.authHandler.refreshTokens();
          return false; // Retry with new token
        case 409:
          // Duplicate match, consider it successful
          console.warn('[MatchUploader] Duplicate match, skipping');
          return true;
        case 429:
          // Rate limited, keep in queue
          console.warn('[MatchUploader] Rate limited, will retry later');
          return false;
        default:
          console.error('[MatchUploader] Upload failed:', response.status);
          return false;
      }
    } catch (error) {
      console.error('[MatchUploader] Network error:', error);
      return false;
    }
  }

  private getQueue(): QueuedMatch[] {
    return (this.store.get(UPLOAD_QUEUE_KEY) as QueuedMatch[] | undefined) ?? [];
  }

  private deterministicSerialize(json: string): string {
    try {
      const obj = JSON.parse(json);
      return JSON.stringify(obj, Object.keys(obj).sort());
    } catch {
      return json;
    }
  }

  destroy(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
