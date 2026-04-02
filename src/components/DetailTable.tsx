'use client';

import type { MonthlyResult, Locale } from '@/lib/types';
import { formatNumber } from '@/lib/solar-utils';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface DetailTableProps {
  data: MonthlyResult[];
  locale: Locale;
}

export default function DetailTable({ data, locale }: DetailTableProps) {
  const t = locale === 'nl' ? nl : en;
  const months = t.months as Record<string, string>;

  // Calculate year averages and totals
  const yearAvgNorth = data.reduce((s, m) => s + m.north_wh_day, 0) / data.length;
  const yearAvgEast = data.reduce((s, m) => s + m.east_wh_day, 0) / data.length;
  const yearAvgSouth = data.reduce((s, m) => s + m.south_wh_day, 0) / data.length;
  const yearAvgWest = data.reduce((s, m) => s + m.west_wh_day, 0) / data.length;
  const yearAvgTotal = data.reduce((s, m) => s + m.total_wh_day, 0) / data.length;
  const yearTotalKwh = data.reduce((s, m) => s + m.total_kwh_month, 0);

  const directionHeaders = [
    { label: t.config.north, color: '#8b5cf6' },
    { label: t.config.east, color: '#3b82f6' },
    { label: t.config.south, color: '#f59e0b' },
    { label: t.config.west, color: '#ef4444' },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-spirit-white mb-4">
        {t.results.detailTable}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 bg-[#2d2d2d] z-10">
              <th className="text-left py-3 px-3 text-spirit-gray-400 font-medium">
                {t.results.month}
              </th>
              {directionHeaders.map((dir) => (
                <th
                  key={dir.label}
                  className="text-right py-3 px-3 font-medium"
                  style={{ color: dir.color }}
                >
                  {dir.label}
                  <span className="block text-xs font-normal opacity-70">
                    ({t.results.whPerDay})
                  </span>
                </th>
              ))}
              <th className="text-right py-3 px-3 text-spirit-green font-medium">
                {t.results.total}
                <span className="block text-xs font-normal opacity-70">
                  ({t.results.whPerDay})
                </span>
              </th>
              <th className="text-right py-3 px-3 text-spirit-green font-medium">
                {t.results.total}
                <span className="block text-xs font-normal opacity-70">
                  ({t.results.kwhPerMonth})
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.month}
                className={`border-t border-white/5 ${
                  i % 2 === 0 ? 'bg-white/[0.02]' : ''
                } hover:bg-white/[0.05] transition-colors`}
              >
                <td className="py-2.5 px-3 text-spirit-gray-200 font-medium">
                  {months[String(row.month)]}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-gray-200">
                  {formatNumber(row.north_wh_day, 0, locale)}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-gray-200">
                  {formatNumber(row.east_wh_day, 0, locale)}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-gray-200">
                  {formatNumber(row.south_wh_day, 0, locale)}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-gray-200">
                  {formatNumber(row.west_wh_day, 0, locale)}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-white font-semibold">
                  {formatNumber(row.total_wh_day, 0, locale)}
                </td>
                <td className="py-2.5 px-3 text-right text-spirit-white font-semibold">
                  {formatNumber(row.total_kwh_month, 1, locale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-spirit-green/30 bg-spirit-green/5">
              <td className="py-3 px-3 text-spirit-green font-bold">
                {t.results.yearAvg} / {t.results.yearTotal}
              </td>
              <td className="py-3 px-3 text-right text-spirit-gray-200 font-semibold">
                {formatNumber(yearAvgNorth, 0, locale)}
              </td>
              <td className="py-3 px-3 text-right text-spirit-gray-200 font-semibold">
                {formatNumber(yearAvgEast, 0, locale)}
              </td>
              <td className="py-3 px-3 text-right text-spirit-gray-200 font-semibold">
                {formatNumber(yearAvgSouth, 0, locale)}
              </td>
              <td className="py-3 px-3 text-right text-spirit-gray-200 font-semibold">
                {formatNumber(yearAvgWest, 0, locale)}
              </td>
              <td className="py-3 px-3 text-right text-spirit-white font-bold">
                {formatNumber(yearAvgTotal, 0, locale)}
              </td>
              <td className="py-3 px-3 text-right text-spirit-green font-bold">
                {formatNumber(yearTotalKwh, 1, locale)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
