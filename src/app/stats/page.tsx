'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PageVisit = {
  id: string;
  page: string;
  visited_at: string;
  user_agent: string | null;
  referrer: string | null;
};

type DailyCount = {
  date: string;
  count: number;
};

type Stats = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(str: string | null, max: number) {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentVisits, setRecentVisits] = useState<PageVisit[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, todayRes, weekRes, monthRes, recentRes, dailyRes] = await Promise.all([
      supabase.from('page_visits').select('id', { count: 'exact', head: true }),
      supabase.from('page_visits').select('id', { count: 'exact', head: true }).gte('visited_at', todayStart),
      supabase.from('page_visits').select('id', { count: 'exact', head: true }).gte('visited_at', weekStart),
      supabase.from('page_visits').select('id', { count: 'exact', head: true }).gte('visited_at', monthStart),
      supabase.from('page_visits').select('*').order('visited_at', { ascending: false }).limit(50),
      supabase.from('page_visits').select('visited_at').gte('visited_at', thirtyDaysAgo).order('visited_at', { ascending: true }),
    ]);

    setStats({
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      thisWeek: weekRes.count ?? 0,
      thisMonth: monthRes.count ?? 0,
    });

    setRecentVisits((recentRes.data as PageVisit[]) || []);

    // Aggregate daily counts
    const countsByDate: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      countsByDate[key] = 0;
    }
    for (const row of (dailyRes.data || []) as { visited_at: string }[]) {
      const key = row.visited_at.slice(0, 10);
      if (key in countsByDate) countsByDate[key]++;
    }
    setDailyCounts(
      Object.entries(countsByDate).map(([date, count]) => ({ date, count }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#EDEAE5]">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-[#707070]">Supabase is niet geconfigureerd.</p>
          <a href="/" className="mt-4 inline-block text-[#E14C2A] hover:underline">
            Terug naar calculator
          </a>
        </div>
      </div>
    );
  }

  const maxDaily = dailyCounts.reduce((m, d) => Math.max(m, d.count), 1);

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      {/* Header */}
      <header className="w-full bg-[#1A1B1A] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-[#9ca3af] hover:text-[#E14C2A] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar calculator
            </a>
            <button
              onClick={fetchStats}
              className="px-3 py-1.5 rounded-lg bg-[#2d2d2d] border border-white/10 text-[#e5e5e5] hover:bg-[#E14C2A]/20 hover:border-[#E14C2A]/40 transition-colors text-sm font-medium cursor-pointer"
            >
              Vernieuwen
            </button>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <img
            src="https://spiritsolarlighting.com/assets/globals/spirit-lijnlogo.svg"
            alt=""
            className="w-full h-2 object-cover opacity-80"
            aria-hidden="true"
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#1A1B1A] mb-6">
          Bezoekersstatistieken
        </h1>

        {loading ? (
          <div className="glass-card p-8 text-center text-[#707070]">Laden...</div>
        ) : (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Totaal bezoeken', value: stats?.total ?? 0 },
                { label: 'Vandaag', value: stats?.today ?? 0 },
                { label: 'Deze week', value: stats?.thisWeek ?? 0 },
                { label: 'Deze maand', value: stats?.thisMonth ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="glass-card p-5 text-center">
                  <div className="text-3xl font-bold text-[#E14C2A]">{value}</div>
                  <div className="text-sm text-[#707070] mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Bar chart — visits per day (last 30 days) */}
            <div className="glass-card p-6 mb-8">
              <h2 className="text-base font-semibold text-[#1A1B1A] mb-4">
                Bezoeken per dag (laatste 30 dagen)
              </h2>
              <div className="flex items-end gap-1 h-32">
                {dailyCounts.map(({ date, count }) => (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${date}: ${count} bezoek${count !== 1 ? 'en' : ''}`}
                  >
                    <div
                      className="w-full bg-[#E14C2A] rounded-t transition-all"
                      style={{ height: `${Math.max(2, (count / maxDaily) * 112)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-[#A5A5A4] mt-1">
                <span>{dailyCounts[0]?.date ?? ''}</span>
                <span>{dailyCounts[dailyCounts.length - 1]?.date ?? ''}</span>
              </div>
            </div>

            {/* Recent visits table */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5E5]">
                <h2 className="text-base font-semibold text-[#1A1B1A]">
                  Recente bezoeken (laatste 50)
                </h2>
              </div>
              {recentVisits.length === 0 ? (
                <div className="p-8 text-center text-[#707070]">Geen bezoeken gevonden.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5] text-[#707070]">
                        <th className="text-left px-4 py-3 font-medium">Datum &amp; tijd</th>
                        <th className="text-left px-4 py-3 font-medium">Pagina</th>
                        <th className="text-left px-4 py-3 font-medium">User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVisits.map((visit) => (
                        <tr
                          key={visit.id}
                          className="border-b border-[#E5E5E5] hover:bg-[#F0EDE8] transition-colors"
                        >
                          <td className="px-4 py-3 text-[#3E3D3D] whitespace-nowrap">
                            {formatDate(visit.visited_at)}
                          </td>
                          <td className="px-4 py-3 text-[#1A1B1A] font-medium">
                            {visit.page}
                          </td>
                          <td className="px-4 py-3 text-[#707070] font-mono text-xs max-w-xs">
                            {truncate(visit.user_agent, 80)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
