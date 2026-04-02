import { NextResponse } from 'next/server';
import { fetchPvgisData, getRadDatabase, PvgisCallParams } from '@/lib/pvgis';
import { combineResults } from '@/lib/calculations';
import { PvgisApiRequest, PvgisResponse, Direction } from '@/lib/types';
import { wpToKwp, getAspect } from '@/lib/solar-utils';

export async function POST(request: Request) {
  try {
    const body: PvgisApiRequest = await request.json();
    const { lat, lon, wp_north, wp_east, wp_south, wp_west, loss } = body;

    // Validate required fields
    if (lat == null || lon == null || loss == null) {
      return NextResponse.json(
        { error: 'Missing required fields: lat, lon, loss' },
        { status: 400 }
      );
    }

    const raddatabase = getRadDatabase(lat, lon);

    // Build fetch calls for each direction, skipping where Wp = 0
    const directions: { direction: Direction; wp: number }[] = [
      { direction: 'south', wp: wp_south },
      { direction: 'east', wp: wp_east },
      { direction: 'west', wp: wp_west },
      { direction: 'north', wp: wp_north },
    ];

    const promises = directions.map(({ direction, wp }) => {
      if (!wp || wp === 0) {
        return Promise.resolve(null);
      }

      const params: PvgisCallParams = {
        lat,
        lon,
        peakpowerKwp: wpToKwp(wp),
        aspect: getAspect(direction),
        loss,
        raddatabase,
      };

      return fetchPvgisData(params);
    });

    const [southData, eastData, westData, northData] = await Promise.all(promises) as [
      PvgisResponse | null,
      PvgisResponse | null,
      PvgisResponse | null,
      PvgisResponse | null
    ];

    const config = { wp_north, wp_east, wp_south, wp_west, loss };
    const result = combineResults(
      southData,
      eastData,
      westData,
      northData,
      config,
      { lat, lon }
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'LOCATION_OUT_OF_RANGE') {
      return NextResponse.json(
        { error: 'Location is outside PVGIS coverage area' },
        { status: 400 }
      );
    }

    if (message === 'PVGIS_UNAVAILABLE') {
      return NextResponse.json(
        { error: 'PVGIS service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    console.error('PVGIS API error:', message);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
