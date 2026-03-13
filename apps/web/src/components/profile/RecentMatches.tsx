'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fetchPaginated } from '@/lib/api';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { placementColors, placementBgColors, getMmrDeltaColor } from '@/lib/theme';
import { battleTagToParam, formatRelativeTime, formatMmrDelta, cn } from '@/lib/utils';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import type { MatchData } from '@bg-tracker/shared-types';

interface RecentMatchesProps {
  battleTag: string;
}

export function RecentMatches({ battleTag }: RecentMatchesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['recentMatches', battleTag],
    queryFn: () =>
      fetchPaginated<MatchData[]>(
        `/api/users/${encodeURIComponent(battleTag)}/matches?page=1&pageSize=10`,
      ),
  });

  const matches = data?.data ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">최근 매치</h3>
        <Link
          href={`/${battleTagToParam(battleTag)}/matches`}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          전체 매치 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
          : matches.length === 0
            ? (
                <p className="text-sm text-text-muted py-4 text-center">
                  매치 기록이 없습니다.
                </p>
              )
            : matches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))
        }
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: MatchData }) {
  const mmrDelta = match.mmrAfter - match.mmrBefore;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-0 transition-colors">
      <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-2 shrink-0">
        <img
          src={getHeroImageWithFallback(match.heroCardId)}
          alt={getHeroDisplayName(match.heroCardId)}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">
          {getHeroDisplayName(match.heroCardId)}
        </p>
        <p className="text-xs text-text-muted">
          {match.turnCount}턴 · {formatRelativeTime(match.endedAt)}
        </p>
      </div>

      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border',
          placementBgColors[match.placement],
          placementColors[match.placement],
        )}
      >
        #{match.placement}
      </div>

      <span className={cn('text-sm font-semibold w-14 text-right shrink-0', getMmrDeltaColor(mmrDelta))}>
        {formatMmrDelta(mmrDelta)}
      </span>
    </div>
  );
}
