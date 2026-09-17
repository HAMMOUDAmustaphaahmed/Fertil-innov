// Petit Pois : widget de chat flottant (mascotte conservée du site d'origine).
// Le navigateur n'appelle que /api/session et /api/chat (flux SSE) — aucune clé côté client.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone } from 'lucide-react';
import { useLang } from '../i18n/LangProvider';
import { useSite, useImage } from '../site/SiteProvider';
import { POIS_EVENT } from '../lib/pois';

async function readSse(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      try { onEvent(JSON.parse(line.slice(6))); } catch { /* ligne invalide */ }
    }
  }
}

// Mise en forme légère du markdown de Petit Pois (gras, listes, liens internes).
function Rich({ text }) {
  const lines = String(text || '').split('\n');
  const out = [];
  let list = null;
  const inline = (s, k) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
    return parts.map((pt, i) => {
      if (/^\*\*[^*]+\*\*$/.test(pt)) return <strong key={`${k}-${i}`}>{pt.slice(2, -2)}</strong>;
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(pt);
      if (m) return m[2].startsWith('/') ? <Link key={`${k}-${i}`} to={m[2]} className="underline decoration-fi-accent underline-offset-2">{m[1]}</Link> : <a key={`${k}-${i}`} href={m[2]} target="_blank" rel="noreferrer" className="underline decoration-fi-accent underline-offset-2">{m[1]}</a>;
      return pt;
    });
  };
  lines.forEach((l, i) => {
    const li = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/.exec(l);
    if (li) { if (!list) { list = []; out.push(list); } list.push(<li key={i}>{inline(li[1], i)}</li>); return; }
    list = null;
    if (l.trim()) out.push(<p key={i}>{inline(l, i)}</p>);
  });
  return <div className="space-y-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-0.5">{out.map((o, i) => (Array.isArray(o) ? <ul key={i}>{o}</ul> : o))}</div>;
}

function Ticket({ ticket, t }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-fi-primary/40 bg-fi-mint/60 px-3 py-2.5 font-mono text-[0.7rem] text-fi-deep">
      <div className="flex justify-between font-semibold tracking-wider mb-1"><span>{ticket.type_label}</span><span>{ticket.numero}</span></div>
      {ticket.service && <p>· {ticket.service}</p>}
      {ticket.details?.localisation && <p>· {ticket.details.localisation}{ticket.details.surface_ha ? ` — ${ticket.details.surface_ha} ha` : ''}</p>}
      <p className="mt-1 text-fi-primary">{t('contact_devis_24h')}</p>
    </div>
  );
}

