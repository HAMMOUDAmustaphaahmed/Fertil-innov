// Graphiques du tableau de bord (SVG, sans bibliothèque).
// Règles suivies : un seul axe par graphique, marques fines à bout arrondi, grille discrète, légende dès deux séries,
// texte toujours en encre neutre (jamais dans la couleur de la série), infobulle au survol / au toucher, et un
// tableau équivalent accessible aux lecteurs d'écran.
import { useEffect, useRef, useState } from 'react';
import { fmtInt } from './data';

const INK = '#263238'; const MUTED = '#6b7a80'; const GRID = '#e3ebe4'; const SURFACE = '#ffffff';
export const BRAND = '#2e7d32';

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Graduations « rondes » pour un axe partant de zéro. */
function ticks(max, n = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / n; const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) || 10 * pow;
  const out = []; for (let v = 0; v <= max + step * 0.999; v += step) out.push(Math.round(v * 100) / 100);
  return out.filter((v) => Number.isInteger(v) || step < 1);
}

function Tip({ tip, width }) {
  if (!tip) return null;
  const left = Math.min(Math.max(tip.x, 90), width - 90);
  return (
    <div role="status" className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-fi-light bg-white px-3 py-2 text-xs shadow-lg" style={{ left, top: Math.max(tip.y - 8, 46), minWidth: 130 }}>
      <p className="mb-1 font-semibold text-fi-text">{tip.title}</p>
      {tip.rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 text-fi-text/80">
          <span className="flex items-center gap-1.5">{r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}{r.label}</span>
          <span className="font-semibold tabular-nums text-fi-text">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ series }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fi-text/80">
      {series.map((s) => <li key={s.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />{s.label}{s.value !== undefined && <span className="tabular-nums text-fi-text/55">{fmtInt(s.value)}</span>}</li>)}
    </ul>
  );
}

function SrTable({ caption, head, rows }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

/** Colonnes empilées : une colonne par période, un segment par série. */
export function StackedColumns({ periods, series, height = 240, caption }) {
  const [ref, w] = useWidth();
  const [tip, setTip] = useState(null);
  const pad = { l: 34, r: 8, t: 10, b: 26 };
  const iw = w - pad.l - pad.r; const ih = height - pad.t - pad.b;
  const max = Math.max(1, ...periods.map((p) => series.reduce((n, s) => n + (p[s.id] || 0), 0)));
  const ts = ticks(max); const top = ts[ts.length - 1] || 1;
  const band = iw / Math.max(1, periods.length); const bw = Math.max(3, Math.min(34, band * 0.62));
  const y = (v) => pad.t + ih - (v / top) * ih;
  const every = Math.max(1, Math.ceil(periods.length / Math.max(2, Math.floor(iw / 62))));
  return (
    <div ref={ref} className="relative">
      <svg width={w} height={height} role="img" aria-label={caption} onMouseLeave={() => setTip(null)}>
        {ts.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill={MUTED}>{fmtInt(t)}</text>
          </g>
        ))}
        {periods.map((p, i) => {
          const cx = pad.l + band * i + band / 2;
          let acc = 0;
          const segs = series.filter((s) => p[s.id] > 0);
          return (
            <g key={p.key}>
              {segs.map((s, k) => {
                const y0 = y(acc); acc += p[s.id]; const y1 = y(acc);
                const h = Math.max(1, y0 - y1 - (k < segs.length - 1 ? 2 : 0)); // 2 px de surface entre deux segments
                const last = k === segs.length - 1;
                return last
                  ? <path key={s.id} d={`M${cx - bw / 2},${y1 + h} V${y1 + Math.min(4, h)} Q${cx - bw / 2},${y1} ${cx - bw / 2 + Math.min(4, bw / 2)},${y1} H${cx + bw / 2 - Math.min(4, bw / 2)} Q${cx + bw / 2},${y1} ${cx + bw / 2},${y1 + Math.min(4, h)} V${y1 + h} Z`} fill={s.color} />
                  : <rect key={s.id} x={cx - bw / 2} y={y1 + 2} width={bw} height={h} fill={s.color} />;
              })}
              {i % every === 0 && <text x={cx} y={height - 8} textAnchor="middle" fontSize="10.5" fill={MUTED}>{p.short}</text>}
              {/* zone de survol plus large que la colonne */}
              <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent"
                onMouseEnter={() => setTip({ x: cx, y: y(acc), title: p.label, rows: [...series.map((s) => ({ label: s.label, color: s.color, value: fmtInt(p[s.id] || 0) })), { label: 'Total', value: fmtInt(acc) }] })}
                onClick={() => setTip({ x: cx, y: y(acc), title: p.label, rows: [...series.map((s) => ({ label: s.label, color: s.color, value: fmtInt(p[s.id] || 0) })), { label: 'Total', value: fmtInt(acc) }] })} />
            </g>
          );
        })}
        <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} stroke="#c9d6cb" strokeWidth="1" />
      </svg>
      <Tip tip={tip} width={w} />
      <SrTable caption={caption} head={['Période', ...series.map((s) => s.label)]} rows={periods.map((p) => [p.label, ...series.map((s) => p[s.id] || 0)])} />
    </div>
  );
}

