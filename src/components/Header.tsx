'use client';

import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function Header({ locale, onLocaleChange }: HeaderProps) {
  const t = locale === 'nl' ? nl : en;

  const toggleLocale = () => {
    onLocaleChange(locale === 'nl' ? 'en' : 'nl');
  };

  return (
    <header className="w-full bg-spirit-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and title */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              src="https://spiritsolarlighting.com/assets/logo_spirit_solar.png"
              alt="SPIRIT Solar"
              className="h-10 w-auto"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-xl font-semibold text-spirit-white">
                {t.app.title}
              </h1>
              <p className="text-sm text-spirit-gray-400">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-spirit-dark border border-white/10 text-spirit-gray-200 hover:bg-spirit-green/20 hover:border-spirit-green/40 transition-colors text-sm font-medium cursor-pointer"
            aria-label={`Switch language to ${locale === 'nl' ? 'English' : 'Nederlands'}`}
          >
            <Globe className="w-4 h-4" />
            {t.header.language}
          </button>
        </div>
      </div>

      {/* SPIRIT line decoration */}
      <div className="w-full overflow-hidden">
        <img
          src="https://spiritsolarlighting.com/assets/globals/spirit-lijnlogo.svg"
          alt=""
          className="w-full h-2 object-cover opacity-80"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
