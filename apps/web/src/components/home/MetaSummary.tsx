import Link from 'next/link';
import { ArrowRight, Crown } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { getTierColor, getTierLabel } from '@/lib/theme';
import type { MetaStatsResponse } from '@bg-tracker/shared-types';

export async function MetaSummary() {
  let heroes: MetaStatsResponse['heroes'] = [];

  try {
    const res = await fetchApi<MetaStatsResponse>('/api/meta/heroes', {
      next: { revalidate: 600 },
    });
    heroes = res.data.heroes.slice(0, 5);
  } catch {
    // Fallback: show placeholder
  }

  if (heroes.length === 0) {
    return (
      <div className="text-center text-text-muted py-8">
        <p>메타 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Crown className="h-5 w-5 text-accent" />
          이번 시즌 인기 영웅
        </h2>
        <Link
          href="/meta"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          전체 메타 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {heroes.map((hero, idx) => (
          <div
            key={hero.heroCardId}
            className="rounded-xl border border-border bg-surface-1 p-4 hover:border-border-hover transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-surface-2 shrink-0">
                <img
                  src={getHeroImageWithFallback(hero.heroCardId)}
                  alt={getHeroDisplayName(hero.heroCardId)}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {getHeroDisplayName(hero.heroCardId)}
                </p>
                <span className={`text-xs font-bold ${getTierColor(hero.avgPlacement)}`}>
                  {getTierLabel(hero.avgPlacement)} Tier
                </span>
              </div>
              <span className="ml-auto text-lg font-bold text-text-muted">
                #{idx + 1}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-text-muted">평균 등수</p>
                <p className="font-semibold text-text-primary">
                  {hero.avgPlacement.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Top 4</p>
                <p className="font-semibold text-success">
                  {(hero.top4Rate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
