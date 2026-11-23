// Connexion à l'espace de pilotage — page claire et animée.
// Décor : halos de couleur qui dérivent et suivent le pointeur, lignes de courant tracées en continu (canvas),
// carte blanche à bordure lumineuse qui s'incline sous le pointeur, emblème dont l'anneau avance à chaque étape,
// pluie de confettis quand la connexion réussit.
// La page ne dit volontairement rien de la façon dont l'accès est protégé : un inconnu qui tombe dessus n'apprend rien.
//   étape 1  identifiant + mot de passe
//   étape 2  code de vérification à 8 caractères (5 minutes)
//   création lien « #acces=… » : choix de l'identifiant et du mot de passe
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, ArrowLeft, KeyRound, Check, Fingerprint } from 'lucide-react';
import { api } from './data';
import { prefersLessMotion } from '../lib/gsap';

const CSS = `
@property --lg-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes lg-spin { to { --lg-a: 360deg } }
@keyframes lg-drift1 { 0%,100% { transform: translate3d(0,0,0) scale(1) } 50% { transform: translate3d(9vw,7vh,0) scale(1.18) } }
@keyframes lg-drift2 { 0%,100% { transform: translate3d(0,0,0) scale(1.1) } 50% { transform: translate3d(-8vw,-9vh,0) scale(.92) } }
@keyframes lg-drift3 { 0%,100% { transform: translate3d(0,0,0) scale(.95) } 50% { transform: translate3d(6vw,-10vh,0) scale(1.15) } }
@keyframes lg-in { from { opacity:0; transform: translateY(18px) scale(.98) } to { opacity:1; transform:none } }
@keyframes lg-word { from { opacity:0; transform: translateY(.6em) rotate(4deg); filter: blur(6px) } to { opacity:1; transform:none; filter:none } }
@keyframes lg-shake { 10%,90% { transform: translateX(-2px) } 20%,80% { transform: translateX(4px) } 30%,50%,70% { transform: translateX(-7px) } 40%,60% { transform: translateX(7px) } }
@keyframes lg-shine { 0% { transform: translateX(-130%) skewX(-20deg) } 60%,100% { transform: translateX(230%) skewX(-20deg) } }
@keyframes lg-hue { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }
@keyframes lg-pop { 0% { transform: scale(.4); opacity:0 } 60% { transform: scale(1.15); opacity:1 } 100% { transform: scale(1) } }
@keyframes lg-ring { from { stroke-dashoffset: var(--from) } to { stroke-dashoffset: var(--to) } }
@keyframes lg-float { 0%,100% { transform: translateY(0) rotate(0) } 50% { transform: translateY(-10px) rotate(4deg) } }
@keyframes lg-fall { 0% { transform: translate3d(0,-10vh,0) rotate(0); opacity:0 } 10% { opacity:1 } 100% { transform: translate3d(var(--dx),110vh,0) rotate(var(--rot)); opacity:.9 } }
.lg-orb { position:absolute; border-radius:9999px; filter: blur(70px); opacity:.75; will-change: transform; }
.lg-card { animation: lg-in .8s cubic-bezier(.16,1,.3,1) both; }
.lg-frame { background: conic-gradient(from var(--lg-a), #9ee37d, #6cc9f2, #ffc98a, #c9a7ff, #9ee37d); animation: lg-spin 7s linear infinite; }
.lg-step { animation: lg-in .5s cubic-bezier(.16,1,.3,1) both; }
.lg-word { display:inline-block; animation: lg-word .9s cubic-bezier(.16,1,.3,1) both; }
.lg-grad { background: linear-gradient(100deg,#19a39a,#58b947,#f29f3d,#19a39a); background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: lg-word .9s cubic-bezier(.16,1,.3,1) both, lg-hue 9s ease-in-out infinite; }
.lg-shake { animation: lg-shake .5s both; }
.lg-btn { background: linear-gradient(100deg,#19a39a,#3fb36b,#8fcf4d); background-size: 200% 100%; transition: background-position .5s, transform .15s, box-shadow .3s; }
.lg-btn:hover { background-position: 100% 0; box-shadow: 0 16px 34px -14px rgba(25,163,154,.75); }
.lg-btn::after { content:''; position:absolute; inset:0; width:40%; background: linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent); animation: lg-shine 3.4s ease-in-out infinite; }
.lg-chip { animation: lg-float 7s ease-in-out infinite; }
.lg-pop { animation: lg-pop .6s cubic-bezier(.2,1.4,.4,1) both; }
.lg-confetti { position:absolute; top:0; width:10px; height:14px; border-radius:3px; animation: lg-fall linear forwards; }
@media (prefers-reduced-motion: reduce) { .lg-orb, .lg-frame, .lg-chip, .lg-btn::after { animation: none !important } }
`;

