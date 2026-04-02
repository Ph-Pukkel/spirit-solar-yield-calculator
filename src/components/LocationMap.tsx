'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';


const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  searchPlaceholder: string;
  onLocationChange: (lat: number, lon: number, name?: string) => void;
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lon: number, name?: string) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then((res) => res.json())
        .then((data) => {
          const name = data.display_name || '';
          onLocationChange(lat, lng, name);
        })
        .catch(() => {
          onLocationChange(lat, lng);
        });
    },
  });
  return null;
}

function FlyToLocation({ lat, lon }: { lat: number | null; lon: number | null }) {
  const map = useMap();
  const prevRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });

  useEffect(() => {
    if (lat !== null && lon !== null && (lat !== prevRef.current.lat || lon !== prevRef.current.lon)) {
      map.flyTo([lat, lon], Math.max(map.getZoom(), 10), { duration: 1 });
      prevRef.current = { lat, lon };
    }
  }, [lat, lon, map]);

  return null;
}

export default function LocationMap({ latitude, longitude, searchPlaceholder, onLocationChange }: LocationMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);
  }, []);

  const handleSelectResult = useCallback(
    (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      onLocationChange(lat, lon, result.display_name);
      setSearchQuery(result.display_name.split(',')[0]);
      setShowResults(false);
      setSearchResults([]);
    },
    [onLocationChange]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {/* Search bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] placeholder-[#A5A5A4] focus:outline-none focus:border-[#E14C2A] transition-colors"
        />
        {/* Search icon */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        {/* Dropdown results */}
        {showResults && searchResults.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-1 rounded-lg bg-white border border-[#D7D3CD] overflow-hidden shadow-lg">
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelectResult(result)}
                className="px-4 py-2.5 text-sm text-[#1A1B1A] cursor-pointer hover:bg-[#F5F5F5] transition-colors border-b border-[#E5E5E5] last:border-b-0"
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={[51.5, 10]}
        zoom={4}
        style={{ height: '400px', width: '100%' }}
        className="leaflet-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationChange={onLocationChange} />
        <FlyToLocation lat={latitude} lon={longitude} />
        {latitude !== null && longitude !== null && (
          <Marker position={[latitude, longitude]} icon={icon} />
        )}
      </MapContainer>
    </div>
  );
}
