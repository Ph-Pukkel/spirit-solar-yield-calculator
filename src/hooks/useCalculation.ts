'use client';

import { useState, useCallback } from 'react';
import { CalculationResult, PanelConfig } from '@/lib/types';

interface UseCalculationReturn {
  result: CalculationResult | null;
  loading: boolean;
  error: string | null;
  loadingStep: string;
  calculate: (
    lat: number,
    lon: number,
    config: PanelConfig,
    locationName?: string,
    locale?: string
  ) => Promise<void>;
  reset: () => void;
}

export function useCalculation(): UseCalculationReturn {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
    setError(null);
    setLoadingStep('');
  }, []);

  const calculate = useCallback(
    async (
      lat: number,
      lon: number,
      config: PanelConfig,
      locationName?: string,
      locale?: string
    ) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        setLoadingStep('Preparing request...');

        const body = {
          lat,
          lon,
          wp_north: config.wp_north,
          wp_east: config.wp_east,
          wp_south: config.wp_south,
          wp_west: config.wp_west,
          loss: config.loss,
        };

        setLoadingStep('Fetching solar data from PVGIS...');

        const response = await fetch('/api/pvgis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || `Server error: ${response.status}`);
        }

        setLoadingStep('Processing results...');

        const data: CalculationResult = await response.json();

        // Attach location name if provided
        if (locationName) {
          data.location.name = locationName;
        }

        setResult(data);
        setLoadingStep('');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        setLoadingStep('');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, loadingStep, calculate, reset };
}
