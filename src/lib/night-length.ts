// Astronomical night length calculations.
// All inputs in degrees / 1-indexed months.

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Average night hours per day for the given latitude and month (1-12).
 * Uses the mid-month day (day 15) and a standard solar declination model.
 * Clamps polar day/night cases.
 */
export function nightHoursForMonth(lat: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  const N = DAYS_BEFORE_MONTH[month - 1] + 15; // day-of-year for the 15th
  const declDeg = 23.45 * Math.sin(toRad((360 * (284 + N)) / 365));
  const cosH = -Math.tan(toRad(lat)) * Math.tan(toRad(declDeg));

  if (cosH > 1) {
    // Sun never rises -> polar night
    return 24;
  }
  if (cosH < -1) {
    // Sun never sets -> polar day
    return 0;
  }
  const Hdeg = toDeg(Math.acos(cosH));
  const daylightHours = (2 * Hdeg) / 15;
  return 24 - daylightHours;
}

/**
 * Average daylight hours (sunrise to sunset) per day for the given latitude
 * and month. Inverse of nightHoursForMonth.
 */
export function dayHoursForMonth(lat: number, month: number): number {
  return 24 - nightHoursForMonth(lat, month);
}

/**
 * Helper: average night hours across the year, weighted equally per month.
 * monthlyDaytimeWh is currently unused but accepted to allow future
 * energy-weighted averaging.
 */
export function avgNightHours(lat: number, monthlyDaytimeWh?: number[]): number {
  let sum = 0;
  for (let m = 1; m <= 12; m++) {
    sum += nightHoursForMonth(lat, m);
  }
  void monthlyDaytimeWh;
  return sum / 12;
}
