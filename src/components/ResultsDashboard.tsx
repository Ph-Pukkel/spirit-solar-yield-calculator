'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import type { CalculationResult, Locale } from '@/lib/types';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';
import SummaryCards from '@/components/SummaryCards';
import MonthlyChart from '@/components/MonthlyChart';
import DetailTable from '@/components/DetailTable';
import PdfExport from '@/components/PdfExport';

interface ResultsDashboardProps {
  result: CalculationResult;
  locale: Locale;
  onReset: () => void;
}

export default function ResultsDashboard({ result, locale, onReset }: ResultsDashboardProps) {
  const t = locale === 'nl' ? nl : en;
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <section ref={sectionRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h2 className="text-2xl font-bold text-spirit-white">{t.results.title}</h2>

      <SummaryCards result={result} locale={locale} />

      <MonthlyChart data={result.monthly} locale={locale} />

      <DetailTable data={result.monthly} locale={locale} />

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
        <PdfExport result={result} locale={locale} />
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-spirit-dark border border-white/10 hover:bg-white/10 text-spirit-gray-200 font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {t.results.newCalculation}
        </button>
      </div>
    </section>
  );
}
