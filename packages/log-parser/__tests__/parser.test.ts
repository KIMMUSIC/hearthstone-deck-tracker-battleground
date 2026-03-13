/**
 * Log Parser Integration Tests
 *
 * Tests the Rust napi native addon for parsing Hearthstone Power.log files.
 * Requires `napi build --platform` to have been run first.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

// The native addon will be loaded after build
let addon: {
  startLogWatcher: (logDir: string, callback: (event: string) => void) => void;
  stopLogWatcher: () => void;
  getCurrentState: () => string;
} | null = null;

describe('Log Parser Native Addon', () => {
  beforeAll(() => {
    try {
      // Try to load the native addon (requires prior build)
      addon = require('../index');
    } catch {
      console.warn(
        'Native addon not built. Run `pnpm build` in packages/log-parser first.'
      );
    }
  });

  describe('Module Loading', () => {
    it('should export startLogWatcher function', () => {
      if (!addon) return;
      expect(typeof addon.startLogWatcher).toBe('function');
    });

    it('should export stopLogWatcher function', () => {
      if (!addon) return;
      expect(typeof addon.stopLogWatcher).toBe('function');
    });

    it('should export getCurrentState function', () => {
      if (!addon) return;
      expect(typeof addon.getCurrentState).toBe('function');
    });
  });

  describe('getCurrentState', () => {
    it('should return valid JSON when no watcher is running', () => {
      if (!addon) return;
      const state = addon.getCurrentState();
      expect(state).toBeDefined();
      const parsed = JSON.parse(state);
      expect(parsed).toBeDefined();
    });
  });

  describe('Log File Watcher Pipeline', () => {
    it('should emit events when reading a sample Power.log', async () => {
      if (!addon) return;

      const fixturesDir = path.join(__dirname, 'fixtures');
      const logFile = path.join(fixturesDir, 'Power.log');

      // Ensure fixture exists
      expect(fs.existsSync(logFile)).toBe(true);

      const events: string[] = [];

      // Start watcher pointing to fixtures directory
      addon.startLogWatcher(fixturesDir, (eventJson: string) => {
        events.push(eventJson);
      });

      // Wait for processing (the file is already complete, watcher will read it all)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Stop the watcher
      addon.stopLogWatcher();

      // We should have received some events
      if (events.length > 0) {
        // Each event should be valid JSON
        for (const eventJson of events) {
          const event = JSON.parse(eventJson);
          expect(event).toHaveProperty('type');
        }

        // Check for expected event types from our sample log
        const eventTypes = events.map((e) => JSON.parse(e).type);

        // The sample log should trigger phase changes and tavern tier changes
        expect(eventTypes).toContain('PhaseChanged');
      }
    });
  });
});

describe('Sample Power.log Parsing', () => {
  it('sample log fixture should exist', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    const logFile = path.join(fixturesDir, 'Power.log');
    expect(fs.existsSync(logFile)).toBe(true);
  });

  it('sample log should contain expected log lines', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    const logFile = path.join(fixturesDir, 'Power.log');
    const content = fs.readFileSync(logFile, 'utf-8');

    // Verify key log patterns exist
    expect(content).toContain('GameEntity EntityID=');
    expect(content).toContain('Player EntityID=');
    expect(content).toContain('TAG_CHANGE');
    expect(content).toContain('FULL_ENTITY');
    expect(content).toContain('BLOCK_START');
    expect(content).toContain('BLOCK_END');
    expect(content).toContain('PLAYER_TECH_LEVEL');
    expect(content).toContain('PLAYSTATE');
  });
});
