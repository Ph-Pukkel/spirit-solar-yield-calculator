'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { CalculationResult, Locale } from '@/lib/types';
import { formatNumber } from '@/lib/solar-utils';
import nl from '@/i18n/nl.json';
import en from '@/i18n/en.json';

interface PdfExportProps {
  result: CalculationResult;
  locale: Locale;
}

export default function PdfExport({ result, locale }: PdfExportProps) {
  const t = locale === 'nl' ? nl : en;
  const [loading, setLoading] = useState(false);

  const months = t.months as Record<string, string>;

  async function handleExport() {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // We won't actually need html2canvas for the table approach,
      // but keep the import available for potential chart screenshots
      void html2canvas;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = 0;

      // Header bar
      doc.setFillColor(90, 143, 53); // spirit-green-dark
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Logo text (since loading external images can fail)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SPIRIT Solar Yield Calculator', margin, 18);
      y = 36;

      // Location info
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const locationName = result.location.name || `${result.location.lat}, ${result.location.lon}`;
      doc.text(`${t.location.locationName}: ${locationName}`, margin, y);
      y += 6;
      doc.text(
        `${t.location.latitude}: ${result.location.lat.toFixed(4)}  |  ${t.location.longitude}: ${result.location.lon.toFixed(4)}`,
        margin,
        y,
      );
      y += 6;

      // Panel config
      const configLabel = locale === 'nl' ? 'Paneelconfiguratie' : 'Panel configuration';
      doc.text(
        `${configLabel}: N=${result.config.wp_north} Wp, O=${result.config.wp_east} Wp, Z=${result.config.wp_south} Wp, W=${result.config.wp_west} Wp  |  ${t.config.systemLoss}: ${result.config.loss}%`,
        margin,
        y,
      );
      y += 10;

      // Summary section
      doc.setFillColor(122, 182, 72); // spirit-green
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t.results.title, margin + 3, y + 6);
      y += 14;

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const summaryItems = [
        `${t.results.yearlyTotal}: ${formatNumber(result.totals.yearly_kwh, 1, locale)} ${t.results.kwhPerYear}`,
        `${t.results.bestMonth}: ${result.totals.best_month.name} (${formatNumber(result.totals.best_month.wh_day, 0, locale)} ${t.results.whPerDay})`,
        `${t.results.worstMonth}: ${result.totals.worst_month.name} (${formatNumber(result.totals.worst_month.wh_day, 0, locale)} ${t.results.whPerDay})`,
        `${t.results.avgDaily}: ${formatNumber(result.totals.avg_daily_wh, 0, locale)} ${t.results.whPerDay}`,
      ];

      summaryItems.forEach((item) => {
        doc.text(item, margin, y);
        y += 6;
      });
      y += 4;

      // Detail table header
      doc.setFillColor(122, 182, 72);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(t.results.detailTable, margin + 3, y + 6);
      y += 14;

      // Table
      const colWidths = [25, 22, 22, 22, 22, 25, 28];
      const headers = [
        t.results.month,
        `${t.config.north}`,
        `${t.config.east}`,
        `${t.config.south}`,
        `${t.config.west}`,
        `${t.results.total}`,
        `${t.results.total}`,
      ];
      const subHeaders = [
        '',
        `(${t.results.whPerDay})`,
        `(${t.results.whPerDay})`,
        `(${t.results.whPerDay})`,
        `(${t.results.whPerDay})`,
        `(${t.results.whPerDay})`,
        `(${t.results.kwhPerMonth})`,
      ];

      // Table header row
      doc.setFillColor(45, 45, 45);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      let x = margin + 2;
      headers.forEach((header, i) => {
        doc.text(header, x, y + 4);
        if (subHeaders[i]) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.text(subHeaders[i], x, y + 8);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
        }
        x += colWidths[i];
      });
      y += 12;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      result.monthly.forEach((row, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 3, contentWidth, 6, 'F');
        }
        doc.setTextColor(50, 50, 50);
        x = margin + 2;
        const values = [
          months[String(row.month)],
          formatNumber(row.north_wh_day, 0, locale),
          formatNumber(row.east_wh_day, 0, locale),
          formatNumber(row.south_wh_day, 0, locale),
          formatNumber(row.west_wh_day, 0, locale),
          formatNumber(row.total_wh_day, 0, locale),
          formatNumber(row.total_kwh_month, 1, locale),
        ];
        values.forEach((val, j) => {
          doc.text(val, x, y);
          x += colWidths[j];
        });
        y += 6;
      });

      // Total row
      doc.setFillColor(122, 182, 72);
      doc.rect(margin, y - 3, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');

      const yearAvgNorth = result.monthly.reduce((s, m) => s + m.north_wh_day, 0) / 12;
      const yearAvgEast = result.monthly.reduce((s, m) => s + m.east_wh_day, 0) / 12;
      const yearAvgSouth = result.monthly.reduce((s, m) => s + m.south_wh_day, 0) / 12;
      const yearAvgWest = result.monthly.reduce((s, m) => s + m.west_wh_day, 0) / 12;
      const yearAvgTotal = result.monthly.reduce((s, m) => s + m.total_wh_day, 0) / 12;
      const yearTotalKwh = result.monthly.reduce((s, m) => s + m.total_kwh_month, 0);

      x = margin + 2;
      const totals = [
        t.results.yearTotal,
        formatNumber(yearAvgNorth, 0, locale),
        formatNumber(yearAvgEast, 0, locale),
        formatNumber(yearAvgSouth, 0, locale),
        formatNumber(yearAvgWest, 0, locale),
        formatNumber(yearAvgTotal, 0, locale),
        formatNumber(yearTotalKwh, 1, locale),
      ];
      totals.forEach((val, j) => {
        doc.text(val, x, y + 1);
        x += colWidths[j];
      });
      y += 14;

      // Calculation date
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const calcDate = new Date(result.timestamp).toLocaleDateString(
        locale === 'nl' ? 'nl-NL' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' },
      );
      const dateLabel = locale === 'nl' ? 'Berekend op' : 'Calculated on';
      doc.text(`${dateLabel}: ${calcDate}`, margin, y);
      y += 8;

      // Disclaimer
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(6);
      const disclaimerLines = doc.splitTextToSize(t.footer.disclaimer, contentWidth);
      doc.text(disclaimerLines, margin, y);
      y += disclaimerLines.length * 3 + 4;

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6);
      doc.text(t.footer.copyright, margin, y);

      // Save
      const safeName = (result.location.name || 'location').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`SPIRIT_Solar_Yield_${safeName}_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-spirit-green hover:bg-spirit-green-light disabled:opacity-50 text-white font-medium transition-colors cursor-pointer"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {t.results.exportPdf}
    </button>
  );
}
