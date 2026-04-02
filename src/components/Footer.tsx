import { ExternalLink } from 'lucide-react';
import type { Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const t = locale === 'nl' ? nl : en;

  return (
    <footer className="w-full bg-spirit-black border-t border-white/10 mt-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Disclaimer */}
        <p className="text-xs text-spirit-gray-400 leading-relaxed mb-6">
          {t.footer.disclaimer}
        </p>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
          <p className="text-xs text-spirit-gray-600">
            {t.footer.copyright}
          </p>
          <a
            href="https://spiritsolarlighting.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-spirit-green hover:text-spirit-green-light transition-colors"
          >
            spiritsolarlighting.com
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
