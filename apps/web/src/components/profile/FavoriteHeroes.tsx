import Link from 'next/link';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { getTierColor, getTierLabel } from '@/lib/theme';
import { battleTagToParam } from '@/lib/utils';
import type { UserStats } from '@bg-tracker/shared-types';

interface FavoriteHeroesProps {
  stats: UserStats;
  battleTag: string;
}

// Placeholder: in real app, API returns top heroes data
interface HeroStat {
  heroCardId: string;
  gamesPlayed: number;
  avgPlacement: number;
  top4Rate: number;
}

export function FavoriteHeroes({ stats, battleTag }: FavoriteHeroesProps) {
  // Mock: derive from stats.favoriteHero
  const heroes: HeroStat[] = stats.favoriteHero
    ? [
        {
          heroCardId: stats.favoriteHero,
          gamesPlayed: Math.round(stats.totalGames * 0.15),
          avgPlacement: stats.avgPlacement,
          top4Rate: stats.top4Rate,
        },
      ]
    : [];

  if (heroes.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">선호 영웅</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {heroes.map((hero) => (
          <Link
            key={hero.heroCardId}
            href={`/${battleTagToParam(battleTag)}/matches?heroCardId=${hero.heroCardId}`}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface-0 p-4 hover:border-border-hover transition-colors"
          >
            <div className="h-12 w-12 rounded-full overflow-hidden bg-surface-2 shrink-0">
              <img
                src={getHeroImageWithFallback(hero.heroCardId)}
                alt={getHeroDisplayName(hero.heroCardId)}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary truncate">
                {getHeroDisplayName(hero.heroCardId)}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                <span>{hero.gamesPlayed}게임</span>
                <span className={getTierColor(hero.avgPlacement)}>
                  {hero.avgPlacement.toFixed(2)} ({getTierLabel(hero.avgPlacement)})
                </span>
                <span className="text-success">
                  Top4 {(hero.top4Rate * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
