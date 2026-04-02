'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false });

interface LocationPickerProps {
  locale: Locale;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
}

export default function LocationPicker({
  locale,
  latitude,
  longitude,
  locationName,
  onLocationChange,
}: LocationPickerProps) {
  const t = locale === 'nl' ? nl : en;

  const handleLatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const lat = parseFloat(e.target.value);
      if (!isNaN(lat)) {
        onLocationChange(lat, longitude ?? 0);
      }
    },
    [longitude, onLocationChange]
  );

  const handleLonChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const lon = parseFloat(e.target.value);
      if (!isNaN(lon)) {
        onLocationChange(latitude ?? 0, lon);
      }
    },
    [latitude, onLocationChange]
  );

  const showPolarWarning = latitude !== null && Math.abs(latitude) > 66;

  return (
    <div className="glass-card p-6 w-full">
      <h2 className="text-xl font-semibold text-[#1A1B1A] mb-4">{t.location.title}</h2>

      <LocationMap
        latitude={latitude}
        longitude={longitude}
        searchPlaceholder={t.location.searchPlaceholder}
        onLocationChange={onLocationChange}
      />

      {/* Coordinate inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm text-[#707070] mb-1">{t.location.latitude}</label>
          <input
            type="number"
            step="any"
            value={latitude !== null ? latitude : ''}
            onChange={handleLatChange}
            placeholder="51.5074"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] placeholder-[#A5A5A4] focus:outline-none focus:border-[#E14C2A] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-[#707070] mb-1">{t.location.longitude}</label>
          <input
            type="number"
            step="any"
            value={longitude !== null ? longitude : ''}
            onChange={handleLonChange}
            placeholder="10.0000"
            className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] placeholder-[#A5A5A4] focus:outline-none focus:border-[#E14C2A] transition-colors"
          />
        </div>
      </div>

      {/* Location name */}
      {locationName && (
        <div className="mt-3">
          <span className="text-sm text-[#707070]">{t.location.locationName}: </span>
          <span className="text-sm text-[#1A1B1A]">{locationName}</span>
        </div>
      )}

      {/* No location hint */}
      {latitude === null && longitude === null && (
        <p className="mt-3 text-sm text-[#707070] italic">{t.location.clickMap}</p>
      )}

      {/* Polar warning */}
      {showPolarWarning && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-amber-400">{t.location.polarWarning}</p>
        </div>
      )}
    </div>
  );
}
