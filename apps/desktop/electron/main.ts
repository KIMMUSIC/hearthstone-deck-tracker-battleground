import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
} from 'electron';
import path from 'path';
import Store from 'electron-store';
import { createOverlayWindow } from './overlay-window';
import { WindowManager } from './window-manager';
import { NativeBridge } from './native-bridge';
import { AuthHandler } from './auth-handler';
import { MatchUploader } from './match-uploader';

const isDev = !app.isPackaged;
const settingsStore = new Store();
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let windowManager: WindowManager | null = null;
let nativeBridge: NativeBridge | null = null;
let authHandler: AuthHandler | null = null;
let matchUploader: MatchUploader | null = null;

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (overlayWindow) {
    if (overlayWindow.isMinimized()) overlayWindow.restore();
    overlayWindow.focus();
  }
});

// Register custom protocol for OAuth callback
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('bg-tracker', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('bg-tracker');
}

app.on('ready', async () => {
  // Create system tray
  createTray();

  // Create overlay window
  overlayWindow = createOverlayWindow();

  // Initialize window manager (game detection)
  windowManager = new WindowManager();

  // Initialize native bridge (log-parser + combat-sim)
  nativeBridge = new NativeBridge();

  // Initialize auth handler
  authHandler = new AuthHandler();

  // Initialize match uploader
  matchUploader = new MatchUploader(authHandler);

  // Set up IPC handlers
  setupIpcHandlers();

  // Start game detection polling
  windowManager.on('game:detected', (bounds) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setBounds(bounds);
      overlayWindow.show();
    }
    // Start log watcher
    nativeBridge?.startWatcher((eventJson: string) => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('game:event', eventJson);
      }
    });
  });

  windowManager.on('game:bounds-changed', (bounds) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setBounds(bounds);
    }
  });

  windowManager.on('game:lost', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
    nativeBridge?.stopWatcher();
  });

  windowManager.on('game:foreground-changed', (isForeground: boolean) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (isForeground) {
        overlayWindow.show();
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        overlayWindow.hide();
      }
    }
  });

  windowManager.startPolling();

  // Load the renderer
  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173');
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
});

function createTray() {
  const iconPath = isDev
    ? path.join(__dirname, '../resources/tray-icon.png')
    : path.join(process.resourcesPath, 'tray-icon.png');

  // Create a simple 16x16 tray icon if file doesn't exist
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Overlay',
      click: () => overlayWindow?.show(),
    },
    {
      label: 'Hide Overlay',
      click: () => overlayWindow?.hide(),
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('settings:open');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        nativeBridge?.stopWatcher();
        windowManager?.stopPolling();
        app.quit();
      },
    },
  ]);

  tray.setToolTip('BG Tracker');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    overlayWindow?.show();
  });
}

function setupIpcHandlers() {
  // Game state
  ipcMain.handle('game:getCurrentState', () => {
    return nativeBridge?.getCurrentState() ?? '{}';
  });

  // Settings
  ipcMain.handle('settings:get', (_event, key: string) => {
    return settingsStore.get(key);
  });

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    settingsStore.set(key, value);
  });

  // Auth
  ipcMain.handle('auth:login', () => {
    return authHandler?.startLogin();
  });

  ipcMain.handle('auth:logout', () => {
    return authHandler?.logout();
  });

  ipcMain.handle('auth:getProfile', () => {
    return authHandler?.getProfile();
  });

  ipcMain.handle('auth:getState', () => {
    return authHandler?.getState();
  });

  // Overlay interaction
  ipcMain.on('overlay:set-interactive', (_event, interactive: boolean) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (interactive) {
        overlayWindow.setIgnoreMouseEvents(false);
      } else {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  // Simulation config
  ipcMain.handle(
    'sim:setConfig',
    (_event, iterations: number, timeoutMs: number, threadCount: number) => {
      nativeBridge?.setSimulationConfig(iterations, timeoutMs, threadCount);
    },
  );

  // Match upload
  ipcMain.handle('match:upload', (_event, matchDataJson: string) => {
    return matchUploader?.queueMatch(matchDataJson);
  });
}

app.on('window-all-closed', () => {
  nativeBridge?.stopWatcher();
  windowManager?.stopPolling();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  nativeBridge?.stopWatcher();
  windowManager?.stopPolling();
});
