'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Camera, Trash2, Send, Undo2, Eraser, Check, Pencil } from 'lucide-react';

export default function VraagDennis() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null); // final annotated dataURL
  const [editing, setEditing] = useState<string | null>(null); // raw screenshot dataURL while annotating
  const [capturing, setCapturing] = useState(false);
  const [hiddenForCapture, setHiddenForCapture] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setSent(false);
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setName('');
      setMessage('');
      setScreenshot(null);
      setEditing(null);
      setSent(false);
      setError(null);
    }, 200);
  };

  const handleScreenshot = async () => {
    setCapturing(true);
    setError(null);
    try {
      // Hide the modal + floating button before the user picks the source,
      // so they don't show up in the captured frame.
      setHiddenForCapture(true);
      // Let React paint the hidden state before opening the picker.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      } as DisplayMediaStreamOptions);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      // Give the browser a frame to settle
      await new Promise((r) => setTimeout(r, 250));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas niet beschikbaar');
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setEditing(dataUrl);
    } catch (e) {
      console.error('Screenshot error', e);
      const msg = e instanceof Error ? e.message : 'Screenshot mislukt';
      // User cancelling the picker is normal — don't show as error
      if (!/permission|denied|aborted|cancel/i.test(msg)) {
        setError('Screenshot mislukt. Probeer het opnieuw.');
      }
    } finally {
      setCapturing(false);
      setHiddenForCapture(false);
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
        style={{ backgroundColor: '#E14C2A', visibility: hiddenForCapture ? 'hidden' : 'visible' }}
      >
        <MessageCircle className="w-5 h-5 flex-shrink-0" />
        <span>Vraag Dennis</span>
      </button>

      {/* Annotator overlay (above modal so it gets full screen) */}
      {editing && (
        <Annotator
          src={editing}
          onCancel={() => setEditing(null)}
          onDone={(dataUrl) => {
            setScreenshot(dataUrl);
            setEditing(null);
          }}
        />
      )}

      {/* Modal */}
      {open && !editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(2px)',
            visibility: hiddenForCapture ? 'hidden' : 'visible',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="glass-card w-full max-w-md p-6 flex flex-col gap-4"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
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

                <div>
                  {screenshot ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#707070]">Screenshot</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setEditing(screenshot)}
                            className="text-xs text-[#E14C2A] hover:underline cursor-pointer"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => setScreenshot(null)}
                            className="flex items-center gap-1 text-xs text-[#E14C2A] hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Verwijderen
                          </button>
                        </div>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  <p className="mt-1 text-xs text-[#A5A5A4]">
                    Browser vraagt welk venster/tabblad je wilt delen. Daarna kun je erop tekenen.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

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

/* ---------------- Annotator ---------------- */

interface AnnotatorProps {
  src: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}

type Stroke = { points: { x: number; y: number }[] };

function Annotator({ src, onCancel, onDone }: AnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0); // for undo/clear button enable state
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load the image once when src changes; size the canvas to fit.
  useEffect(() => {
    let cancelled = false;
    setImgLoaded(false);
    strokesRef.current = [];
    setStrokeCount(0);
    setHasDrawn(false);

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = Math.min(window.innerWidth - 32, 1200);
      const maxH = window.innerHeight - 220;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      setImgLoaded(true);
    };
    img.onerror = () => {
      console.error('Annotator: image failed to load');
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Lock body scroll while annotator is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const fullRedraw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    applyStrokeStyle(ctx, canvas);
    for (const s of strokesRef.current) {
      drawStroke(ctx, s);
    }
  };

  const applyStrokeStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = '#E14C2A';
    ctx.lineWidth = Math.max(3, canvas.width / 350);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length === 0) return;
    ctx.beginPath();
    if (s.points.length === 1) {
      // Single tap → small dot
      ctx.arc(s.points[0].x, s.points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#E14C2A';
      ctx.fill();
      return;
    }
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imgLoaded) return;
    try {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      const p = getPoint(e);
      currentRef.current = { points: [p] };
      drawingRef.current = true;
      setHasDrawn(true);
    } catch (err) {
      console.error('annot start', err);
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentRef.current) return;
    try {
      const p = getPoint(e);
      const pts = currentRef.current.points;
      pts.push(p);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      applyStrokeStyle(ctx, canvas);
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    } catch (err) {
      console.error('annot move', err);
    }
  };

  const end = () => {
    if (currentRef.current && currentRef.current.points.length > 0) {
      strokesRef.current.push(currentRef.current);
      setStrokeCount(strokesRef.current.length);
    }
    currentRef.current = null;
    drawingRef.current = false;
  };

  const undo = () => {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    fullRedraw();
  };
  const clear = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    fullRedraw();
  };

  const done = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onDone(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="mb-3 flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg"
        style={{ backgroundColor: '#E14C2A' }}
      >
        <Pencil className="w-4 h-4" />
        Teken met je muis of vinger op de afbeelding om aan te wijzen wat je bedoelt
      </div>
      <div
        className="relative rounded-lg overflow-hidden shadow-2xl"
        style={{ outline: '3px dashed #E14C2A', outlineOffset: '4px' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={end}
          className="block bg-white touch-none"
          style={{ cursor: 'crosshair', maxWidth: '100%', maxHeight: '70vh' }}
        />
        {imgLoaded && !hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="px-4 py-2 rounded-full bg-white/90 text-[#1A1B1A] text-sm font-medium shadow flex items-center gap-2">
              <Pencil className="w-4 h-4" style={{ color: '#E14C2A' }} />
              Teken hier
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={undo}
          disabled={strokeCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#1A1B1A] text-sm font-medium hover:bg-[#F0EDE8] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" /> Ongedaan maken
        </button>
        <button
          onClick={clear}
          disabled={strokeCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#1A1B1A] text-sm font-medium hover:bg-[#F0EDE8] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eraser className="w-4 h-4" /> Wissen
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-white text-[#1A1B1A] text-sm font-medium hover:bg-[#F0EDE8] cursor-pointer"
        >
          Annuleren
        </button>
        <button
          onClick={done}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold cursor-pointer"
          style={{ backgroundColor: '#E14C2A' }}
        >
          <Check className="w-4 h-4" /> Klaar
        </button>
      </div>
    </div>
  );
}
