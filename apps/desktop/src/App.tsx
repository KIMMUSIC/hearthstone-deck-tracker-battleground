import { useEffect } from 'react';
import { useGameStore } from './stores/game-store';
import { useSettingsStore } from './stores/settings-store';
import { useGameEvents } from './hooks/useGameEvents';
import CombatProbability from './components/overlay/CombatProbability';
import OpponentBoard from './components/overlay/OpponentBoard';
import TribeDisplay from './components/overlay/TribeDisplay';
import MmrTracker from './components/overlay/MmrTracker';
import SessionRecap from './components/overlay/SessionRecap';
import SettingsPanel from './components/settings/SettingsPanel';

export default function App() {
  useGameEvents();

  const phase = useGameStore((s) => s.phase);
  const enabledPanels = useSettingsStore((s) => s.enabledPanels);
  const overlayOpacity = useSettingsStore((s) => s.overlayOpacity);
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);

  // Listen for settings open from tray
  useEffect(() => {
    const cleanup = window.electronAPI.onSettingsOpen(() => {
      toggleSettings();
    });
    return cleanup;
  }, [toggleSettings]);

  // Handle mouse enter/leave for interactive mode
  const handleMouseEnter = () => {
    window.electronAPI.setInteractive(true);
  };

  const handleMouseLeave = () => {
    window.electronAPI.setInteractive(false);
  };

  if (phase === 'LOBBY') return null;

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{ opacity: overlayOpacity / 100 }}
    >
      {/* Combat Probability - shown during COMBAT phase */}
      {enabledPanels.combatProbability && phase === 'COMBAT' && (
        <div
          className="absolute top-4 left-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CombatProbability />
        </div>
      )}

      {/* Opponent Board - shown during COMBAT phase */}
      {enabledPanels.opponentBoard && phase === 'COMBAT' && (
        <div
          className="absolute top-4 right-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <OpponentBoard />
        </div>
      )}

      {/* Tribe Display - shown during SHOPPING and COMBAT */}
      {enabledPanels.tribeDisplay && (phase === 'SHOPPING' || phase === 'COMBAT') && (
        <div
          className="absolute bottom-4 left-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <TribeDisplay />
        </div>
      )}

      {/* MMR Tracker - always shown during game */}
      {enabledPanels.mmrTracker && phase !== 'LOBBY' && (
        <div
          className="absolute bottom-4 right-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <MmrTracker />
        </div>
      )}

      {/* Session Recap - shown at GAME_OVER */}
      {phase === 'GAME_OVER' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SessionRecap />
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}
