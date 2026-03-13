'use client';

import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchFiltersProps {
  gameMode: string;
  heroCardId: string;
  onGameModeChange: (value: string) => void;
  onHeroChange: (value: string) => void;
  onReset: () => void;
}

const GAME_MODES = [
  { value: '', label: '전체' },
  { value: 'SOLO', label: '솔로' },
  { value: 'DUOS', label: '듀오' },
];

export function MatchFilters({
  gameMode,
  heroCardId,
  onGameModeChange,
  onHeroChange,
  onReset,
}: MatchFiltersProps) {
  const hasFilters = gameMode || heroCardId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Game Mode */}
      <div className="flex gap-1 rounded-lg bg-surface-1 border border-border p-1">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onGameModeChange(mode.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              gameMode === mode.value
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Hero Filter */}
      <input
        type="text"
        value={heroCardId}
        onChange={(e) => onHeroChange(e.target.value)}
        placeholder="영웅 ID 필터"
        className="rounded-lg bg-surface-1 border border-border px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-40"
      />

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-secondary hover:bg-surface-1 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </button>
      )}
    </div>
  );
}
