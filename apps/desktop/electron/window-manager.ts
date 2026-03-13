import { EventEmitter } from 'events';
import { screen } from 'electron';
import {
  HEARTHSTONE_WINDOW_NAMES,
  HEARTHSTONE_WINDOW_CLASS,
} from '@bg-tracker/shared-constants';

// Use koffi for FFI (lighter than ffi-napi, actively maintained)
import koffi from 'koffi';

const user32 = koffi.load('user32.dll');

// Win32 RECT structure
const RECT = koffi.struct('RECT', {
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});

// Win32 API bindings
const FindWindowW = user32.func('FindWindowW', 'int', ['str16', 'str16']);
const GetWindowRect = user32.func('GetWindowRect', 'bool', ['int', koffi.out(koffi.pointer(RECT))]);
const IsWindow = user32.func('IsWindow', 'bool', ['int']);
const GetForegroundWindow = user32.func('GetForegroundWindow', 'int', []);

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class WindowManager extends EventEmitter {
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private gameHandle: number = 0;
  private lastBounds: WindowBounds | null = null;
  private isGameForeground = false;
  private readonly POLL_MS = 500;

  constructor() {
    super();
  }

  startPolling(): void {
    if (this.pollInterval) return;

    this.pollInterval = setInterval(() => {
      this.poll();
    }, this.POLL_MS);

    // Initial poll
    this.poll();
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.gameHandle = 0;
    this.lastBounds = null;
  }

  private poll(): void {
    // If we have a handle, check if it's still valid
    if (this.gameHandle !== 0) {
      if (!IsWindow(this.gameHandle)) {
        // Game window closed
        this.gameHandle = 0;
        this.lastBounds = null;
        this.isGameForeground = false;
        this.emit('game:lost');
        return;
      }

      // Check foreground state
      const fgHandle = GetForegroundWindow();
      const nowForeground = fgHandle === this.gameHandle;
      if (nowForeground !== this.isGameForeground) {
        this.isGameForeground = nowForeground;
        this.emit('game:foreground-changed', nowForeground);
      }

      // Check bounds change
      const bounds = this.getWindowBounds(this.gameHandle);
      if (bounds && this.hasBoundsChanged(bounds)) {
        this.lastBounds = bounds;
        this.emit('game:bounds-changed', bounds);
      }
      return;
    }

    // Try to find the game window
    const handle = this.findHearthstoneWindow();
    if (handle !== 0) {
      this.gameHandle = handle;
      const bounds = this.getWindowBounds(handle);
      if (bounds) {
        this.lastBounds = bounds;
        this.isGameForeground = GetForegroundWindow() === handle;
        this.emit('game:detected', bounds);
      }
    }
  }

  private findHearthstoneWindow(): number {
    // Try with window class name first (most reliable)
    for (const name of HEARTHSTONE_WINDOW_NAMES) {
      const handle = FindWindowW(HEARTHSTONE_WINDOW_CLASS, name);
      if (handle !== 0) return handle;
    }

    // Try with class name only
    const handle = FindWindowW(HEARTHSTONE_WINDOW_CLASS, null as unknown as string);
    if (handle !== 0) return handle;

    return 0;
  }

  private getWindowBounds(handle: number): WindowBounds | null {
    try {
      const rect = { left: 0, top: 0, right: 0, bottom: 0 };
      const success = GetWindowRect(handle, rect);
      if (!success) return null;

      // Apply DPI scaling
      const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

      return {
        x: Math.round(rect.left / scaleFactor),
        y: Math.round(rect.top / scaleFactor),
        width: Math.round((rect.right - rect.left) / scaleFactor),
        height: Math.round((rect.bottom - rect.top) / scaleFactor),
      };
    } catch {
      return null;
    }
  }

  private hasBoundsChanged(newBounds: WindowBounds): boolean {
    if (!this.lastBounds) return true;
    return (
      this.lastBounds.x !== newBounds.x ||
      this.lastBounds.y !== newBounds.y ||
      this.lastBounds.width !== newBounds.width ||
      this.lastBounds.height !== newBounds.height
    );
  }

  getGameHandle(): number {
    return this.gameHandle;
  }

  isGameRunning(): boolean {
    return this.gameHandle !== 0 && IsWindow(this.gameHandle);
  }
}
