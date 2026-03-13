import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Game events (Main → Renderer)
  onGameEvent: (callback: (eventJson: string) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      eventJson: string,
    ) => callback(eventJson);
    ipcRenderer.on('game:event', listener);
    return () => ipcRenderer.removeListener('game:event', listener);
  },

  // Simulation results (Main → Renderer)
  onSimResult: (callback: (resultJson: string) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      resultJson: string,
    ) => callback(resultJson);
    ipcRenderer.on('sim:result', listener);
    return () => ipcRenderer.removeListener('sim:result', listener);
  },

  // Settings open event (Main → Renderer)
  onSettingsOpen: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('settings:open', listener);
    return () => ipcRenderer.removeListener('settings:open', listener);
  },

  // Game state query (Renderer → Main)
  getCurrentState: (): Promise<string> =>
    ipcRenderer.invoke('game:getCurrentState'),

  // Settings (Renderer → Main)
  getSettings: (key: string): Promise<unknown> =>
    ipcRenderer.invoke('settings:get', key),
  setSettings: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke('settings:set', key, value),

  // Auth (Renderer → Main)
  login: (): Promise<void> => ipcRenderer.invoke('auth:login'),
  logout: (): Promise<void> => ipcRenderer.invoke('auth:logout'),
  getProfile: (): Promise<string | null> =>
    ipcRenderer.invoke('auth:getProfile'),
  getAuthState: (): Promise<string> => ipcRenderer.invoke('auth:getState'),

  // Overlay interaction (Renderer → Main)
  setInteractive: (interactive: boolean): void => {
    ipcRenderer.send('overlay:set-interactive', interactive);
  },

  // Simulation config (Renderer → Main)
  setSimConfig: (
    iterations: number,
    timeoutMs: number,
    threadCount: number,
  ): Promise<void> =>
    ipcRenderer.invoke('sim:setConfig', iterations, timeoutMs, threadCount),

  // Match upload (Renderer → Main)
  uploadMatch: (matchDataJson: string): Promise<void> =>
    ipcRenderer.invoke('match:upload', matchDataJson),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer process
export type ElectronAPI = typeof electronAPI;
