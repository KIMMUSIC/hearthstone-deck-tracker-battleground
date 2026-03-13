import { useMemo } from 'react';

interface OverlayPosition {
  combatProbability: { top: string; left: string; width: string };
  opponentBoard: { top: string; right: string; width: string };
  tribeDisplay: { bottom: string; left: string };
  mmrTracker: { bottom: string; right: string };
}

/**
 * Calculates overlay element positions based on the game window dimensions.
 * These positions are relative to the Hearthstone game board layout.
 */
export function useOverlayPosition(
  windowWidth: number,
  windowHeight: number,
): OverlayPosition {
  return useMemo(() => {
    // Hearthstone uses a 16:9 aspect ratio with fixed board positions
    const boardWidth = Math.min(windowWidth, (windowHeight * 16) / 9);
    const boardLeft = (windowWidth - boardWidth) / 2;

    return {
      combatProbability: {
        top: `${windowHeight * 0.02}px`,
        left: `${boardLeft + boardWidth * 0.02}px`,
        width: `${boardWidth * 0.2}px`,
      },
      opponentBoard: {
        top: `${windowHeight * 0.02}px`,
        right: `${windowWidth - boardLeft - boardWidth + boardWidth * 0.02}px`,
        width: `${boardWidth * 0.25}px`,
      },
      tribeDisplay: {
        bottom: `${windowHeight * 0.02}px`,
        left: `${boardLeft + boardWidth * 0.02}px`,
      },
      mmrTracker: {
        bottom: `${windowHeight * 0.02}px`,
        right: `${windowWidth - boardLeft - boardWidth + boardWidth * 0.02}px`,
      },
    };
  }, [windowWidth, windowHeight]);
}
