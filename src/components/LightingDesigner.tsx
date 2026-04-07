'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
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
import type { CalculationResult, Locale } from '@/lib/types';
import { nightHoursForMonth } from '@/lib/night-length';
import { formatNumber } from '@/lib/solar-utils';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface LightingDesignerProps {
  result: CalculationResult;
  locale: Locale;
}

export default function LightingDesigner({ result, locale }: LightingDesignerProps) {
  const t = locale === 'nl' ? nl : en;
  const L = t.lighting;
  const months = t.months as Record<string, string>;

  const [open, setOpen] = useState(false);
  const [batteryAh, setBatteryAh] = useState(100);
  const [dod, setDod] = useState(40);
  const [dcEff, setDcEff] = useState(94);
  const [lightW, setLightW] = useState(25);
  const [autonomy, setAutonomy] = useState(4);

  const lat = result.location.lat;

  const computed = useMemo(() => {
    const dodFrac = dod / 100;
    const effFrac = dcEff / 100;
    const usableWh = batteryAh * 48 * dodFrac * effFrac;
    // Spread usable battery energy over the requested autonomy days
    const usablePerNight = autonomy > 0 ? usableWh / autonomy : usableWh;
    const safeLightW = Math.max(lightW, 0.0001);

    const rows = result.monthly.map((m) => {
      const nightHours = nightHoursForMonth(lat, m.month);
      const dailyYieldWh = m.total_wh_day;
      const fromBattery = usablePerNight / safeLightW;
      const fromHarvest = (dailyYieldWh * effFrac) / safeLightW;
      const burnHours = Math.min(nightHours, fromBattery, fromHarvest);
      const coverage = nightHours > 0 ? burnHours / nightHours : 0;
      return {
        month: m.month,
        name: months[String(m.month)],
        nightHours,
        burnHours,
        coverage,
      };
    });

    let worst = rows[0];
    for (const r of rows) {
      if (r.burnHours < worst.burnHours) worst = r;
    }

    return { rows, worst, usableWh };
  }, [batteryAh, dod, dcEff, lightW, autonomy, lat, result.monthly, months]);

  const worstCoveragePct = Math.round(computed.worst.coverage * 100);
  const fullCoverage = computed.rows.every((r) => r.burnHours >= r.nightHours - 0.05);
  const recommendation = fullCoverage
    ? L.recommendationOk
    : L.recommendationDim.replace(/\{pct\}/g, String(worstCoveragePct));

  const chartData = computed.rows.map((r) => ({
    name: r.name,
    [L.burnHours]: Number(r.burnHours.toFixed(2)),
    [L.nightHours]: Number(r.nightHours.toFixed(2)),
  }));

  return (
    <div className="glass-card p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-[#E14C2A]" />
          <h3 className="text-lg font-semibold text-[#1A1B1A]">{L.title}</h3>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-[#707070]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#707070]" />
        )}
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-[#707070]">{L.intro}</p>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <NumberField label={L.batteryAh} value={batteryAh} onChange={setBatteryAh} min={1} />
            <NumberField label={L.dod} value={dod} onChange={setDod} min={1} max={100} />
            <NumberField label={L.dcEff} value={dcEff} onChange={setDcEff} min={1} max={100} />
            <NumberField label={L.lightW} value={lightW} onChange={setLightW} min={1} />
            <NumberField label={L.autonomy} value={autonomy} onChange={setAutonomy} min={1} />
          </div>

          {/* Worst-case highlight */}
          <div className="rounded-lg bg-[#F0EDE8] border border-[#D7D3CD] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#707070]">{L.worstCase}</div>
              <div className="text-xl font-bold text-[#1A1B1A]">
                {months[String(computed.worst.month)]}
              </div>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-xs text-[#707070]">{L.burnHours}</div>
                <div className="text-lg font-semibold text-[#1A1B1A]">
                  {formatNumber(computed.worst.burnHours, 1, locale)} h
                </div>
              </div>
              <div>
                <div className="text-xs text-[#707070]">{L.nightHours}</div>
                <div className="text-lg font-semibold text-[#1A1B1A]">
                  {formatNumber(computed.worst.nightHours, 1, locale)} h
                </div>
              </div>
              <div>
                <div className="text-xs text-[#707070]">{L.coverage}</div>
                <div className="text-lg font-semibold text-[#E14C2A]">{worstCoveragePct}%</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h4 className="text-sm font-medium text-[#1A1B1A] mb-2">{L.chartTitle}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#707070', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#707070', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #D7D3CD',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey={L.burnHours} fill="#E14C2A" radius={[4, 4, 0, 0]} />
                <Bar dataKey={L.nightHours} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg bg-white border border-[#D7D3CD] p-4 text-sm text-[#1A1B1A]">
            {recommendation}
          </div>
        </div>
      )}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

function NumberField({ label, value, onChange, min, max }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="block text-xs text-[#707070] mb-1">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors"
      />
    </label>
  );
}
