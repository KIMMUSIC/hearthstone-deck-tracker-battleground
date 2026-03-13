'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { placementColors, placementBgColors, getMmrDeltaColor } from '@/lib/theme';
import { cn, formatMmrDelta, formatRelativeTime } from '@/lib/utils';
import { MatchDetail } from './MatchDetail';
import type { MatchData } from '@bg-tracker/shared-types';

interface MatchListProps {
  matches: MatchData[];
}

export function MatchList({ matches }: MatchListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 py-12 text-center text-text-muted">
        매치 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 divide-y divide-border overflow-hidden">
      {matches.map((match) => {
        const isExpanded = expandedId === match.id;
        const mmrDelta = match.mmrAfter - match.mmrBefore;

        return (
          <div key={match.id}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : match.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-0/50 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-full overflow-hidden bg-surface-2 shrink-0">
                <img
                  src={getHeroImageWithFallback(match.heroCardId)}
                  alt={getHeroDisplayName(match.heroCardId)}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {getHeroDisplayName(match.heroCardId)}
                </p>
                <p className="text-xs text-text-muted">
                  {match.gameMode} · {match.turnCount}턴 · {formatRelativeTime(match.endedAt)}
                </p>
              </div>

              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border shrink-0',
                  placementBgColors[match.placement],
                  placementColors[match.placement],
                )}
              >
                {match.placement}
              </div>

              <span
                className={cn(
                  'text-sm font-semibold w-14 text-right shrink-0',
                  getMmrDeltaColor(mmrDelta),
                )}
              >
                {formatMmrDelta(mmrDelta)}
              </span>

              <ChevronDown
                className={cn(
                  'h-4 w-4 text-text-muted shrink-0 transition-transform',
                  isExpanded && 'rotate-180',
                )}
              />
            </button>

            {isExpanded && <MatchDetail match={match} />}
          </div>
        );
      })}
    </div>
  );
}
