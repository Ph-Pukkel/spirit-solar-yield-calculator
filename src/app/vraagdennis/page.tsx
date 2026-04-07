'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Mail, MailX } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type FeedbackRow = {
  id: string;
  name: string | null;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  screenshot_data: string | null;
  email_sent: boolean;
  created_at: string;
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

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // On client, we only have the anon key; service role is server-only.
  // Use the anon key here — feedback table should allow select for authed admin.
  // If not, the fetch will fall back to the API route pattern.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function FeedbackPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('vraagdennis_ok') === '1') {
      setUnlocked(true);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getServiceClient();
      if (!supabase) {
        setError('Supabase is niet geconfigureerd.');
        setLoading(false);
        return;
      }
      const { data, error: dbErr } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (dbErr) throw new Error(dbErr.message);
      setRows((data as FeedbackRow[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout bij ophalen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) fetchFeedback();
  }, [fetchFeedback, unlocked]);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#EDEAE5] flex items-center justify-center p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwInput === 'jimi') {
              sessionStorage.setItem('vraagdennis_ok', '1');
              setUnlocked(true);
            } else {
              setPwError(true);
            }
          }}
          className="glass-card p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-semibold text-[#1A1B1A] mb-4">Vraag Dennis</h1>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
            placeholder="Wachtwoord"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-[#D7D3CD] bg-white text-[#1A1B1A] focus:outline-none focus:border-[#E14C2A]"
          />
          {pwError && <p className="mt-2 text-sm text-red-500">Onjuist wachtwoord</p>}
          <button
            type="submit"
            className="mt-4 w-full px-4 py-2 rounded-lg bg-[#E14C2A] text-white font-medium hover:bg-[#c43e20] transition-colors cursor-pointer"
          >
            Open
          </button>
        </form>
      </div>
    );
  }

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
              onClick={fetchFeedback}
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold text-[#1A1B1A] mb-6">
          Vraag Dennis — Feedback
        </h1>

        {loading ? (
          <div className="glass-card p-8 text-center text-[#707070]">Laden...</div>
        ) : error ? (
          <div className="glass-card p-8 text-center text-red-500">{error}</div>
        ) : rows.length === 0 ? (
          <div className="glass-card p-8 text-center text-[#707070]">
            Geen feedbackberichten gevonden.
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F5F5F5] text-[#707070]">
                    <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Datum &amp; tijd</th>
                    <th className="text-left px-4 py-3 font-medium">Naam</th>
                    <th className="text-left px-4 py-3 font-medium">Bericht</th>
                    <th className="text-left px-4 py-3 font-medium">Pagina</th>
                    <th className="text-left px-4 py-3 font-medium">Screenshot</th>
                    <th className="text-left px-4 py-3 font-medium">E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#E5E5E5] hover:bg-[#F0EDE8] transition-colors align-top"
                    >
                      <td className="px-4 py-3 text-[#3E3D3D] whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-[#1A1B1A]">
                        {row.name || <span className="text-[#A5A5A4] italic">Anoniem</span>}
                      </td>
                      <td className="px-4 py-3 text-[#1A1B1A] max-w-xs">
                        <span title={row.message}>{truncate(row.message, 120)}</span>
                      </td>
                      <td className="px-4 py-3 text-[#707070] max-w-[180px]">
                        {row.page_url ? (
                          <a
                            href={row.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#E14C2A] hover:underline break-all text-xs"
                          >
                            {truncate(row.page_url, 50)}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.screenshot_data ? (
                          <button
                            onClick={() => setLightboxSrc(row.screenshot_data)}
                            className="cursor-pointer"
                            title="Klik om te vergroten"
                          >
                            <img
                              src={row.screenshot_data}
                              alt="screenshot"
                              className="w-20 h-12 object-cover rounded border border-[#D7D3CD] hover:border-[#E14C2A] transition-colors"
                            />
                          </button>
                        ) : (
                          <span className="text-[#A5A5A4]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.email_sent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                            <Mail className="w-3 h-3" />
                            Verzonden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#707070] border border-[#E5E5E5]">
                            <MailX className="w-3 h-3" />
                            Niet verstuurd
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Screenshot vergroot"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            style={{ maxHeight: '90vh' }}
          />
        </div>
      )}
    </div>
  );
}
