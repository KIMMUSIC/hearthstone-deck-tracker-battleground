'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MetaFiltersProps {
  gameMode: string;
  mmrBracket: string;
  days: string;
}

const GAME_MODES = [
  { value: '', label: '전체' },
  { value: 'SOLO', label: '솔로' },
  { value: 'DUOS', label: '듀오' },
];

const MMR_BRACKETS = [
  { value: '', label: '전체' },
  { value: '0-4000', label: '0-4000' },
  { value: '4000-6000', label: '4000-6000' },
  { value: '6000-8000', label: '6000-8000' },
  { value: '8000+', label: '8000+' },
];

const PERIODS = [
  { value: '3', label: '3일' },
  { value: '7', label: '7일' },
  { value: '14', label: '14일' },
  { value: '30', label: '30일' },
];

export function MetaFilters({ gameMode, mmrBracket, days }: MetaFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/meta?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <FilterGroup
        label="게임 모드"
        options={GAME_MODES}
        value={gameMode}
        onChange={(v) => updateFilter('gameMode', v)}
      />
      <FilterGroup
        label="MMR 구간"
        options={MMR_BRACKETS}
        value={mmrBracket}
        onChange={(v) => updateFilter('mmrBracket', v)}
      />
      <FilterGroup
        label="기간"
        options={PERIODS}
        value={days}
        onChange={(v) => updateFilter('days', v)}
      />
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="text-xs text-text-muted mb-1 block">{label}</span>
      <div className="flex gap-1 rounded-lg bg-surface-1 border border-border p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              value === opt.value
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