export default function Chatbot() {
  const { t, p, lang } = useLang();
  const site = useSite();
  const img = useImage();
  const WELCOME = { from: 'bot', text: t('pois_accueil') };
  const QUICK = [t('pois_quick_1'), t('pois_quick_2'), t('pois_quick_3'), t('pois_quick_4')];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [tease, setTease] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const sessionLoaded = useRef(false);
  const pendingRef = useRef(null);
  const sendRef = useRef(null);
  const contactCta = () => ({ label: t('pois_contact_cta'), to: p('/contact'), state: { subject: 'info' } });

  useEffect(() => {
    const onCmd = (e) => {
      const { type, message, text } = e.detail || {};
      if (type === 'open') { setTease(null); setOpen(true); if (message) pendingRef.current = message; }
      else if (type === 'tease' && !open) setTease(text);
    };
    window.addEventListener(POIS_EVENT, onCmd);
    return () => window.removeEventListener(POIS_EVENT, onCmd);
  }, [open]);

  useEffect(() => {
    if (!tease) return undefined;
    const id = setTimeout(() => setTease(null), 9000);
    return () => clearTimeout(id);
  }, [tease]);

  // Invitation discrète après 12 s sur la page (une fois par session).
  useEffect(() => {
    let shown = false;
    try { shown = !!sessionStorage.getItem('fi-pois-tease'); } catch { shown = true; }
    if (shown) return undefined;
    const id = setTimeout(() => { if (!open) { setTease(t('pois_bulle')); try { sessionStorage.setItem('fi-pois-tease', '1'); } catch { /* */ } } }, 12000);
    return () => clearTimeout(id);
  }, [open, t]);

  useEffect(() => {
    if (!open || sessionLoaded.current) return;
    sessionLoaded.current = true;
    setLoading(true);
    fetch('/api/session', { credentials: 'same-origin' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) { setBlocked(data.error || t('pois_indispo')); setMessages([WELCOME]); return; }
        setRemaining(data.remaining);
        const restored = data.messages.length ? data.messages : [WELCOME];
        setMessages(data.remaining === 0 ? [...restored, { from: 'bot', text: t('pois_limite'), cta: contactCta() }] : restored);
        if (data.status === 'blocked') setBlocked(t('pois_indispo'));
      })
      .catch(() => { setBlocked(t('pois_indispo')); setMessages([WELCOME]); })
      .finally(() => {
        setLoading(false);
        if (pendingRef.current) { const m = pendingRef.current; pendingRef.current = null; setTimeout(() => sendRef.current?.(m), 50); }
      });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 250); }, [open]);

  const send = async (raw) => {
    const text = String(raw ?? input).trim();
    if (!text || busy || blocked) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: '', streaming: true }]);
    const update = (fn) => setMessages((m) => { const copy = [...m]; const last = { ...copy[copy.length - 1] }; fn(last); copy[copy.length - 1] = last; return copy; });
    try {
      const r = await fetch('/api/chat', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text, lang }) });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        update((l) => { l.streaming = false; l.text = data.error || t('pois_indispo'); if (['limit_reached', 'ip_limit', 'blocked', 'budget', 'too_many_sessions'].includes(data.code)) { l.cta = contactCta(); } });
        if (data.code === 'limit_reached') setRemaining(0);
        if (['blocked', 'ip_limit', 'too_many_sessions'].includes(data.code)) setBlocked(data.error);
        return;
      }
      await readSse(r, (ev) => {
        if (ev.type === 'text') update((l) => { l.text += ev.delta; });
        else if (ev.type === 'replace') update((l) => { l.text = ev.text; });
        else if (ev.type === 'cta') update((l) => { l.cta = ev.cta; });
        else if (ev.type === 'ticket') update((l) => { l.ticket = ev.ticket; });
        else if (ev.type === 'done') { update((l) => { l.streaming = false; }); setRemaining(ev.remaining); if (ev.blocked) setBlocked(t('pois_indispo')); if (ev.remaining === 0) setMessages((m) => [...m, { from: 'bot', text: t('pois_limite'), cta: contactCta() }]); }
        else if (ev.type === 'error') { update((l) => { l.streaming = false; l.text = ev.message; }); if (typeof ev.remaining === 'number') setRemaining(ev.remaining); }
      });
      // Flux terminé sans événement « done » (fonction interrompue) : on referme proprement la bulle.
      update((l) => { if (l.streaming) { l.streaming = false; if (!l.text) l.text = t('pois_indispo'); } });
    } catch {
      update((l) => { l.streaming = false; l.text = t('pois_indispo'); });
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };
  sendRef.current = send;

  const showQuick = messages.length <= 1 && !busy && !blocked;
  const e = site.entreprise;

  return (
    <div id="petit-pois" className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 print:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <AnimatePresence>
        {open && (
          <motion.section key="panel" role="dialog" aria-label={t('pois_nom')} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent className="w-[calc(100vw-2rem)] sm:w-[400px] h-[min(78vh,640px)] flex flex-col overflow-hidden rounded-3xl bg-white shadow-leaf border border-fi-light">
            <header className="flex items-center gap-3 bg-fi-deep text-white px-4 py-3 grain">
              <img {...img('petit_pois')} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold leading-tight">{t('pois_nom')} <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">IA</span></p>
                <p className="text-xs text-white/70 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fi-accent" aria-hidden />{t('pois_role')}{typeof remaining === 'number' && <span className="text-white/50">· {remaining} {t('pois_reste')}</span>}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-fi-bg" role="log" aria-live="polite">
              {loading && <p className="text-sm text-fi-text/60">…</p>}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : ''}`}>
                  {m.from === 'bot' && <img {...img('petit_pois')} alt="" width={28} height={28} className="h-7 w-7 object-contain shrink-0 mt-1" />}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed ${m.from === 'user' ? 'bg-fi-primary text-white rounded-br-md' : 'bg-white border border-fi-light text-fi-text rounded-bl-md'}`}>
                    {m.from === 'bot' ? <Rich text={m.text} /> : <p className="whitespace-pre-wrap">{m.text}</p>}
                    {m.streaming && !m.text && <span className="inline-flex gap-1 py-1"><span className="typing-dot h-1.5 w-1.5 rounded-full bg-fi-primary" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-fi-primary" /><span className="typing-dot h-1.5 w-1.5 rounded-full bg-fi-primary" /></span>}
                    {m.ticket && <Ticket ticket={m.ticket} t={t} />}
                    {m.cta && <Link to={m.cta.to} state={m.cta.state} onClick={() => setOpen(false)} className="mt-3 btn-primary !py-2 !px-4 text-sm w-full">{m.cta.label}</Link>}
                  </div>
                </div>
              ))}
              {showQuick && (
                <div className="flex flex-wrap gap-2 pt-1" role="group">
                  {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-fi-primary/30 bg-white px-3 py-1.5 text-xs font-medium text-fi-dark hover:bg-fi-mint transition-colors min-h-[36px]">{q}</button>)}
                </div>
              )}
              {blocked && (
                <p className="text-xs text-fi-text/70 bg-fi-mint rounded-xl px-3 py-2">{blocked} <a href={`tel:${e.telephone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 font-semibold text-fi-primary"><Phone size={12} /> {e.telephone}</a></p>
              )}
            </div>

            <form onSubmit={(ev) => { ev.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-fi-light bg-white px-3 py-2.5">
              <input ref={inputRef} value={input} onChange={(ev) => setInput(ev.target.value)} maxLength={500} placeholder={t('pois_placeholder')} aria-label={t('pois_placeholder')} disabled={!!blocked || remaining === 0}
                className="flex-1 min-w-0 rounded-full bg-fi-bg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-fi-primary/40 disabled:opacity-60" />
              <button type="submit" disabled={busy || !input.trim() || !!blocked} aria-label="Envoyer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fi-primary text-white hover:bg-fi-dark disabled:opacity-40 transition-colors"><Send size={16} /></button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="relative flex items-end gap-2">
        <AnimatePresence>
          {tease && !open && (
            <motion.button type="button" key="tease" onClick={() => { setTease(null); setOpen(true); }} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="max-w-[220px] rounded-2xl rounded-br-md bg-white px-3.5 py-2.5 text-sm text-fi-text shadow-leaf border border-fi-light text-left">
              {tease}
            </motion.button>
          )}
        </AnimatePresence>
        <button type="button" onClick={() => { setOpen((o) => !o); setTease(null); }} aria-label={t('pois_ouvrir')} aria-expanded={open}
          className="relative h-16 w-16 rounded-full bg-white shadow-leaf border-2 border-fi-accent/60 hover:border-fi-primary transition-colors overflow-hidden">
          <img {...img('petit_pois')} alt="" width={64} height={64} className={`h-full w-full object-contain p-1 ${open ? '' : 'float'}`} />
          {!open && <span aria-hidden className="absolute -inset-1 rounded-full border-2 border-fi-accent/50 animate-ping [animation-duration:2.4s]" />}
        </button>
      </div>
    </div>
  );
}
