import { BrowserWindow, screen } from 'electron';
import path from 'path';

export function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const overlay = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    roundedCorners: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Enable click-through by default
  overlay.setIgnoreMouseEvents(true, { forward: true });

  // Keep overlay on top at screen-saver level (above fullscreen games)
  overlay.setAlwaysOnTop(true, 'screen-saver');

  // Prevent the window from being closed accidentally
  overlay.on('close', (e) => {
    e.preventDefault();
    overlay.hide();
  });

  // Hide initially until game is detected
  overlay.hide();

  return overlay;
}
