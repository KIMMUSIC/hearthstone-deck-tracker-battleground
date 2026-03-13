'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import type { MmrPoint } from '@bg-tracker/shared-types';

interface MmrChartProps {
  initialData: MmrPoint[];
  battleTag: string;
}

type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7일',
  '30d': '30일',
  '90d': '90일',
  all: '전체',
};

export function MmrChart({ initialData, battleTag }: MmrChartProps) {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState(initialData);

  // WebSocket for live updates
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const socket = io(apiUrl, { path: '/ws/live-mmr', transports: ['websocket'] });

    socket.emit('subscribe', { battleTag });

    socket.on('mmr:update', (point: MmrPoint) => {
      setData((prev) => [...prev, point]);
    });

    return () => {
      socket.disconnect();
    };
  }, [battleTag]);

  const filteredData = useMemo(() => {
    if (period === 'all') return data;
    const days = { '7d': 7, '30d': 30, '90d': 90 }[period];
    const cutoff = Date.now() - days * 86400000;
    return data.filter((p) => new Date(p.recordedAt).getTime() >= cutoff);
  }, [data, period]);

  const chartData = filteredData.map((p) => ({
    date: new Date(p.recordedAt).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
    mmr: p.mmr,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">MMR 추이</h3>
        <div className="flex gap-1">
          {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                period === key
                  ? 'bg-primary text-white'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-2',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">
          데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
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
            <Line
              type="monotone"
              dataKey="mmr"
              stroke="#6366F1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366F1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