/** Lignes de courant : des points suivent un champ de directions et laissent une trace fine qui s'efface. */
function Flow() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const COLORS = ['#19a39a', '#58b947', '#6cc9f2', '#f29f3d', '#b08cf0'];
    let w = 0; let h = 0; let raf = 0; let t = 0; let visible = true;
    const mk = () => ({ x: Math.random() * w, y: Math.random() * h, c: COLORS[(Math.random() * COLORS.length) | 0], life: 60 + Math.random() * 240, s: 0.6 + Math.random() * 1.1 });
    let pts = [];
    const size = () => { w = cv.clientWidth * dpr; h = cv.clientHeight * dpr; cv.width = w; cv.height = h; pts = Array.from({ length: Math.round(Math.min(170, (w * h) / (dpr * dpr) / 9000)) }, mk); };
    const step = () => {
      // efface très légèrement l'image précédente : les traces s'estompent, le fond reste transparent
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.035)'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 1.1 * dpr; ctx.lineCap = 'round';
      t += 0.0016;
      for (const p of pts) {
        const nx = p.x / w; const ny = p.y / h;
        const a = Math.sin(nx * 5.2 + t * 3) * 1.4 + Math.cos(ny * 4.3 - t * 2.2) * 1.6 + Math.sin((nx + ny) * 3.1 + t) * 0.9;
        const x2 = p.x + Math.cos(a) * 1.5 * p.s * dpr; const y2 = p.y + Math.sin(a) * 1.5 * p.s * dpr;
        ctx.strokeStyle = p.c; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x2, y2); ctx.stroke();
        p.x = x2; p.y = y2; p.life -= 1;
        if (p.life < 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) Object.assign(p, mk());
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => { step(); raf = visible ? requestAnimationFrame(loop) : 0; };
    const still = () => { ctx.clearRect(0, 0, w, h); for (let i = 0; i < 160; i++) step(); }; // image fixe si « moins d'animations »
    size();
    const ro = new ResizeObserver(() => { size(); if (prefersLessMotion()) still(); }); ro.observe(cv);
    const onVis = () => { visible = !document.hidden; if (visible && !raf && !prefersLessMotion()) raf = requestAnimationFrame(loop); };
    document.addEventListener('visibilitychange', onVis);
    if (prefersLessMotion()) still(); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full opacity-70" />;
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ left: `${Math.random() * 100}%`, bg: ['#19a39a', '#8fcf4d', '#6cc9f2', '#ffc98a', '#c9a7ff', '#ff9bb0'][i % 6], dur: `${1.6 + Math.random() * 1.6}s`, delay: `${Math.random() * 0.5}s`, dx: `${(Math.random() - 0.5) * 30}vw`, rot: `${(Math.random() - 0.5) * 900}deg` })), []);
  return <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">{bits.map((b, i) => <span key={i} className="lg-confetti" style={{ left: b.left, background: b.bg, animationDuration: b.dur, animationDelay: b.delay, '--dx': b.dx, '--rot': b.rot }} />)}</div>;
}

