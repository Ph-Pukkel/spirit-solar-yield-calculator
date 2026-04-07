'use client';

import { useState, useRef } from 'react';
import { MessageCircle, X, Camera, Trash2, Send } from 'lucide-react';

export default function VraagDennis() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    setSent(false);
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // reset after close animation
    setTimeout(() => {
      setName('');
      setMessage('');
      setScreenshot(null);
      setSent(false);
      setError(null);
    }, 200);
  };

  const handleScreenshot = async () => {
    setCapturing(true);
    setError(null);
    try {
      // Temporarily hide the modal so it doesn't appear in screenshot
      if (modalRef.current) modalRef.current.style.visibility = 'hidden';
      const floatBtn = document.getElementById('vraag-dennis-float');
      if (floatBtn) floatBtn.style.visibility = 'hidden';

      await new Promise((r) => setTimeout(r, 80));

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 0.75,
        logging: false,
      });
      setScreenshot(canvas.toDataURL('image/jpeg', 0.7));
    } catch (e) {
      console.error('Screenshot error', e);
      setError('Screenshot mislukt. Probeer het opnieuw.');
    } finally {
      if (modalRef.current) modalRef.current.style.visibility = '';
      const floatBtn = document.getElementById('vraag-dennis-float');
      if (floatBtn) floatBtn.style.visibility = '';
      setCapturing(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          message: message.trim(),
          screenshot: screenshot ?? undefined,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Verzenden mislukt');
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verzenden mislukt');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        id="vraag-dennis-float"
        onClick={handleOpen}
        aria-label="Vraag Dennis"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
        style={{ backgroundColor: '#E14C2A' }}
      >
        <MessageCircle className="w-5 h-5 flex-shrink-0" />
        <span>Vraag Dennis</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Modal */}
          <div
            ref={modalRef}
            className="glass-card w-full max-w-md p-6 flex flex-col gap-4"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" style={{ color: '#E14C2A' }} />
                <h2 className="text-base font-semibold text-[#1A1B1A]">Vraag Dennis</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#707070] hover:text-[#1A1B1A] hover:bg-[#F0EDE8] transition-colors cursor-pointer"
                aria-label="Sluiten"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              /* Success state */
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(225,76,42,0.12)' }}
                >
                  <Send className="w-6 h-6" style={{ color: '#E14C2A' }} />
                </div>
                <p className="text-[#1A1B1A] font-semibold">Verzonden! Dank je wel.</p>
                <p className="text-sm text-[#707070]">Dennis neemt zo snel mogelijk contact op.</p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
                  style={{ backgroundColor: '#E14C2A' }}
                >
                  Sluiten
                </button>
              </div>
            ) : (
              <>
                {/* Name field */}
                <div>
                  <label className="block text-sm text-[#707070] mb-1">
                    Naam <span className="text-[#A5A5A4]">(optioneel)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jouw naam..."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] text-sm placeholder-[#A5A5A4] focus:outline-none focus:border-[#E14C2A] transition-colors"
                  />
                </div>

                {/* Message field */}
                <div>
                  <label className="block text-sm text-[#707070] mb-1">
                    Bericht <span className="text-[#E14C2A]">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Wensen, problemen, ideeën..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] text-sm placeholder-[#A5A5A4] focus:outline-none focus:border-[#E14C2A] transition-colors resize-none"
                  />
                </div>

                {/* Screenshot section */}
                <div>
                  {screenshot ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#707070]">Screenshot</span>
                        <button
                          onClick={() => setScreenshot(null)}
                          className="flex items-center gap-1 text-xs text-[#E14C2A] hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Verwijderen
                        </button>
                      </div>
                      <img
                        src={screenshot}
                        alt="Screenshot preview"
                        className="w-full rounded-lg border border-[#D7D3CD] object-contain"
                        style={{ maxHeight: '140px' }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={handleScreenshot}
                      disabled={capturing}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D7D3CD] bg-white text-[#707070] hover:border-[#E14C2A] hover:text-[#E14C2A] text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                    >
                      <Camera className="w-4 h-4" />
                      {capturing ? 'Bezig met screenshot...' : 'Maak screenshot'}
                    </button>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={sending || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#E14C2A' }}
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Verzenden...' : 'Stuur naar Dennis'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-lg bg-white border border-[#D7D3CD] text-[#1A1B1A] font-medium text-sm hover:bg-[#F0EDE8] transition-colors cursor-pointer"
                  >
                    Annuleren
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
