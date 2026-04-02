'use client';

import { useState, useCallback } from 'react';
import type { Locale, PanelConfig } from '@/lib/types';
import { useCalculation } from '@/hooks/useCalculation';
import { usePanelPresets } from '@/hooks/usePanelPresets';
import { usePageTracking } from '@/hooks/usePageTracking';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LocationPicker from '@/components/LocationPicker';
import ConfigPanel from '@/components/ConfigPanel';
import ResultsDashboard from '@/components/ResultsDashboard';
import LoadingState from '@/components/LoadingState';

export default function Home() {
  usePageTracking();
  const [locale, setLocale] = useState<Locale>('nl');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');

  const { presets } = usePanelPresets();
  const { result, loading, error, loadingStep, calculate, reset } = useCalculation();

  const handleLocationChange = useCallback((lat: number, lon: number, name?: string) => {
    setLatitude(lat);
    setLongitude(lon);
    if (name) setLocationName(name);
  }, []);

  const handleCalculate = useCallback(
    (config: PanelConfig) => {
      if (latitude === null || longitude === null) return;
      calculate(latitude, longitude, config, locationName, locale);
    },
    [latitude, longitude, locationName, locale, calculate]
  );

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header locale={locale} onLocaleChange={setLocale} />

      <main className="flex-1 w-full">
        {/* Input Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Map - takes 3/5 of width on large screens */}
            <div className="lg:col-span-3">
              <LocationPicker
                locale={locale}
                latitude={latitude}
                longitude={longitude}
                locationName={locationName}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Config panel - takes 2/5 of width on large screens */}
            <div className="lg:col-span-2">
              <ConfigPanel
                locale={locale}
                presets={presets}
                onCalculate={handleCalculate}
                isCalculating={loading}
                hasLocation={latitude !== null && longitude !== null}
              />
            </div>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && <LoadingState step={loadingStep} locale={locale} />}

        {/* Results section */}
        {result && (
          <ResultsDashboard
            result={result}
            locale={locale}
            onReset={handleReset}
          />
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
