import { create } from 'zustand';

interface EnabledPanels {
  combatProbability: boolean;
  opponentBoard: boolean;
  tribeDisplay: boolean;
  mmrTracker: boolean;
}

interface SettingsState {
  overlayOpacity: number;
  enabledPanels: EnabledPanels;
  simIterations: number;
  language: string;
  settingsOpen: boolean;

  setOverlayOpacity: (opacity: number) => void;
  togglePanel: (panel: keyof EnabledPanels) => void;
  setSimIterations: (iterations: number) => void;
  setLanguage: (lang: string) => void;
  toggleSettings: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  overlayOpacity: 85,
  enabledPanels: {
    combatProbability: true,
    opponentBoard: true,
    tribeDisplay: true,
    mmrTracker: true,
  },
  simIterations: 10000,
  language: 'en',
  settingsOpen: false,

  setOverlayOpacity: (opacity) => {
    set({ overlayOpacity: opacity });
    get().saveSettings();
  },

  togglePanel: (panel) => {
    set((state) => ({
      enabledPanels: {
        ...state.enabledPanels,
        [panel]: !state.enabledPanels[panel],
      },
    }));
    get().saveSettings();
  },

  setSimIterations: (iterations) => {
    set({ simIterations: iterations });
    get().saveSettings();
    window.electronAPI?.setSimConfig(iterations, 5000, 0);
  },

  setLanguage: (lang) => {
    set({ language: lang });
    get().saveSettings();
  },

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  loadSettings: async () => {
    try {
      const settings = await window.electronAPI?.getSettings('overlaySettings');
      if (settings && typeof settings === 'object') {
        const s = settings as Record<string, unknown>;
        set({
          overlayOpacity: (s.overlayOpacity as number) ?? 85,
          enabledPanels: (s.enabledPanels as EnabledPanels) ?? {
            combatProbability: true,
            opponentBoard: true,
            tribeDisplay: true,
            mmrTracker: true,
          },
          simIterations: (s.simIterations as number) ?? 10000,
          language: (s.language as string) ?? 'en',
        });
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to load settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { overlayOpacity, enabledPanels, simIterations, language } = get();
      await window.electronAPI?.setSettings('overlaySettings', {
        overlayOpacity,
        enabledPanels,
        simIterations,
        language,
      });
    } catch (error) {
      console.error('[SettingsStore] Failed to save settings:', error);
    }
  },
}));