/** Emblème : un anneau qui se remplit à chaque étape, l'icône change avec l'étape. */
function Emblem({ index, icon: Icon }) {
  const C = 2 * Math.PI * 26;
  const prev = useRef(index);
  const from = C * (1 - prev.current / 3); const to = C * (1 - index / 3);
  useEffect(() => { prev.current = index; }, [index]);
  return (
    <span className="relative flex h-16 w-16 items-center justify-center">
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs><linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#19a39a" /><stop offset=".5" stopColor="#8fcf4d" /><stop offset="1" stopColor="#f29f3d" /></linearGradient></defs>
        <circle cx="32" cy="32" r="26" fill="none" stroke="#e8eef0" strokeWidth="5" />
        <circle key={index} cx="32" cy="32" r="26" fill="none" stroke="url(#lg-ring)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={to} style={{ '--from': from, '--to': to, animation: 'lg-ring .9s cubic-bezier(.2,.8,.2,1) both' }} />
      </svg>
      <span key={`i${index}`} className="lg-pop flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#19a39a] to-[#8fcf4d] text-white shadow-[0_8px_18px_-8px_rgba(25,163,154,.9)]"><Icon size={19} aria-hidden /></span>
    </span>
  );
}

const field = 'peer w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-11 text-[0.95rem] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#19a39a] focus:bg-white focus:shadow-[0_0_0_4px_rgba(25,163,154,.14)]';
const ico = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition peer-focus:text-[#19a39a]';

function strength(p) {
  let s = 0;
  if (p.length >= 12) s += 1; if (p.length >= 16) s += 1; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1; if (/\d/.test(p)) s += 1; if (/[^A-Za-z0-9]/.test(p)) s += 1;
  return Math.min(4, p.length < 12 ? Math.min(1, s) : s);
}

/** Les 8 cases du code (4 + 4) : saisie continue, collage, retour arrière. */
function CodeBoxes({ value, onChange, disabled, shake }) {
  const refs = useRef([]);
  const chars = value.padEnd(8, ' ').slice(0, 8).split('');
  const set = (i, raw) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return;
    const next = (value.slice(0, i) + clean + value.slice(i + clean.length)).slice(0, 8);
    onChange(next);
    refs.current[Math.min(7, i + clean.length)]?.focus();
  };
  const key = (i, e) => {
    if (e.key === 'Backspace') { e.preventDefault(); const at = value[i] ? i : Math.max(0, i - 1); onChange(value.slice(0, at)); refs.current[at]?.focus(); }
    else if (e.key === 'ArrowLeft') refs.current[Math.max(0, i - 1)]?.focus();
    else if (e.key === 'ArrowRight') refs.current[Math.min(7, i + 1)]?.focus();
  };
  useEffect(() => { refs.current[0]?.focus(); }, []);
  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2 ${shake ? 'lg-shake' : ''}`} onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); onChange(t); refs.current[Math.min(7, t.length)]?.focus(); }}>
      {chars.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5 sm:gap-2">
          {i === 4 && <span className="text-slate-300" aria-hidden>–</span>}
          <input ref={(el) => { refs.current[i] = el; }} value={c.trim()} disabled={disabled} inputMode="text" autoCapitalize="characters" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={8} aria-label={`Caractère ${i + 1} du code`}
            onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => key(i, e)} onFocus={(e) => e.target.select()}
            className={`h-12 w-9 rounded-xl border-2 bg-white text-center font-mono text-xl font-semibold text-slate-800 outline-none transition sm:h-14 sm:w-11 ${c.trim() ? 'border-[#19a39a] shadow-[0_6px_14px_-8px_rgba(25,163,154,.8)] -translate-y-0.5' : 'border-slate-200'} focus:border-[#19a39a] focus:shadow-[0_0_0_4px_rgba(25,163,154,.14)]`} />
        </span>
      ))}
    </div>
  );
}

