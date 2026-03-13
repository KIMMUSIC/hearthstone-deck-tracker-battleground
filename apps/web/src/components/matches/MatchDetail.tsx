'use client';

import { useQuery } from '@tanstack/react-query';
import { Shield, Swords, Heart } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/common/Skeleton';
import type { MatchData, MatchTurn, MatchOpponent } from '@bg-tracker/shared-types';

interface MatchDetailProps {
  match: MatchData;
}

interface MatchDetailData {
  turns: MatchTurn[];
  opponents: MatchOpponent[];
}

const combatResultLabels: Record<string, { label: string; color: string }> = {
  WIN: { label: '승', color: 'text-success' },
  LOSS: { label: '패', color: 'text-danger' },
  TIE: { label: '무', color: 'text-text-muted' },
};

export function MatchDetail({ match }: MatchDetailProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['matchDetail', match.id],
    queryFn: () => fetchApi<MatchDetailData>(`/api/matches/${match.id}`),
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6 bg-surface-0 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const turns = data?.data.turns ?? [];
  const opponents = data?.data.opponents ?? [];

  return (
    <div className="px-4 py-6 bg-surface-0 border-t border-border space-y-6">
      {/* Turn Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">턴별 타임라인</h4>
        {turns.length === 0 ? (
          <p className="text-xs text-text-muted">턴 데이터가 없습니다.</p>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {turns.map((turn) => {
              const result = combatResultLabels[turn.combatResult] ?? combatResultLabels.TIE;
              return (
                <div
                  key={turn.turnNumber}
                  className="shrink-0 w-16 rounded-lg border border-border bg-surface-1 p-2 text-center"
                >
                  <p className="text-[10px] text-text-muted">T{turn.turnNumber}</p>
                  <p className={cn('text-xs font-bold', result.color)}>
                    {result.label}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Heart className="h-2.5 w-2.5 text-danger" />
                    <span className="text-[10px] text-text-secondary">{turn.health}</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">Tier {turn.tavernTier}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Opponents */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">상대방 정보</h4>
        {opponents.length === 0 ? (
          <p className="text-xs text-text-muted">상대방 데이터가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {opponents.map((opp) => (
              <div
                key={opp.playerIdInGame}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-1 p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {getHeroDisplayName(opp.heroCardId)}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1">
                    <span className="flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5" />
                      Tier {opp.tavernTier}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Swords className="h-2.5 w-2.5" />
                      {opp.damageDealt}/{opp.damageTaken}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Info */}
      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span>MMR: {match.mmrBefore} → {match.mmrAfter}</span>
        {match.anomalyCardId && <span>이상현상: {match.anomalyCardId}</span>}
        <span>종족: {match.availableRaces.join(', ')}</span>
      </div>
    </div>
  );
}
