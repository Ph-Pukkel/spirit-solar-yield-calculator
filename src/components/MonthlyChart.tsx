'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyResult, Locale } from '@/lib/types';
import { formatNumber } from '@/lib/solar-utils';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface MonthlyChartProps {
  data: MonthlyResult[];
  locale: Locale;
}

type ViewMode = 'daily' | 'monthly';

const DIRECTION_COLORS = {
  north: '#8b5cf6',
  east: '#3b82f6',
  south: '#f59e0b',
  west: '#ef4444',
};

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  locale: Locale;
  mode: ViewMode;
}

function CustomTooltip({ active, payload, label, locale, mode }: CustomTooltipProps) {
  const t = locale === 'nl' ? nl : en;
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);
  const unit = mode === 'daily' ? t.results.whPerDay : t.results.kwhPerMonth;

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-spirit-white font-semibold mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-spirit-gray-200">{entry.name}</span>
          </div>
          <span className="text-spirit-white font-medium">
            {formatNumber(entry.value, mode === 'daily' ? 0 : 1, locale)}
          </span>
        </div>
      ))}
      <div className="border-t border-white/10 mt-2 pt-2 flex items-center justify-between text-sm">
        <span className="text-spirit-gray-400">{t.results.total}</span>
        <span className="text-spirit-cinnabar font-bold">
          {formatNumber(total, mode === 'daily' ? 0 : 1, locale)} {unit}
        </span>
      </div>
    </div>
  );
}

interface LegendPayloadEntry {
  value: string;
  color: string;
}

function CustomLegend({ payload }: { payload?: LegendPayloadEntry[] }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-sm text-spirit-gray-200">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

export default function MonthlyChart({ data, locale }: MonthlyChartProps) {
  const t = locale === 'nl' ? nl : en;
  const [mode, setMode] = useState<ViewMode>('daily');

  const months = t.months as Record<string, string>;

  const chartData = data.map((m) => ({
    name: months[String(m.month)],
    [t.config.north]: mode === 'daily' ? m.north_wh_day : m.north_kwh_month,
    [t.config.east]: mode === 'daily' ? m.east_wh_day : m.east_kwh_month,
    [t.config.south]: mode === 'daily' ? m.south_wh_day : m.south_kwh_month,
    [t.config.west]: mode === 'daily' ? m.west_wh_day : m.west_kwh_month,
  }));

  const yLabel = mode === 'daily' ? t.results.whPerDay : t.results.kwhPerMonth;

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-spirit-white">
          {t.results.monthlyChart}
        </h3>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            onClick={() => setMode('daily')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              mode === 'daily'
                ? 'bg-spirit-cinnabar text-white'
                : 'bg-spirit-dark text-spirit-gray-400 hover:text-spirit-white'
            }`}
          >
            {t.results.dailyAvg}
          </button>
          <button
            onClick={() => setMode('monthly')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              mode === 'monthly'
                ? 'bg-spirit-cinnabar text-white'
                : 'bg-spirit-dark text-spirit-gray-400 hover:text-spirit-white'
            }`}
          >
            {t.results.monthlyTotal}
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: 12 },
              offset: 0,
            }}
          />
          <Tooltip
            content={<CustomTooltip locale={locale} mode={mode} />}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Legend content={<CustomLegend />} />
          <Bar dataKey={t.config.north} stackId="a" fill={DIRECTION_COLORS.north} radius={[0, 0, 0, 0]} />
          <Bar dataKey={t.config.east} stackId="a" fill={DIRECTION_COLORS.east} />
          <Bar dataKey={t.config.south} stackId="a" fill={DIRECTION_COLORS.south} />
          <Bar dataKey={t.config.west} stackId="a" fill={DIRECTION_COLORS.west} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
