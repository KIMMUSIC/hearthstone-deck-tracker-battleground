/**
 * Combat Simulator Integration Tests
 *
 * Tests the Rust napi native addon for Battlegrounds combat simulation.
 * Requires `napi build --platform` to have been run first.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// The native addon will be loaded after build
let addon: {
  runSimulation: (inputJson: string) => Promise<string>;
  setSimulationConfig?: (
    iterations: number,
    timeoutMs: number,
    threadCount: number
  ) => void;
} | null = null;

describe('Combat Simulator Native Addon', () => {
  beforeAll(() => {
    try {
      addon = require('../index');
    } catch {
      console.warn(
        'Native addon not built. Run `pnpm build` in packages/combat-sim first.'
      );
    }
  });

  describe('Module Loading', () => {
    it('should export runSimulation function', () => {
      if (!addon) return;
      expect(typeof addon.runSimulation).toBe('function');
    });

    it('should export setSimulationConfig function', () => {
      if (!addon) return;
      expect(typeof addon.setSimulationConfig).toBe('function');
    });
  });

  describe('Known Board States', () => {
    let testCases: Array<{
      name: string;
      input: object;
      expected: {
        win_rate_min?: number;
        win_rate_max?: number;
        loss_rate_min?: number;
        loss_rate_max?: number;
        tie_rate_min?: number;
        tie_rate_max?: number;
        description: string;
      };
    }>;

    beforeAll(() => {
      const boardsPath = path.join(
        __dirname,
        'known-boards',
        'simple-boards.json'
      );
      const data = JSON.parse(fs.readFileSync(boardsPath, 'utf-8'));
      testCases = data.testCases;
    });

    it('should load test cases', () => {
      expect(testCases).toBeDefined();
      expect(testCases.length).toBeGreaterThan(0);
    });

    it('1/1 vs 1/1 - should be ~100% tie', async () => {
      if (!addon) return;

      const tc = testCases.find((t) => t.name.includes('1/1 vs 1/1'));
      if (!tc) throw new Error('Test case not found');

      // Use fewer iterations for test speed
      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(1000, 5000, 0);
      }

      const resultJson = await addon.runSimulation(JSON.stringify(tc.input));
      const result = JSON.parse(resultJson);

      expect(result.tie_rate).toBeGreaterThanOrEqual(tc.expected.tie_rate_min!);
      expect(result.tie_rate).toBeLessThanOrEqual(tc.expected.tie_rate_max!);
      expect(result.simulation_count).toBe(1000);
    });

    it('2/2 vs 1/1 - player always wins', async () => {
      if (!addon) return;

      const tc = testCases.find((t) => t.name.includes('2/2 vs 1/1'));
      if (!tc) throw new Error('Test case not found');

      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(1000, 5000, 0);
      }

      const resultJson = await addon.runSimulation(JSON.stringify(tc.input));
      const result = JSON.parse(resultJson);

      expect(result.win_rate).toBeGreaterThanOrEqual(tc.expected.win_rate_min!);
      expect(result.win_rate).toBeLessThanOrEqual(tc.expected.win_rate_max!);
    });

    it('Taunt targeting - taunt should be attacked first', async () => {
      if (!addon) return;

      const tc = testCases.find((t) => t.name.includes('Taunt targeting'));
      if (!tc) throw new Error('Test case not found');

      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(1000, 5000, 0);
      }

      const resultJson = await addon.runSimulation(JSON.stringify(tc.input));
      const result = JSON.parse(resultJson);

      expect(result.loss_rate).toBeGreaterThanOrEqual(
        tc.expected.loss_rate_min!
      );
      expect(result.loss_rate).toBeLessThanOrEqual(tc.expected.loss_rate_max!);
    });

    it('Divine Shield - shielded minion beats plain', async () => {
      if (!addon) return;

      const tc = testCases.find((t) => t.name.includes('Divine Shield'));
      if (!tc) throw new Error('Test case not found');

      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(1000, 5000, 0);
      }

      const resultJson = await addon.runSimulation(JSON.stringify(tc.input));
      const result = JSON.parse(resultJson);

      expect(result.win_rate).toBeGreaterThanOrEqual(tc.expected.win_rate_min!);
      expect(result.win_rate).toBeLessThanOrEqual(tc.expected.win_rate_max!);
    });
  });

  describe('Performance', () => {
    it('10,000 simulations should complete in < 2 seconds', async () => {
      if (!addon) return;

      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(10000, 5000, 0);
      }

      const input = {
        player: {
          health: 30,
          tier: 3,
          board: [
            {
              card_id: 'M1',
              attack: 3,
              health: 3,
              damage: 0,
              golden: false,
              tier: 2,
              race: 14,
              taunt: false,
              divine_shield: false,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
            {
              card_id: 'M2',
              attack: 2,
              health: 4,
              damage: 0,
              golden: false,
              tier: 2,
              race: 17,
              taunt: true,
              divine_shield: false,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
            {
              card_id: 'M3',
              attack: 4,
              health: 2,
              damage: 0,
              golden: false,
              tier: 1,
              race: 20,
              taunt: false,
              divine_shield: true,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
          ],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        opponent: {
          health: 25,
          tier: 3,
          board: [
            {
              card_id: 'O1',
              attack: 5,
              health: 5,
              damage: 0,
              golden: false,
              tier: 3,
              race: 15,
              taunt: false,
              divine_shield: false,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
            {
              card_id: 'O2',
              attack: 2,
              health: 2,
              damage: 0,
              golden: false,
              tier: 1,
              race: 0,
              taunt: false,
              divine_shield: false,
              poisonous: true,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
          ],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        available_races: [14, 15, 17, 20, 24],
        anomaly_card_id: null,
        turn: 5,
      };

      const start = performance.now();
      const resultJson = await addon.runSimulation(JSON.stringify(input));
      const elapsed = performance.now() - start;

      const result = JSON.parse(resultJson);

      expect(elapsed).toBeLessThan(2000); // < 2 seconds
      expect(result.simulation_count).toBe(10000);
      expect(result.win_rate + result.loss_rate + result.tie_rate).toBeCloseTo(
        1.0,
        1
      );

      console.log(
        `Performance: 10,000 sims in ${elapsed.toFixed(0)}ms | ` +
          `Win: ${(result.win_rate * 100).toFixed(1)}% | ` +
          `Loss: ${(result.loss_rate * 100).toFixed(1)}% | ` +
          `Tie: ${(result.tie_rate * 100).toFixed(1)}%`
      );
    });
  });

  describe('Error Handling', () => {
    it('should reject malformed JSON', async () => {
      if (!addon) return;

      await expect(addon.runSimulation('not json')).rejects.toThrow();
    });

    it('should reject empty board on both sides', async () => {
      if (!addon) return;

      const input = {
        player: {
          health: 30,
          tier: 1,
          board: [],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        opponent: {
          health: 30,
          tier: 1,
          board: [],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        available_races: [],
        anomaly_card_id: null,
        turn: 1,
      };

      await expect(
        addon.runSimulation(JSON.stringify(input))
      ).rejects.toThrow();
    });
  });

  describe('Result Validation', () => {
    it('probabilities should sum to ~1.0', async () => {
      if (!addon) return;

      if (addon.setSimulationConfig) {
        addon.setSimulationConfig(1000, 5000, 0);
      }

      const input = {
        player: {
          health: 30,
          tier: 2,
          board: [
            {
              card_id: 'A',
              attack: 3,
              health: 2,
              damage: 0,
              golden: false,
              tier: 1,
              race: 0,
              taunt: false,
              divine_shield: false,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
          ],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        opponent: {
          health: 30,
          tier: 2,
          board: [
            {
              card_id: 'B',
              attack: 2,
              health: 3,
              damage: 0,
              golden: false,
              tier: 1,
              race: 0,
              taunt: false,
              divine_shield: false,
              poisonous: false,
              venomous: false,
              windfury: false,
              mega_windfury: false,
              stealth: false,
              reborn: false,
              cleave: false,
            },
          ],
          hero_power_card_id: null,
          hero_power_activated: false,
        },
        available_races: [],
        anomaly_card_id: null,
        turn: 2,
      };

      const resultJson = await addon.runSimulation(JSON.stringify(input));
      const result = JSON.parse(resultJson);

      const total = result.win_rate + result.loss_rate + result.tie_rate;
      expect(total).toBeCloseTo(1.0, 2);
      expect(result.win_rate).toBeGreaterThanOrEqual(0);
      expect(result.loss_rate).toBeGreaterThanOrEqual(0);
      expect(result.tie_rate).toBeGreaterThanOrEqual(0);
    });
  });
});
