'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getHeroDisplayName } from '@bg-tracker/shared-constants';
import { getHeroImageWithFallback } from '@/lib/card-images';
import { getTierColor, getTierLabel } from '@/lib/theme';
import { StatCard } from '@/components/common/StatCard';
import { Gamepad2, Target, TrendingUp } from 'lucide-react';
import type { HeroMetaStats } from '@bg-tracker/shared-types';

interface HeroDetailProps {
  hero: HeroMetaStats;
  mmrBracketStats: { bracket: string; avgPlacement: number; gamesPlayed: number }[];
}

export function HeroDetail({ hero, mmrBracketStats }: HeroDetailProps) {
  const name = getHeroDisplayName(hero.heroCardId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-surface-2 shrink-0">
          <img
            src={getHeroImageWithFallback(hero.heroCardId)}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">{name}</h1>
          <span className={`text-lg font-bold ${getTierColor(hero.avgPlacement)}`}>
            {getTierLabel(hero.avgPlacement)} Tier
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="평균 등수" value={hero.avgPlacement.toFixed(2)} icon={Target} />
        <StatCard
          label="Top 4 비율"
          value={`${(hero.top4Rate * 100).toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard label="픽 수" value={hero.pickCount.toLocaleString()} icon={Gamepad2} />
        <StatCard label="게임 수" value={hero.gamesPlayed.toLocaleString()} icon={Gamepad2} />
      </div>

      {/* MMR Bracket Chart */}
      {mmrBracketStats.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">MMR 구간별 평균 등수</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mmrBracketStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="bracket"
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                domain={[1, 8]}
                reversed
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="avgPlacement" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
