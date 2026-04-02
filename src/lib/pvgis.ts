import { PvgisResponse } from './types';

const PVGIS_BASE_URL = 'https://re.jrc.ec.europa.eu/api/v5_3/PVcalc';

// Europe/Africa region roughly covered by SARAH3
function isInSarah3Region(lat: number, lon: number): boolean {
  return lat >= -60 && lat <= 60 && lon >= -30 && lon <= 65;
}

export function getRadDatabase(lat: number, lon: number): string {
  return isInSarah3Region(lat, lon) ? 'PVGIS-SARAH3' : 'PVGIS-ERA5';
}

export interface PvgisCallParams {
  lat: number;
  lon: number;
  peakpowerKwp: number;
  aspect: number; // 0=South, -90=East, 90=West, 180=North
  loss: number;
  raddatabase: string;
}

export function buildPvgisUrl(params: PvgisCallParams): string {
  const searchParams = new URLSearchParams({
    lat: params.lat.toString(),
    lon: params.lon.toString(),
    peakpower: params.peakpowerKwp.toString(),
    angle: '90', // Always vertical
    aspect: params.aspect.toString(),
    loss: params.loss.toString(),
    pvtechchoice: 'crystSi',
    outputformat: 'json',
    usehorizon: '1',
    raddatabase: params.raddatabase,
  });

  return `${PVGIS_BASE_URL}?${searchParams.toString()}`;
}

export async function fetchPvgisData(
  params: PvgisCallParams,
  retries: number = 2
): Promise<PvgisResponse> {
  const url = buildPvgisUrl(params);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();

        // Check for out-of-coverage errors
        if (response.status === 400 || text.includes('not valid')) {
          throw new Error('LOCATION_OUT_OF_RANGE');
        }

        throw new Error(`PVGIS returned status ${response.status}: ${text}`);
      }

      const data: PvgisResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.message === 'LOCATION_OUT_OF_RANGE') {
        throw error;
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      throw new Error('PVGIS_UNAVAILABLE');
    }
  }

  throw new Error('PVGIS_UNAVAILABLE');
}
