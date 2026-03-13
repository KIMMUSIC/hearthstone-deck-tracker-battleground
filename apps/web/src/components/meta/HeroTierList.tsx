'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { getTierColor, getTierLabel } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { HeroMetaStats } from '@bg-tracker/shared-types';

interface HeroTierListProps {
  heroes: HeroMetaStats[];
}

type SortKey = 'avgPlacement' | 'pickCount' | 'top4Rate' | 'gamesPlayed';
type SortDir = 'asc' | 'desc';

export function HeroTierList({ heroes }: HeroTierListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('avgPlacement');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    return [...heroes].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * mul;
    });
  }, [heroes, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'avgPlacement' ? 'asc' : 'desc');
    }
  };

  if (heroes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 py-12 text-center text-text-muted">
        영웅 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      <h3 className="text-lg font-bold text-text-primary p-6 pb-0">영웅 티어 리스트</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="px-6 py-3 font-medium w-12">#</th>
              <th className="px-6 py-3 font-medium">영웅</th>
              <th className="px-6 py-3 font-medium w-16">티어</th>
              <SortableHeader
                label="평균 등수"
                sortKey="avgPlacement"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Top 4"
                sortKey="top4Rate"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHeader
                label="픽 수"
                sortKey="pickCount"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={toggleSort}
              />
              <SortableHeader
                label="게임 수"
                sortKey="gamesPlayed"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((hero, idx) => (
              <tr key={hero.heroCardId} className="hover:bg-surface-0/50 transition-colors">
                <td className="px-6 py-3 text-text-muted font-medium">{idx + 1}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-2 shrink-0">
                      <img
                        src={getHeroImageWithFallback(hero.heroCardId)}
                        alt={getHeroDisplayName(hero.heroCardId)}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-text-primary">
                      {getHeroDisplayName(hero.heroCardId)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold',
                      getTierColor(hero.avgPlacement),
                      'bg-surface-2',
                    )}
                  >
                    {getTierLabel(hero.avgPlacement)}
                  </span>
                </td>
                <td className="px-6 py-3 font-medium text-text-primary">
                  {hero.avgPlacement.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-success font-medium">
                  {(hero.top4Rate * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-3 text-text-secondary">{hero.pickCount.toLocaleString()}</td>
                <td className="px-6 py-3 text-text-secondary">{hero.gamesPlayed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th className="px-6 py-3 font-medium">
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'flex items-center gap-1 hover:text-text-secondary transition-colors',
          isActive && 'text-primary',
        )}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
