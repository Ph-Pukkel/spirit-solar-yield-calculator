'use client';

import type { Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface LoadingStateProps {
  step: string;
  locale: Locale;
}

type LoadingKeys = typeof nl.loading;

export default function LoadingState({ step, locale }: LoadingStateProps) {
  const t = locale === 'nl' ? nl : en;
  const stepText = (t.loading as LoadingKeys)[step as keyof LoadingKeys] ?? step;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-spirit-black/80 backdrop-blur-sm">
      <div className="glass-card p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4">
        {/* Animated sun SVG */}
        <div className="relative w-20 h-20">
          {/* Rotating rays */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: '8s' }}
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const rad = (angle * Math.PI) / 180;
              const x1 = 40 + Math.cos(rad) * 24;
              const y1 = 40 + Math.sin(rad) * 24;
              const x2 = 40 + Math.cos(rad) * 36;
              const y2 = 40 + Math.sin(rad) * 36;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#7ab648"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity={0.5 + (i % 3) * 0.15}
                />
              );
            })}
          </svg>

          {/* Pulsing core */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="40"
              cy="40"
              r="16"
              fill="#7ab648"
              className="animate-pulse"
            />
            <circle
              cx="40"
              cy="40"
              r="16"
              fill="none"
              stroke="#8ec95c"
              strokeWidth="2"
              opacity="0.4"
              className="animate-ping"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-spirit-white font-medium text-lg">
            {t.loading.calculating}
          </p>
          <p className="text-spirit-green text-sm animate-pulse">
            {stepText}
          </p>
        </div>
      </div>
    </div>
  );
}
