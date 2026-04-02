// PVGIS API types
export interface PvgisMonthlyData {
  month: number;
  E_d: number;   // Average daily production (kWh)
  E_m: number;   // Average monthly production (kWh)
  "H(i)_d": number; // Average daily irradiation (kWh/m²)
  "H(i)_m": number; // Average monthly irradiation (kWh/m²)
  SD_m: number;  // Standard deviation
}

export interface PvgisTotals {
  E_d: number;
  E_m: number;
  E_y: number;
}

export interface PvgisResponse {
  outputs: {
    monthly: {
      fixed: PvgisMonthlyData[];
    };
    totals: {
      fixed: PvgisTotals;
    };
  };
}

// Cardinal directions
export type Direction = 'north' | 'east' | 'south' | 'west';

// Panel configuration
export interface PanelConfig {
  wp_north: number;
  wp_east: number;
  wp_south: number;
  wp_west: number;
  loss: number;
}

// Combined monthly result for all 4 directions
export interface MonthlyResult {
  month: number;
  monthName: string;
  north_wh_day: number;
  east_wh_day: number;
  south_wh_day: number;
  west_wh_day: number;
  total_wh_day: number;
  north_kwh_month: number;
  east_kwh_month: number;
  south_kwh_month: number;
  west_kwh_month: number;
  total_kwh_month: number;
}

// Full calculation result
export interface CalculationResult {
  location: {
    lat: number;
    lon: number;
    name?: string;
  };
  config: PanelConfig;
  monthly: MonthlyResult[];
  totals: {
    yearly_kwh: number;
    avg_daily_wh: number;
    best_month: { name: string; wh_day: number };
    worst_month: { name: string; wh_day: number };
  };
  timestamp: string;
}

// Supabase panel preset
export interface PanelPreset {
  id: string;
  name: string;
  description: string | null;
  wp_per_side: number;
  technology: string;
  system_loss: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// API request body
export interface PvgisApiRequest {
  lat: number;
  lon: number;
  wp_north: number;
  wp_east: number;
  wp_south: number;
  wp_west: number;
  loss: number;
}

// i18n
export type Locale = 'nl' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}
