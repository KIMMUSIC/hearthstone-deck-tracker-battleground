'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchPaginated } from '@/lib/api';
import { paramToBattleTag } from '@/lib/utils';
import { MatchFilters } from '@/components/matches/MatchFilters';
import { MatchList } from '@/components/matches/MatchList';
import { Pagination } from '@/components/common/Pagination';
import { SkeletonTableRow } from '@/components/common/Skeleton';
import type { MatchData } from '@bg-tracker/shared-types';

export default function MatchHistoryPage() {
  const params = useParams<{ battletag: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const battleTag = paramToBattleTag(params.battletag);
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');
  const gameMode = searchParams.get('gameMode') ?? '';
  const heroCardId = searchParams.get('heroCardId') ?? '';

  const queryString = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(gameMode && { gameMode }),
    ...(heroCardId && { heroCardId }),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['matches', battleTag, queryString],
    queryFn: () =>
      fetchPaginated<MatchData[]>(
        `/api/users/${encodeURIComponent(battleTag)}/matches?${queryString}`,
      ),
  });

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset to page 1 on filter change (unless changing page)
    if (!('page' in updates)) {
      newParams.set('page', '1');
    }
    router.push(`?${newParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">매치 히스토리</h2>

      <MatchFilters
        gameMode={gameMode}
        heroCardId={heroCardId}
        onGameModeChange={(v) => updateParams({ gameMode: v })}
        onHeroChange={(v) => updateParams({ heroCardId: v })}
        onReset={() => router.push('?')}
      />

      {isLoading ? (
        <div className="rounded-xl border border-border bg-surface-1 divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      ) : (
        <>
          <MatchList matches={data?.data ?? []} />
          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              pageSize={pageSize}
              onPageChange={(p) => updateParams({ page: String(p) })}
              onPageSizeChange={(s) => updateParams({ pageSize: String(s), page: '1' })}
            />
          )}
        </>
      )}
    </div>
  );
}
