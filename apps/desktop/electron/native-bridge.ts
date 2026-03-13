import { app } from 'electron';
import path from 'path';
import {
  DEFAULT_LOG_PATH,
  SIMULATION_ITERATIONS,
  SIMULATION_TIMEOUT_MS,
} from '@bg-tracker/shared-constants';

// Type declarations for the native addons
interface LogParserAddon {
  startLogWatcher(logDir: string, callback: (eventJson: string) => void): void;
  stopLogWatcher(): void;
  getCurrentState(): string;
}

interface CombatSimAddon {
  runSimulation(inputJson: string): Promise<string>;
  setSimulationConfig(iterations: number, timeoutMs: number, threadCount: number): void;
}

export class NativeBridge {
  private logParser: LogParserAddon | null = null;
  private combatSim: CombatSimAddon | null = null;
  private isWatching = false;

  constructor() {
    this.loadAddons();
  }

  private loadAddons(): void {
    const isDev = !app.isPackaged;

    try {
      if (isDev) {
        // Development: load from packages/ directory
        const logParserPath = path.join(
          app.getAppPath(),
          '../../packages/log-parser',
        );
        const combatSimPath = path.join(
          app.getAppPath(),
          '../../packages/combat-sim',
        );
        this.logParser = require(logParserPath);
        this.combatSim = require(combatSimPath);
      } else {
        // Production: load from asar.unpacked resources
        const nativeDir = path.join(process.resourcesPath, 'native-addons');
        this.logParser = require(path.join(nativeDir, 'log-parser.win32-x64-msvc.node'));
        this.combatSim = require(path.join(nativeDir, 'combat-sim.win32-x64-msvc.node'));
      }

      console.log('[NativeBridge] Native addons loaded successfully');
    } catch (error) {
      console.error('[NativeBridge] Failed to load native addons:', error);
    }
  }

  startWatcher(eventCallback: (eventJson: string) => void): void {
    if (this.isWatching || !this.logParser) return;

    // Resolve log directory path
    const logDir = this.resolveLogPath();
    if (!logDir) {
      console.error('[NativeBridge] Could not resolve Hearthstone log directory');
      return;
    }

    try {
      this.logParser.startLogWatcher(logDir, (eventJson: string) => {
        eventCallback(eventJson);

        // Auto-trigger simulation on CombatStarted events
        try {
          const event = JSON.parse(eventJson);
          if (event.type === 'CombatStarted') {
            this.triggerSimulation(eventCallback);
          }
        } catch {
          // Ignore parse errors
        }
      });
      this.isWatching = true;
      console.log('[NativeBridge] Log watcher started:', logDir);
    } catch (error) {
      console.error('[NativeBridge] Failed to start log watcher:', error);
    }
  }

  stopWatcher(): void {
    if (!this.isWatching || !this.logParser) return;

    try {
      this.logParser.stopLogWatcher();
      this.isWatching = false;
      console.log('[NativeBridge] Log watcher stopped');
    } catch (error) {
      console.error('[NativeBridge] Failed to stop log watcher:', error);
    }
  }

  getCurrentState(): string {
    if (!this.logParser) return '{}';
    try {
      return this.logParser.getCurrentState();
    } catch {
      return '{}';
    }
  }

  setSimulationConfig(iterations: number, timeoutMs: number, threadCount: number): void {
    if (!this.combatSim) return;
    try {
      this.combatSim.setSimulationConfig(iterations, timeoutMs, threadCount);
    } catch (error) {
      console.error('[NativeBridge] Failed to set simulation config:', error);
    }
  }

  private async triggerSimulation(eventCallback: (eventJson: string) => void): Promise<void> {
    if (!this.combatSim || !this.logParser) return;

    try {
      // Get current board state from log parser
      const stateJson = this.logParser.getCurrentState();
      const state = JSON.parse(stateJson);

      // Only simulate if we have board data
      if (!state.playerBoard || !state.opponentBoard) return;

      // Build simulation input
      const simInput = JSON.stringify({
        player: {
          health: state.playerHealth ?? 30,
          tier: state.playerTavernTier ?? 1,
          board: state.playerBoard ?? [],
          hero_power_card_id: state.playerHeroPowerCardId ?? null,
          hero_power_activated: state.playerHeroPowerActivated ?? false,
        },
        opponent: {
          health: state.opponentHealth ?? 30,
          tier: state.opponentTavernTier ?? 1,
          board: state.opponentBoard ?? [],
          hero_power_card_id: state.opponentHeroPowerCardId ?? null,
          hero_power_activated: false,
        },
        available_races: state.availableRaces ?? [],
        anomaly_card_id: state.anomalyCardId ?? null,
        turn: state.turn ?? 1,
      });

      const resultJson = await this.combatSim.runSimulation(simInput);

      // Send simulation result as an event
      eventCallback(
        JSON.stringify({
          type: 'SimulationResult',
          ...JSON.parse(resultJson),
        }),
      );
    } catch (error) {
      console.error('[NativeBridge] Simulation failed:', error);
    }
  }

  private resolveLogPath(): string | null {
    // Replace environment variable in path
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return null;

    const resolvedPath = DEFAULT_LOG_PATH.replace('%LOCALAPPDATA%', localAppData);
    return resolvedPath;
  }
}
