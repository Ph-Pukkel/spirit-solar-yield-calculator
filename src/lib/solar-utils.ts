// Format a number according to locale (Dutch: 1.234,56 / English: 1,234.56)
export function formatNumber(value: number, decimals: number = 1, locale: string = 'nl'): string {
  return value.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Check if latitude is in polar region
export function isPolarRegion(lat: number): boolean {
  return Math.abs(lat) > 66;
}

// Get PVGIS aspect value for a direction
export function getAspect(direction: 'north' | 'east' | 'south' | 'west'): number {
  const aspects: Record<string, number> = {
    south: 0,
    east: -90,
    west: 90,
    north: 180,
  };
  return aspects[direction];
}

// Convert Wp to kWp for PVGIS API
export function wpToKwp(wp: number): number {
  return wp / 1000;
}