/** Courbe d'une seule mesure dans le temps (pas de légende : le titre du bloc la nomme). */
export function LineChart({ periods, field, label, color = BRAND, height = 200, caption }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 34, r: 12, t: 12, b: 26 };
  const iw = w - pad.l - pad.r; const ih = height - pad.t - pad.b;
  const max = Math.max(1, ...periods.map((p) => p[field] || 0));
  const ts = ticks(max); const top = ts[ts.length - 1] || 1;
  const x = (i) => pad.l + (periods.length <= 1 ? iw / 2 : (iw * i) / (periods.length - 1));
  const y = (v) => pad.t + ih - (v / top) * ih;
  const pts = periods.map((p, i) => [x(i), y(p[field] || 0)]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const every = Math.max(1, Math.ceil(periods.length / Math.max(2, Math.floor(iw / 62))));
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const i = Math.max(0, Math.min(periods.length - 1, Math.round(((px - pad.l) / Math.max(1, iw)) * (periods.length - 1))));
    setHover(i);
  };
  const h = hover !== null ? periods[hover] : null;
  return (
    <div ref={ref} className="relative">
      <svg width={w} height={height} role="img" aria-label={caption} onMouseMove={move} onTouchStart={move} onTouchMove={move} onMouseLeave={() => setHover(null)}>
        {ts.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill={MUTED}>{fmtInt(t)}</text>
          </g>
        ))}
        {pts.length > 1 && <path d={`${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`} fill={color} opacity="0.1" />}
        {pts.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {periods.length <= 45 && pts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={periods.length <= 14 ? 4 : 2.5} fill={color} stroke={SURFACE} strokeWidth="2" />)}
        {periods.map((p, i) => i % every === 0 && <text key={p.key} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10.5" fill={MUTED}>{p.short}</text>)}
        {h && <><line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke={INK} strokeWidth="1" strokeDasharray="3 3" opacity="0.45" /><circle cx={x(hover)} cy={y(h[field] || 0)} r="5" fill={color} stroke={SURFACE} strokeWidth="2" /></>}
        <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} stroke="#c9d6cb" strokeWidth="1" />
      </svg>
      <Tip tip={h ? { x: x(hover), y: y(h[field] || 0), title: h.label, rows: [{ label, color, value: fmtInt(h[field] || 0) }] } : null} width={w} />
      <SrTable caption={caption} head={['Période', label]} rows={periods.map((p) => [p.label, p[field] || 0])} />
    </div>
  );
}

/** Barres horizontales : classement, chaque barre porte sa valeur. */
export function HBars({ items, color = BRAND, empty = 'Aucune donnée sur la période.', unit = '' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.some((i) => i.value > 0)) return <p className="text-sm text-fi-text/55">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} title={`${it.label} : ${fmtInt(it.value)}${unit}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-fi-text/85">{it.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-fi-text">{fmtInt(it.value)}{unit}</span>
          </div>
          <div className="h-2 rounded-full bg-fi-mint"><div className="h-2 rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.max(it.value ? 2 : 0, (it.value / max) * 100)}%`, background: it.color || color }} /></div>
        </li>
      ))}
    </ul>
  );
}

/** Bandeau des 24 heures : une case par heure, d'autant plus foncée qu'il y a de demandes (une seule teinte). */
export function HourStrip({ heures }) {
  const max = Math.max(1, ...heures.map((h) => h.value));
  const [tip, setTip] = useState(null);
  return (
    <div>
      <div className="flex gap-[2px]" onMouseLeave={() => setTip(null)}>
        {heures.map((h) => (
          <button type="button" key={h.h} aria-label={`${h.h} h : ${h.value} demande${h.value > 1 ? 's' : ''}`} onMouseEnter={() => setTip(h)} onFocus={() => setTip(h)} onClick={() => setTip(h)}
            className="h-9 flex-1 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-fi-primary" style={{ background: h.value ? `rgba(46,125,50,${0.18 + 0.82 * (h.value / max)})` : '#eef4ee' }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-fi-text/55"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>
      <p className="mt-2 min-h-[1.25rem] text-xs text-fi-text/70">{tip ? `${tip.h} h – ${tip.h + 1} h : ${tip.value} demande${tip.value > 1 ? 's' : ''}` : 'Survolez une heure pour voir le détail.'}</p>
    </div>
  );
}

/** Petite courbe sans axe, sous un chiffre clé. */
export function Spark({ values, color = BRAND }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(1, ...values); const w = 96; const h = 28;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((w * i) / (values.length - 1)).toFixed(1)},${(h - 3 - (v / max) * (h - 6)).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} aria-hidden className="overflow-visible"><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
