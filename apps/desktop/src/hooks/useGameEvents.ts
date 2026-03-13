import { useEffect } from 'react';
import { useGameStore } from '../stores/game-store';
import { useSessionStore } from '../stores/session-store';
import { useSettingsStore } from '../stores/settings-store';

export function useGameEvents() {
  const handleBgEvent = useGameStore((s) => s.handleBgEvent);
  const addMatchResult = useSessionStore((s) => s.addMatchResult);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    // Load settings on mount
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Subscribe to game events from Electron main process
    const cleanup = window.electronAPI.onGameEvent((eventJson: string) => {
      handleBgEvent(eventJson);

      // Track session stats
      try {
        const event = JSON.parse(eventJson);
        if (event.type === 'GameEnded') {
          addMatchResult({
            placement: event.placement,
            heroCardId: useGameStore.getState().playerHeroCardId,
            mmrDelta: event.mmr_delta ?? event.mmrDelta ?? 0,
            timestamp: Date.now(),
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    return cleanup;
  }, [handleBgEvent, addMatchResult]);
}