function Countdown({ until, total, onEnd }) {
  const [left, setLeft] = useState(Math.max(0, until - Date.now()));
  useEffect(() => { const id = setInterval(() => { const l = Math.max(0, until - Date.now()); setLeft(l); if (!l) { clearInterval(id); onEnd(); } }, 500); return () => clearInterval(id); }, [until]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = Math.ceil(left / 1000); const frac = left / total;
  return (
    <div className="mx-auto max-w-[260px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full transition-[width] duration-500 ease-linear" style={{ width: `${frac * 100}%`, background: frac < 0.2 ? '#f29f3d' : 'linear-gradient(90deg,#19a39a,#8fcf4d)' }} /></div>
      <p className="mt-2 text-sm text-slate-500">Valable encore <strong className="tabular-nums text-slate-800">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</strong></p>
    </div>
  );
}

export default function Login({ onOk }) {
  // Lien de création d'identifiants : le jeton est après « # », il n'est donc jamais envoyé au serveur dans l'adresse.
  const setupToken = useMemo(() => { const m = /acces=([A-Za-z0-9_-]+)/.exec(window.location.hash || ''); return m ? m[1] : ''; }, []);
  const [step, setStep] = useState(setupToken ? 'setup' : 'password'); // password | code | setup | ok
  const [login, setLogin] = useState(''); const [pwd, setPwd] = useState(''); const [pwd2, setPwd2] = useState('');
  const [show, setShow] = useState(false);
  const [code, setCode] = useState(''); const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(null); const [note, setNote] = useState(null); const [shake, setShake] = useState(false);
  const [setupInfo, setSetupInfo] = useState(null);
  const root = useRef(null); const card = useRef(null);

  useEffect(() => {
    if (!setupToken) return;
    window.history.replaceState(null, '', window.location.pathname); // le jeton ne reste pas dans la barre d'adresse ni l'historique
    api('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'setup-info', token: setupToken }) })
      .then((d) => { setSetupInfo(d); setLogin(d.login || ''); })
      .catch((e) => { setErr(e.message); setStep('password'); });
  }, [setupToken]);

  // Le décor suit le pointeur : les halos se décalent, la carte s'incline légèrement.
  useEffect(() => {
    if (prefersLessMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    let raf = 0; let ev = null;
    const apply = () => {
      raf = 0; if (!root.current || !ev) return;
      const x = ev.clientX / window.innerWidth - 0.5; const y = ev.clientY / window.innerHeight - 0.5;
      root.current.style.setProperty('--mx', x.toFixed(3)); root.current.style.setProperty('--my', y.toFixed(3));
      if (card.current) card.current.style.transform = `perspective(1100px) rotateY(${(x * 5).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
    };
    const move = (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  const fail = (m) => { setErr(m); setShake(true); setTimeout(() => setShake(false), 550); };

  const submitPassword = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr(null); setNote(null);
    try {
      const d = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'password', login, password: pwd }) });
      setChallenge({ id: d.challenge, until: Date.now() + d.expiresIn * 1000, total: d.expiresIn * 1000 }); setCode(''); setPwd(''); setStep('code');
    } catch (e2) { fail(e2.message); } finally { setBusy(false); }
  };

  const submitCode = async (value) => {
    if (busy || value.length !== 8) return;
    setBusy(true); setErr(null);
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'code', challenge: challenge.id, code: value }) });
      setStep('ok'); setTimeout(onOk, prefersLessMotion() ? 300 : 1700);
    } catch (e2) { setCode(''); fail(e2.message); if (e2.data?.expired) { setStep('password'); setChallenge(null); } } finally { setBusy(false); }
  };
  useEffect(() => { if (step === 'code' && code.length === 8) submitCode(code); }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitSetup = async (e) => {
    e.preventDefault(); if (busy) return undefined;
    if (pwd !== pwd2) return fail('Les deux mots de passe ne sont pas identiques.');
    setBusy(true); setErr(null);
    try {
      const d = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ action: 'setup', token: setupToken, login, password: pwd }) });
      setLogin(d.login); setPwd(''); setPwd2(''); setNote('Identifiants enregistrés. Vous pouvez vous connecter.'); setStep('password');
    } catch (e2) { fail(e2.message); } finally { setBusy(false); }
    return undefined;
  };

  const st = strength(pwd);
  const index = step === 'ok' ? 3 : step === 'code' ? 2 : 1;
  const EmblemIcon = step === 'ok' ? Check : step === 'code' ? Fingerprint : step === 'setup' ? KeyRound : Lock;
  const eye = (
    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
  );
  const submitCls = 'lg-btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 font-semibold text-white active:scale-[.98] disabled:opacity-60';
  const words = ['Le', 'poste', 'de', 'pilotage'];

  return (
    <div ref={root} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f9fb] px-4 py-10 text-slate-800" style={{ '--mx': 0, '--my': 0 }}>
      <style>{CSS}</style>
      {/* halos de couleur : dérivent seuls, et se décalent avec le pointeur */}
      <div aria-hidden className="absolute inset-0" style={{ transform: 'translate3d(calc(var(--mx) * -40px), calc(var(--my) * -40px), 0)', transition: 'transform .6s cubic-bezier(.2,.8,.2,1)' }}>
        <span className="lg-orb" style={{ width: '46vw', height: '46vw', left: '-10vw', top: '-12vw', background: '#b9f0a3', animation: 'lg-drift1 19s ease-in-out infinite' }} />
        <span className="lg-orb" style={{ width: '42vw', height: '42vw', right: '-8vw', top: '8vh', background: '#a9defa', animation: 'lg-drift2 23s ease-in-out infinite' }} />
        <span className="lg-orb" style={{ width: '40vw', height: '40vw', left: '22vw', bottom: '-18vw', background: '#ffdcae', animation: 'lg-drift3 21s ease-in-out infinite' }} />
        <span className="lg-orb" style={{ width: '26vw', height: '26vw', right: '14vw', bottom: '-6vw', background: '#dccbff', animation: 'lg-drift1 26s ease-in-out infinite reverse' }} />
      </div>
      <Flow />
      {step === 'ok' && <Confetti />}

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden lg:block">
          <h1 className="font-display text-[clamp(2.6rem,4.8vw,4rem)] font-semibold leading-[1.02] tracking-tight !text-slate-900">
            {words.map((w, i) => <span key={w} className="lg-word mr-[.28em]" style={{ animationDelay: `${0.15 + i * 0.09}s` }}>{w}</span>)}<br />
            <span className="lg-grad inline-block" style={{ animationDelay: '.6s, 0s' }}>de vos sols vivants</span>
          </h1>
          <div className="mt-10 flex gap-3" aria-hidden>
            {[['#19a39a', 0], ['#8fcf4d', 1.2], ['#f29f3d', 2.4], ['#6cc9f2', 3.6]].map(([c, d]) => <span key={c} className="lg-chip h-3 w-12 rounded-full" style={{ background: c, animationDelay: `-${d}s` }} />)}
          </div>
        </div>

        <div ref={card} className="lg-card relative will-change-transform" style={{ transition: 'transform .35s cubic-bezier(.2,.8,.2,1)' }}>
          {/* bordure lumineuse qui tourne */}
          <div aria-hidden className="lg-frame absolute -inset-[2px] rounded-[2.1rem] opacity-80 blur-[1px]" />
          <div className={`relative rounded-[2rem] bg-white/90 p-6 shadow-[0_40px_90px_-40px_rgba(30,80,110,.55)] backdrop-blur-xl sm:p-9 ${shake && step !== 'code' ? 'lg-shake' : ''}`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Emblem index={index} icon={EmblemIcon} />
              <p className="text-right font-display text-lg font-semibold leading-tight text-slate-800">Espace propriétaire</p>
            </div>

            {step === 'password' && (
              <form key="password" onSubmit={submitPassword} className="lg-step space-y-4">
                <div><h2 className="font-display text-[1.7rem] font-semibold !text-slate-900">Connexion</h2><p className="mt-1 text-sm text-slate-500">Entrez vos identifiants.</p></div>
                {note && <p className="rounded-xl border border-[#19a39a]/30 bg-[#19a39a]/10 px-3.5 py-2.5 text-sm text-[#0e6e68]" role="status">{note}</p>}
                <label className="relative block"><span className="sr-only">Identifiant</span>
                  <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Identifiant" required className={field} /><User size={17} className={ico} aria-hidden /></label>
                <label className="relative block"><span className="sr-only">Mot de passe</span>
                  <input type={show ? 'text' : 'password'} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" placeholder="Mot de passe" required className={field} /><Lock size={17} className={ico} aria-hidden />{eye}</label>
                {err && <p className="text-sm text-rose-600" role="alert">{err}</p>}
                <button disabled={busy} className={submitCls}><LogIn size={16} aria-hidden /> {busy ? 'Vérification…' : 'Se connecter'}</button>
              </form>
            )}

            {step === 'code' && challenge && (
              <div key="code" className="lg-step space-y-5 text-center">
                <div><h2 className="font-display text-[1.7rem] font-semibold !text-slate-900">Code de vérification</h2><p className="mt-1 text-sm text-slate-500">Saisissez ou collez votre code à 8 caractères.</p></div>
                <CodeBoxes value={code} onChange={setCode} disabled={busy} shake={shake} />
                <Countdown until={challenge.until} total={challenge.total} onEnd={() => { setErr('Le code a expiré. Recommencez la connexion.'); setStep('password'); setChallenge(null); }} />
                {err && <p className="text-sm text-rose-600" role="alert">{err}</p>}
                <button type="button" onClick={() => { setStep('password'); setChallenge(null); setErr(null); }} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} aria-hidden /> Recommencer</button>
              </div>
            )}

            {step === 'setup' && (
              <form key="setup" onSubmit={submitSetup} className="lg-step space-y-4">
                <div><h2 className="font-display text-[1.7rem] font-semibold !text-slate-900">{setupInfo?.exists ? 'Modifier mes identifiants' : 'Créer mes identifiants'}</h2><p className="mt-1 text-sm text-slate-500">Choisissez un identifiant et un mot de passe d’au moins 12 caractères.</p></div>
                <label className="relative block"><span className="sr-only">Identifiant</span>
                  <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Identifiant (ex. votre e-mail)" required className={field} /><User size={17} className={ico} aria-hidden /></label>
                <label className="relative block"><span className="sr-only">Nouveau mot de passe</span>
                  <input type={show ? 'text' : 'password'} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" placeholder="Mot de passe" required minLength={12} className={field} /><Lock size={17} className={ico} aria-hidden />{eye}</label>
                <div aria-hidden className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < st ? (st <= 1 ? 'bg-rose-400' : st === 2 ? 'bg-amber-400' : 'bg-[#19a39a]') : 'bg-slate-200'}`} />)}</div>
                <p className="text-xs text-slate-500">{pwd.length < 12 ? `Encore ${12 - pwd.length} caractère${12 - pwd.length > 1 ? 's' : ''}.` : st >= 3 ? 'Mot de passe solide.' : 'Correct. Une phrase plus longue le rendrait plus solide.'}</p>
                <label className="relative block"><span className="sr-only">Confirmer le mot de passe</span>
                  <input type={show ? 'text' : 'password'} value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" placeholder="Confirmer le mot de passe" required className={field} /><Lock size={17} className={ico} aria-hidden /></label>
                {err && <p className="text-sm text-rose-600" role="alert">{err}</p>}
                <button disabled={busy || !setupInfo} className={submitCls}><KeyRound size={16} aria-hidden /> {busy ? 'Enregistrement…' : 'Enregistrer mes identifiants'}</button>
              </form>
            )}

            {step === 'ok' && (
              <div key="ok" className="lg-step py-8 text-center" role="status">
                <h2 className="font-display text-[1.9rem] font-semibold !text-slate-900">Bienvenue</h2>
                <p className="mt-2 text-sm text-slate-500">Ouverture de votre espace…</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
