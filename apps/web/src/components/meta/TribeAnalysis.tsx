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
import { raceColors } from '@/lib/theme';

interface TribeStats {
  race: string;
  appearanceRate: number;
  avgPlacement: number;
  gamesPlayed: number;
}

interface TribeAnalysisProps {
  tribes: TribeStats[];
}

export function TribeAnalysis({ tribes }: TribeAnalysisProps) {
  if (tribes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 py-12 text-center text-text-muted">
        종족 데이터를 불러오는 중...
      </div>
    );
  }

  const sortedTribes = [...tribes].sort((a, b) => a.avgPlacement - b.avgPlacement);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6">종족 분석</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div>
          <h4 className="text-sm font-medium text-text-muted mb-3">종족별 평균 등수</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedTribes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                domain={[1, 8]}
                reversed
              />
              <YAxis
                type="category"
                dataKey="race"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="avgPlacement" radius={[0, 4, 4, 0]}>
                {sortedTribes.map((entry) => (
                  <Cell
                    key={entry.race}
                    fill={raceColors[entry.race] ?? '#6366F1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3">
          {sortedTribes.map((tribe) => (
            <div
              key={tribe.race}
              className="rounded-lg border border-border bg-surface-0 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: raceColors[tribe.race] ?? '#6366F1' }}
                />
                <span className="text-sm font-medium text-text-primary">{tribe.race}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>
                  <p className="text-text-muted">평균 등수</p>
                  <p className="font-semibold text-text-primary">{tribe.avgPlacement.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-muted">등장률</p>
                  <p className="font-semibold text-text-primary">
                    {(tribe.appearanceRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
