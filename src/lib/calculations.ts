import { PvgisResponse, MonthlyResult, CalculationResult, PanelConfig } from './types';

const MONTH_NAMES_NL = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getMonthNames(locale: string = 'nl'): string[] {
  return locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_NL;
}

export function combineResults(
  southData: PvgisResponse | null,
  eastData: PvgisResponse | null,
  westData: PvgisResponse | null,
  northData: PvgisResponse | null,
  config: PanelConfig,
  location: { lat: number; lon: number; name?: string },
  locale: string = 'nl'
): CalculationResult {
  const monthNames = getMonthNames(locale);

  const monthly: MonthlyResult[] = [];

  for (let i = 0; i < 12; i++) {
    const month = i + 1;

    // PVGIS E_d is in kWh/day → convert to Wh/day (* 1000)
    const south_wh_day = southData ? southData.outputs.monthly.fixed[i].E_d * 1000 : 0;
    const east_wh_day = eastData ? eastData.outputs.monthly.fixed[i].E_d * 1000 : 0;
    const west_wh_day = westData ? westData.outputs.monthly.fixed[i].E_d * 1000 : 0;
    const north_wh_day = northData ? northData.outputs.monthly.fixed[i].E_d * 1000 : 0;

    // PVGIS E_m is in kWh/month
    const south_kwh_month = southData ? southData.outputs.monthly.fixed[i].E_m : 0;
    const east_kwh_month = eastData ? eastData.outputs.monthly.fixed[i].E_m : 0;
    const west_kwh_month = westData ? westData.outputs.monthly.fixed[i].E_m : 0;
    const north_kwh_month = northData ? northData.outputs.monthly.fixed[i].E_m : 0;

    monthly.push({
      month,
      monthName: monthNames[i],
      north_wh_day: Math.round(north_wh_day * 10) / 10,
      east_wh_day: Math.round(east_wh_day * 10) / 10,
      south_wh_day: Math.round(south_wh_day * 10) / 10,
      west_wh_day: Math.round(west_wh_day * 10) / 10,
      total_wh_day: Math.round((north_wh_day + east_wh_day + south_wh_day + west_wh_day) * 10) / 10,
      north_kwh_month: Math.round(north_kwh_month * 100) / 100,
      east_kwh_month: Math.round(east_kwh_month * 100) / 100,
      south_kwh_month: Math.round(south_kwh_month * 100) / 100,
      west_kwh_month: Math.round(west_kwh_month * 100) / 100,
      total_kwh_month: Math.round((north_kwh_month + east_kwh_month + south_kwh_month + west_kwh_month) * 100) / 100,
    });
  }

  // Calculate totals
  const yearly_kwh = monthly.reduce((sum, m) => sum + m.total_kwh_month, 0);
  // True yearly average daily yield: total kWh × 1000 / 365.25 days.
  // (Mean of monthly averages would over-weight short months.)
  const avg_daily_wh = (yearly_kwh * 1000) / 365.25;

  const bestMonth = monthly.reduce((best, m) =>
    m.total_wh_day > best.total_wh_day ? m : best
  );
  const worstMonth = monthly.reduce((worst, m) =>
    m.total_wh_day < worst.total_wh_day ? m : worst
  );

  return {
    location,
    config,
    monthly,
    totals: {
      yearly_kwh: Math.round(yearly_kwh * 100) / 100,
      avg_daily_wh: Math.round(avg_daily_wh * 10) / 10,
      best_month: { name: bestMonth.monthName, wh_day: bestMonth.total_wh_day },
      worst_month: { name: worstMonth.monthName, wh_day: worstMonth.total_wh_day },
    },
    timestamp: new Date().toISOString(),
  };
}
