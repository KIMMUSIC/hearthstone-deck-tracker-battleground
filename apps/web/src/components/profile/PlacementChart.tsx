'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { UserStats } from '@bg-tracker/shared-types';

interface PlacementChartProps {
  stats: UserStats;
}

const PLACEMENT_COLORS = [
  '#FFD700', // 1st
  '#C0C0C0', // 2nd
  '#CD7F32', // 3rd
  '#22C55E', // 4th
  '#EF4444', // 5th
  '#DC2626', // 6th
  '#B91C1C', // 7th
  '#991B1B', // 8th
];

export function PlacementChart({ stats }: PlacementChartProps) {
  // Derive placement distribution from stats
  // In real app, this would come from the API
  const chartData = Array.from({ length: 8 }, (_, i) => ({
    placement: `${i + 1}등`,
    count: Math.max(0, Math.round(stats.totalGames / 8)),
    index: i,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">등수 분포</h3>

      {stats.totalGames === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="placement"
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: 12,
              }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.placement} fill={PLACEMENT_COLORS[entry.index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
