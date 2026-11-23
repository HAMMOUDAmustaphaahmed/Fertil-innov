// Conversation avec le Chef (agent du propriétaire) : modifier le site en langage naturel.
import { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { api } from './data';

export default function ChefChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const load = () => api('/api/admin/chat').then((d) => setMessages(d.messages)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);
  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: '' }]);
    const update = (fn) => setMessages((m) => { const c = [...m]; const l = { ...c[c.length - 1] }; fn(l); c[c.length - 1] = l; return c; });
    try {
      const r = await fetch('/api/admin/chat', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i; while ((i = buf.indexOf('\n\n')) !== -1) {
          const line = buf.slice(0, i).split('\n').find((l) => l.startsWith('data: ')); buf = buf.slice(i + 2);
          if (!line) continue;
          try { const ev = JSON.parse(line.slice(6)); if (ev.type === 'text') update((l) => { l.text += ev.delta; }); else if (ev.type === 'replace') update((l) => { l.text = ev.text; }); else if (ev.type === 'error') update((l) => { l.text = `⚠️ ${ev.message}`; }); } catch { /* */ }
        }
      }
    } catch (e) { update((l) => { l.text = `⚠️ ${e.message}`; }); } finally { setBusy(false); }
  };
  const reset = async () => { if (!confirm('Remettre la conversation à zéro ?')) return; await api('/api/admin/chat', { method: 'DELETE' }); setMessages([]); };
  return (
    <div className="flex h-[72vh] flex-col overflow-hidden rounded-3xl border border-fi-light/80 bg-white">
      <div className="flex items-center justify-between border-b border-fi-light px-5 py-3">
        <p className="font-display font-semibold text-fi-dark">Le Chef</p>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-fi-text/60 hover:text-red-700"><Trash2 size={14} /> Nouvelle conversation</button>
      </div>
      <div ref={scrollRef} data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 bg-fi-bg">
        {!messages.length && <p className="text-sm text-fi-text/60">Exemples : « les demandes de la semaine », « change le slogan en … », « ajoute une formation : … », « mets la palette olive terre », « 130 projets réalisés ». Pour les photos, passez par Telegram.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.from === 'user' ? 'bg-fi-primary text-white' : 'bg-white border border-fi-light text-fi-text'}`}>{m.text || (busy && i === messages.length - 1 ? '…' : '')}</div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-fi-light p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Parlez au Chef…" className="flex-1 rounded-full bg-fi-bg px-4 py-2.5 text-sm outline-none border border-transparent focus:border-fi-primary/40" />
        <button type="submit" disabled={busy || !input.trim()} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-fi-primary text-white disabled:opacity-40"><Send size={16} /></button>
      </form>
    </div>
  );
}
