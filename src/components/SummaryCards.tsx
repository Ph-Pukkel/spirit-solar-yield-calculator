'use client';

import { Sun, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { CalculationResult, Locale } from '@/lib/types';
import { formatNumber } from '@/lib/solar-utils';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface SummaryCardsProps {
  result: CalculationResult;
  locale: Locale;
}

interface CardData {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}

export default function SummaryCards({ result, locale }: SummaryCardsProps) {
  const t = locale === 'nl' ? nl : en;

  const cards: CardData[] = [
    {
      icon: <Sun className="w-6 h-6 text-spirit-cinnabar" />,
      label: t.results.yearlyTotal,
      value: formatNumber(result.totals.yearly_kwh, 1, locale),
      unit: t.results.kwhPerYear,
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[#f59e0b]" />,
      label: t.results.bestMonth,
      value: `${result.totals.best_month.name} — ${formatNumber(result.totals.best_month.wh_day, 0, locale)}`,
      unit: t.results.whPerDay,
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-[#3b82f6]" />,
      label: t.results.worstMonth,
      value: `${result.totals.worst_month.name} — ${formatNumber(result.totals.worst_month.wh_day, 0, locale)}`,
      unit: t.results.whPerDay,
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-[#8b5cf6]" />,
      label: t.results.avgDaily,
      value: formatNumber(result.totals.avg_daily_wh, 0, locale),
      unit: t.results.whPerDay,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {card.icon}
            <span className="text-sm text-spirit-gray-400">{card.label}</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-spirit-white">
              {card.value}
            </span>
            <span className="ml-2 text-sm text-spirit-gray-400">
              {card.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
