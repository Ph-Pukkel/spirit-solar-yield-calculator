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
  LabelList,
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

// SPIRIT / Sustainder luminaires used by SPIRIT solar columns.
// Wattages from Sustainder product sheets (Anne and Alexia).
// Verified against official Sustainder product sheets
// (Anne EN v2401/v2201, Alexia EN v2401/v2201). Anne ships in two driver
// power steps (25 W, 60 W). Alexia in four (25, 40, 60, 90 W).
const SPIRIT_LIGHTS: { id: string; label: string; watts: number }[] = [
  { id: 'anne-25', label: 'Sustainder Anne — 25 W', watts: 25 },
  { id: 'anne-60', label: 'Sustainder Anne — 60 W', watts: 60 },
  { id: 'alexia-25', label: 'Sustainder Alexia — 25 W', watts: 25 },
  { id: 'alexia-40', label: 'Sustainder Alexia — 40 W', watts: 40 },
  { id: 'alexia-60', label: 'Sustainder Alexia — 60 W', watts: 60 },
  { id: 'alexia-90', label: 'Sustainder Alexia — 90 W', watts: 90 },
];
const CUSTOM_LIGHT_ID = 'custom';

type Mode = 'burnHours' | 'maxPower';

export default function LightingDesigner({ result, locale }: LightingDesignerProps) {
  const t = locale === 'nl' ? nl : en;
  const L = t.lighting;
  const months = t.months as Record<string, string>;

  const [open, setOpen] = useState(false);
  const [batteryAh, setBatteryAh] = useState(100);
  const [batteryV, setBatteryV] = useState(48);
  const [dod, setDod] = useState(40);
  const [dcEff, setDcEff] = useState(94);
  const [lightW, setLightW] = useState(25);
  const [autonomy, setAutonomy] = useState(4);
  const [lightId, setLightId] = useState<string>('anne-25');
  const [mode, setMode] = useState<Mode>('burnHours');

  const lat = result.location.lat;

  const computed = useMemo(() => {
    const dodFrac = dod / 100;
    const effFrac = dcEff / 100;
    const usableWh = batteryAh * batteryV * dodFrac * effFrac;
    const usablePerNight = autonomy > 0 ? usableWh / autonomy : usableWh;
    const safeLightW = Math.max(lightW, 0.0001);

    const rows = result.monthly.map((m) => {
      const nightHours = nightHoursForMonth(lat, m.month);
      const dailyYieldWh = m.total_wh_day;

      // Branduren bij volle wattage van de lamp
      const fromBattery = usablePerNight / safeLightW;
      const fromHarvest = (dailyYieldWh * effFrac) / safeLightW;
      const burnHours = Math.min(nightHours, fromBattery, fromHarvest);
      const coverage = nightHours > 0 ? burnHours / nightHours : 0;

      // Maximaal continu vermogen om de hele nacht te halen,
      // beperkt door zowel batterij als dagelijkse oogst.
      const maxW =
        nightHours > 0
          ? Math.min(usablePerNight, dailyYieldWh * effFrac) / nightHours
          : 0;
      const dimPct = Math.min(100, (maxW / safeLightW) * 100);

      return {
        month: m.month,
        name: months[String(m.month)],
        nightHours,
        burnHours,
        coverage,
        maxW,
        dimPct,
      };
    });

    let worst = rows[0];
    if (mode === 'burnHours') {
      for (const r of rows) if (r.burnHours < worst.burnHours) worst = r;
    } else {
      for (const r of rows) if (r.maxW < worst.maxW) worst = r;
    }

    return { rows, worst, usableWh };
  }, [batteryAh, batteryV, dod, dcEff, lightW, autonomy, lat, result.monthly, months, mode]);

  const worstCoveragePct = Math.round(computed.worst.coverage * 100);
  const fullCoverage = computed.rows.every((r) => r.burnHours >= r.nightHours - 0.05);
  const recommendation = fullCoverage
    ? L.recommendationOk
    : L.recommendationDim.replace(/\{pct\}/g, String(worstCoveragePct));

  const chartData =
    mode === 'burnHours'
      ? computed.rows.map((r) => ({
          name: r.name,
          [L.burnHours]: Number(r.burnHours.toFixed(2)),
          [L.nightHours]: Number(r.nightHours.toFixed(2)),
        }))
      : computed.rows.map((r) => ({
          name: r.name,
          [locale === 'nl' ? 'Max vermogen (W)' : 'Max power (W)']: Number(r.maxW.toFixed(1)),
          [locale === 'nl' ? 'Lamp vol vermogen (W)' : 'Light full power (W)']: lightW,
          pctLabel: `${Math.round(Math.min(100, r.dimPct))}%`,
        }));

  const handleLightChange = (id: string) => {
    setLightId(id);
    if (id !== CUSTOM_LIGHT_ID) {
      const found = SPIRIT_LIGHTS.find((l) => l.id === id);
      if (found) setLightW(found.watts);
    }
  };

  const onLightWChange = (v: number) => {
    setLightW(v);
    setLightId(CUSTOM_LIGHT_ID);
  };

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

          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-[#D7D3CD] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('burnHours')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                mode === 'burnHours'
                  ? 'bg-[#E14C2A] text-white'
                  : 'text-[#1A1B1A] hover:bg-[#F0EDE8]'
              }`}
            >
              {locale === 'nl' ? 'Max branduren' : 'Max burn hours'}
            </button>
            <button
              type="button"
              onClick={() => setMode('maxPower')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                mode === 'maxPower'
                  ? 'bg-[#E14C2A] text-white'
                  : 'text-[#1A1B1A] hover:bg-[#F0EDE8]'
              }`}
            >
              {locale === 'nl' ? 'Max vermogen hele nacht' : 'Max power full night'}
            </button>
          </div>

          {/* Light dropdown */}
          <div>
            <label className="block text-xs text-[#707070] mb-1">
              {locale === 'nl' ? 'SPIRIT verlichting' : 'SPIRIT luminaire'}
            </label>
            <select
              value={lightId}
              onChange={(e) => handleLightChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A] transition-colors cursor-pointer"
            >
              {SPIRIT_LIGHTS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
              <option value={CUSTOM_LIGHT_ID}>
                {locale === 'nl' ? 'Eigen waarde…' : 'Custom value…'}
              </option>
            </select>
          </div>

          {/* Battery system voltage toggle */}
          <div>
            <span className="block text-xs text-[#707070] mb-1">
              {locale === 'nl' ? 'Systeemspanning' : 'System voltage'}
            </span>
            <div className="inline-flex rounded-lg border border-[#D7D3CD] bg-white overflow-hidden">
              {[24, 48].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBatteryV(v)}
                  className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    batteryV === v
                      ? 'bg-[#E14C2A] text-white'
                      : 'text-[#1A1B1A] hover:bg-[#F0EDE8]'
                  }`}
                >
                  {v} V
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <NumberField label={L.batteryAh} value={batteryAh} onChange={setBatteryAh} min={1} />
            <NumberField label={L.dod} value={dod} onChange={setDod} min={1} max={100} />
            <NumberField label={L.dcEff} value={dcEff} onChange={setDcEff} min={1} max={100} />
            <NumberField label={L.lightW} value={lightW} onChange={onLightWChange} min={1} />
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
            {mode === 'burnHours' ? (
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
            ) : (
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-[#707070]">
                    {locale === 'nl' ? 'Max vermogen' : 'Max power'}
                  </div>
                  <div className="text-lg font-semibold text-[#1A1B1A]">
                    {formatNumber(computed.worst.maxW, 1, locale)} W{' '}
                    <span className="text-[#E14C2A]">
                      ({Math.round(computed.worst.dimPct)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#707070]">{L.nightHours}</div>
                  <div className="text-lg font-semibold text-[#1A1B1A]">
                    {formatNumber(computed.worst.nightHours, 1, locale)} h
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div>
            <h4 className="text-sm font-medium text-[#1A1B1A] mb-2">
              {mode === 'burnHours'
                ? L.chartTitle
                : locale === 'nl'
                  ? 'Maximaal continu vermogen per maand'
                  : 'Maximum continuous power per month'}
            </h4>
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
                {mode === 'burnHours' ? (
                  <>
                    <Bar dataKey={L.burnHours} fill="#E14C2A" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey={L.burnHours}
                        position="top"
                        style={{ fill: '#E14C2A', fontSize: 11, fontWeight: 600 }}
                      />
                    </Bar>
                    <Bar dataKey={L.nightHours} fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey={L.nightHours}
                        position="top"
                        style={{ fill: '#0ea5e9', fontSize: 11, fontWeight: 600 }}
                      />
                    </Bar>
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey={locale === 'nl' ? 'Max vermogen (W)' : 'Max power (W)'}
                      fill="#E14C2A"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList
                        dataKey="pctLabel"
                        position="top"
                        style={{ fill: '#E14C2A', fontSize: 11, fontWeight: 600 }}
                      />
                    </Bar>
                    <Bar
                      dataKey={locale === 'nl' ? 'Lamp vol vermogen (W)' : 'Light full power (W)'}
                      fill="#0ea5e9"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                )}
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
