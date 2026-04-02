'use client';

import { useState, useEffect } from 'react';
import { PanelPreset } from '@/lib/types';
import { supabase } from '@/lib/supabase';

const FALLBACK_PRESETS: PanelPreset[] = [
  {
    id: '1',
    name: 'Handmatige invoer',
    description: null,
    wp_per_side: 0,
    technology: 'crystSi',
    system_loss: 14,
    is_default: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    name: 'Voorbeeld: 100 Wp per zijde',
    description: null,
    wp_per_side: 100,
    technology: 'crystSi',
    system_loss: 14,
    is_default: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: '3',
    name: 'Voorbeeld: 150 Wp per zijde',
    description: null,
    wp_per_side: 150,
    technology: 'crystSi',
    system_loss: 14,
    is_default: false,
    created_at: '',
    updated_at: '',
  },
];

interface UsePanelPresetsReturn {
  presets: PanelPreset[];
  loading: boolean;
  error: string | null;
}

export function usePanelPresets(): UsePanelPresetsReturn {
  const [presets, setPresets] = useState<PanelPreset[]>(FALLBACK_PRESETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPresets() {
      // If Supabase is not configured, use fallback presets
      if (!supabase) {
        setPresets(FALLBACK_PRESETS);
        setLoading(false);
        return;
      }

      try {
        const { data, error: supabaseError } = await supabase
          .from('panel_presets')
          .select('*')
          .order('is_default', { ascending: false })
          .order('wp_per_side', { ascending: true });

        if (supabaseError) {
          throw supabaseError;
        }

        if (data && data.length > 0) {
          setPresets(data as PanelPreset[]);
        } else {
          setPresets(FALLBACK_PRESETS);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load presets';
        console.error('Error fetching panel presets:', message);
        setError(message);
        setPresets(FALLBACK_PRESETS);
      } finally {
        setLoading(false);
      }
    }

    fetchPresets();
  }, []);

  return { presets, loading, error };
}
