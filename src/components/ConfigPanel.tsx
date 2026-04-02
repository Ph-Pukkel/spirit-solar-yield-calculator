'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Locale, PanelPreset, PanelConfig } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface ConfigPanelProps {
  locale: Locale;
  presets: PanelPreset[];
  onCalculate: (config: PanelConfig) => void;
  isCalculating: boolean;
  hasLocation: boolean;
}

export default function ConfigPanel({
  locale,
  presets,
  onCalculate,
  isCalculating,
  hasLocation,
}: ConfigPanelProps) {
  const t = locale === 'nl' ? nl : en;

  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [allSidesEqual, setAllSidesEqual] = useState(true);
  const [wpAll, setWpAll] = useState(0);
  const [wpNorth, setWpNorth] = useState(0);
  const [wpEast, setWpEast] = useState(0);
  const [wpSouth, setWpSouth] = useState(0);
  const [wpWest, setWpWest] = useState(0);
  const [loss, setLoss] = useState(14);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLossTooltip, setShowLossTooltip] = useState(false);

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setSelectedPresetId(id);
      if (!id) return;

      const preset = presets.find((p) => p.id === id);
      if (preset) {
        const wp = preset.wp_per_side;
        setWpAll(wp);
        setWpNorth(wp);
        setWpEast(wp);
        setWpSouth(wp);
        setWpWest(wp);
        setLoss(preset.system_loss);
      }
    },
    [presets]
  );

  // Sync allSidesEqual value to individual fields
  useEffect(() => {
    if (allSidesEqual) {
      setWpNorth(wpAll);
      setWpEast(wpAll);
      setWpSouth(wpAll);
      setWpWest(wpAll);
    }
  }, [allSidesEqual, wpAll]);

  const getWpValues = useCallback(() => {
    if (allSidesEqual) {
      return { wp_north: wpAll, wp_east: wpAll, wp_south: wpAll, wp_west: wpAll };
    }
    return { wp_north: wpNorth, wp_east: wpEast, wp_south: wpSouth, wp_west: wpWest };
  }, [allSidesEqual, wpAll, wpNorth, wpEast, wpSouth, wpWest]);

  const handleCalculate = useCallback(() => {
    const values = getWpValues();
    onCalculate({ ...values, loss });
  }, [getWpValues, loss, onCalculate]);

  const wpValues = getWpValues();
  const hasWp = wpValues.wp_north > 0 || wpValues.wp_east > 0 || wpValues.wp_south > 0 || wpValues.wp_west > 0;
  const isDisabled = !hasLocation || !hasWp || isCalculating;

  return (
    <div className="glass-card p-6 w-full">
      <h2 className="text-xl font-semibold text-white mb-4">{t.config.title}</h2>

      {/* Preset dropdown */}
      <div className="mb-5">
        <label className="block text-sm text-[#9ca3af] mb-1">{t.config.preset}</label>
        <select
          value={selectedPresetId}
          onChange={handlePresetChange}
          className="w-full px-3 py-2 rounded-lg bg-[#2d2d2d] border border-white/10 text-white focus:outline-none focus:border-[#E14C2A] transition-colors appearance-none cursor-pointer"
        >
          <option value="">{t.config.selectPreset}</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}{preset.description ? ` — ${preset.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* All sides equal toggle */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          role="switch"
          aria-checked={allSidesEqual}
          onClick={() => setAllSidesEqual(!allSidesEqual)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            allSidesEqual ? 'bg-[#E14C2A]' : 'bg-[#4b5563]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
              allSidesEqual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-white">{t.config.allSidesEqual}</span>
      </div>

      {/* Wp inputs */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-[#9ca3af]">{t.config.wpPerSide}</label>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-5 h-5 rounded-full bg-[#4b5563] text-white text-xs flex items-center justify-center hover:bg-[#E14C2A] transition-colors"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute z-10 left-7 top-1/2 -translate-y-1/2 w-56 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-xs text-[#9ca3af] shadow-lg">
                {t.config.wpTooltip}
              </div>
            )}
          </div>
        </div>

        {allSidesEqual ? (
          <div>
            <input
              type="number"
              min={0}
              value={wpAll || ''}
              onChange={(e) => setWpAll(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg bg-[#2d2d2d] border border-white/10 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#E14C2A] transition-colors"
            />
            <span className="text-xs text-[#9ca3af] mt-1 block">Wp ({t.config.allSidesEqual})</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: t.config.north, value: wpNorth, setter: setWpNorth, color: 'var(--color-north)' },
              { label: t.config.east, value: wpEast, setter: setWpEast, color: 'var(--color-east)' },
              { label: t.config.south, value: wpSouth, setter: setWpSouth, color: 'var(--color-south)' },
              { label: t.config.west, value: wpWest, setter: setWpWest, color: 'var(--color-west)' },
            ] as const).map(({ label, value, setter, color }) => (
              <div key={label}>
                <label className="block text-xs mb-1" style={{ color }}>
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  value={value || ''}
                  onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-[#2d2d2d] border border-white/10 text-white placeholder-[#4b5563] focus:outline-none focus:border-[#E14C2A] transition-colors"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System loss slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#9ca3af]">{t.config.systemLoss}</label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowLossTooltip(true)}
                onMouseLeave={() => setShowLossTooltip(false)}
                onClick={() => setShowLossTooltip(!showLossTooltip)}
                className="w-5 h-5 rounded-full bg-[#4b5563] text-white text-xs flex items-center justify-center hover:bg-[#E14C2A] transition-colors"
              >
                ?
              </button>
              {showLossTooltip && (
                <div className="absolute z-10 left-7 top-1/2 -translate-y-1/2 w-64 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 text-xs text-[#9ca3af] shadow-lg">
                  {t.config.lossTooltip}
                </div>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-white">{loss}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={loss}
          onChange={(e) => setLoss(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #E14C2A 0%, #E14C2A ${(loss / 30) * 100}%, #4b5563 ${(loss / 30) * 100}%, #4b5563 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-[#4b5563] mt-1">
          <span>0%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Calculate button */}
      <button
        type="button"
        onClick={handleCalculate}
        disabled={isDisabled}
        className={`w-full py-3 rounded-lg text-white font-semibold text-base transition-all duration-200 ${
          isDisabled
            ? 'bg-[#4b5563] cursor-not-allowed opacity-50'
            : 'bg-[#E14C2A] hover:bg-[#993624] active:bg-[#BC3D21] cursor-pointer shadow-lg shadow-[#E14C2A]/20'
        }`}
      >
        {isCalculating ? t.config.calculating : t.config.calculate}
      </button>

      {/* Validation hints */}
      {!hasLocation && (
        <p className="mt-2 text-xs text-amber-400">{t.errors.fillLocation}</p>
      )}
      {hasLocation && !hasWp && (
        <p className="mt-2 text-xs text-amber-400">{t.errors.fillWp}</p>
      )}
    </div>
  );
}
