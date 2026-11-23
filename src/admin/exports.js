// Exports du tableau de bord : rapport PDF mis en page et classeur Excel à plusieurs feuilles.
// Les bibliothèques (jsPDF, ExcelJS) ne sont téléchargées qu'au moment du premier export.
// Les deux exports partent des mêmes chiffres que l'écran (summarize dans data.js).
import { TYPES, STATUTS, statut, fmtInt, fmtDateTime, fmtDay, periodLabel } from './data';

// BAND : bandeaux d'en-tête · DEEP : encre des titres · PRIMARY : en-têtes de tableaux
const BAND = '127E78'; const DEEP = '1F2A2E'; const PRIMARY = '1B8F86'; const ACCENT = '9BD45A'; const MINT = 'E6F5F2'; const INK = '263238'; const MUTED = '6B7A80';
const rgb = (hex) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
const stepName = { jour: 'jour', semaine: 'semaine', mois: 'mois' };

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const fileBase = (data) => `fertilinnov-activite_${data.periode.du}_${data.periode.au}`;
const pctTxt = (v) => (v === null || v === undefined ? '—' : `${String(v).replace('.', ',')} %`);
const evolTxt = (v) => (v === null || v === undefined ? '' : `${v > 0 ? '+' : ''}${v} % vs période précédente`);

function kpiList(sum) {
  const k = sum.kpi;
  return [
    ['Demandes reçues', fmtInt(k.total), evolTxt(k.totalEvol)],
    ['Demandes de devis', fmtInt(k.devis), evolTxt(k.devisEvol)],
    ['À traiter aujourd’hui', fmtInt(k.aTraiter), `${k.nouvelles} nouvelle${k.nouvelles > 1 ? 's' : ''}, dont ${k.enRetard} de plus de 2 jours`],
    ['Taux de transformation', pctTxt(k.transformation), `${k.gagnees} gagnée${k.gagnees > 1 ? 's' : ''}, ${k.perdues} perdue${k.perdues > 1 ? 's' : ''}`],
    ['Délai moyen de prise en charge', k.delaiMoyenH === null ? '—' : `${String(k.delaiMoyenH).replace('.', ',')} h`, 'entre la réception et le premier traitement'],
    ['Visites du site', fmtInt(k.visites), `${fmtInt(k.pagesVues)} pages vues`],
    ['Visites transformées en demande', pctTxt(k.conversion), 'demandes ÷ visites'],
    ['Échanges avec Petit Pois', fmtInt(k.requetes), `${fmtInt(k.tokens)} tokens consommés`],
  ];
}

// =====================================================================================================
// Excel
// =====================================================================================================
export async function exportExcel(data, sum, step) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default || mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = data.site.nom; wb.created = new Date();
  const thin = { style: 'thin', color: { argb: 'FFD5E3D6' } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };
  const fill = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hex}` } });

  const banner = (ws, title, cols) => {
    ws.mergeCells(1, 1, 1, cols); ws.mergeCells(2, 1, 2, cols);
    const a = ws.getCell(1, 1); a.value = data.site.nom; a.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; a.fill = fill(BAND); a.alignment = { vertical: 'middle', indent: 1 };
    const b = ws.getCell(2, 1); b.value = `${title} — ${periodLabel(data.periode)}`; b.font = { name: 'Calibri', size: 11, color: { argb: 'FFE3F6F3' } }; b.fill = fill(BAND); b.alignment = { vertical: 'middle', indent: 1 };
    ws.getRow(1).height = 32; ws.getRow(2).height = 22;
  };
  const header = (ws, rowIdx, labels) => {
    const row = ws.getRow(rowIdx);
    labels.forEach((l, i) => { const c = row.getCell(i + 1); c.value = l; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = fill(PRIMARY); c.alignment = { vertical: 'middle', horizontal: i ? 'center' : 'left', wrapText: true }; c.border = border; });
    row.height = 24;
  };
  const body = (ws, rowIdx, values, { zebra = false, align = [] } = {}) => {
    const row = ws.getRow(rowIdx);
    values.forEach((v, i) => { const c = row.getCell(i + 1); c.value = v; c.border = border; c.alignment = { vertical: 'top', horizontal: align[i] || (typeof v === 'number' ? 'right' : 'left'), wrapText: true }; if (zebra) c.fill = fill('F6FAF6'); });
    return row;
  };

  // ----- Feuille 1 : synthèse
  const s1 = wb.addWorksheet('Synthèse', { views: [{ showGridLines: false }], properties: { tabColor: { argb: `FF${PRIMARY}` } } });
  s1.columns = [{ width: 38 }, { width: 18 }, { width: 52 }];
  banner(s1, 'Rapport d’activité', 3);
  s1.getCell('A4').value = 'Chiffres clés'; s1.getCell('A4').font = { size: 13, bold: true, color: { argb: `FF${DEEP}` } };
  header(s1, 5, ['Indicateur', 'Valeur', 'Précision']);
  kpiList(sum).forEach(([label, value, hint], i) => {
    const r = body(s1, 6 + i, [label, value, hint], { zebra: i % 2 === 1, align: ['left', 'center', 'left'] });
    r.getCell(2).font = { bold: true, size: 12, color: { argb: `FF${PRIMARY}` } }; r.height = 20;
  });
  let r0 = 16;
  const block = (title, head, rows) => {
    s1.getCell(r0, 1).value = title; s1.getCell(r0, 1).font = { size: 13, bold: true, color: { argb: `FF${DEEP}` } };
    header(s1, r0 + 1, head);
    rows.forEach((row, i) => body(s1, r0 + 2 + i, row, { zebra: i % 2 === 1, align: ['left', 'center', 'left'] }));
    r0 += rows.length + 4;
  };
  const share = (v) => (sum.kpi.total ? `${Math.round((v / sum.kpi.total) * 100)} % des demandes` : '');
  block('Par type de demande', ['Type', 'Nombre', 'Part'], sum.parType.map((t) => [t.label, t.value, share(t.value)]));
  block('Par statut', ['Statut', 'Nombre', 'Part'], sum.parStatut.map((t) => [t.label, t.value, share(t.value)]));
  if (sum.parService.length) block('Par service', ['Service', 'Nombre', 'Part'], sum.parService.map((t) => [t.label, t.value, share(t.value)]));
  block('Par canal', ['Canal', 'Nombre', 'Part'], sum.parSource.map((t) => [t.label, t.value, share(t.value)]));
  s1.getCell(r0, 1).value = `Généré le ${fmtDateTime(data.genere_le)} · assistant IA : ${data.ia.provider} / ${data.ia.model}`; s1.getCell(r0, 1).font = { italic: true, size: 9, color: { argb: `FF${MUTED}` } };

  // ----- Feuille 2 : par période
  const s2 = wb.addWorksheet(`Par ${stepName[step]}`, { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  s2.columns = [{ width: 24 }, ...TYPES.map(() => ({ width: 13 })), { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 16 }];
  banner(s2, `Activité par ${stepName[step]}`, 6 + TYPES.length);
  header(s2, 4, ['Période', ...TYPES.map((t) => t.label), 'Total', 'Gagnées', 'Visites', 'Pages vues', 'Échanges Petit Pois']);
  sum.periodes.forEach((p, i) => body(s2, 5 + i, [p.label, ...TYPES.map((t) => p[t.id]), p.total, p.gagnees, p.visites, p.pages_vues, p.requetes], { zebra: i % 2 === 1 }));
  const tot = 5 + sum.periodes.length;
  const totals = body(s2, tot, ['Total', ...TYPES.map((t) => sum.periodes.reduce((n, p) => n + p[t.id], 0)), sum.kpi.total, sum.kpi.gagnees, sum.kpi.visites, sum.kpi.pagesVues, sum.kpi.requetes]);
  totals.eachCell((c) => { c.font = { bold: true, color: { argb: `FF${DEEP}` } }; c.fill = fill(MINT); });

  // ----- Feuille 3 : toutes les demandes
  const cols = [['N°', 13], ['Reçue le', 18], ['Type', 13], ['Statut', 15], ['Service', 26], ['Client', 24], ['Organisation', 24], ['E-mail', 30], ['Téléphone', 17], ['Lieu', 20], ['Surface (ha)', 12], ['Canal', 13], ['Langue', 9], ['Délai (h)', 10], ['Besoin', 60], ['Notes internes', 36]];
  const lineOf = (r) => [r.numero, fmtDateTime(r.cree_le), r.type_label, statut(r.statut).label, r.service, r.nom, r.organisation, r.email, r.telephone, r.localisation, r.surface_ha === null ? '' : Number(r.surface_ha), r.source, r.langue.toUpperCase(), r.delai_h === null ? '' : r.delai_h, r.resume, r.notes];
  const sheetOfLeads = (name, title, list) => {
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 4, xSplit: 1, showGridLines: false }] });
    ws.columns = cols.map(([, width]) => ({ width }));
    banner(ws, title, cols.length);
    header(ws, 4, cols.map(([l]) => l));
    list.forEach((r, i) => { const row = body(ws, 5 + i, lineOf(r), { zebra: i % 2 === 1 }); const c = row.getCell(4); c.fill = fill(statut(r.statut).hex); c.font = { bold: true, color: { argb: `FF${INK}` } }; c.alignment = { horizontal: 'center', vertical: 'top' }; });
    if (list.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + list.length, column: cols.length } };
    else { ws.mergeCells(5, 1, 5, 6); ws.getCell(5, 1).value = 'Aucune demande.'; ws.getCell(5, 1).font = { italic: true, color: { argb: `FF${MUTED}` } }; }
  };
  sheetOfLeads('Demandes', 'Demandes de la période', data.demandes);
  sheetOfLeads('À traiter', 'Travail à faire (toutes périodes)', sum.aTraiter);

  // ----- Feuille 5 : audience
  if (sum.audience) {
    const s5 = wb.addWorksheet('Audience', { views: [{ showGridLines: false }] });
    s5.columns = [{ width: 34 }, { width: 14 }, { width: 4 }, { width: 28 }, { width: 14 }];
    banner(s5, 'Audience du site (mesure sans cookie)', 5);
    header(s5, 4, ['Page', 'Pages vues']);
    sum.audience.pages.forEach((p, i) => body(s5, 5 + i, [p.label, p.value], { zebra: i % 2 === 1 }));
    const h2 = s5.getRow(4); ['Provenance', 'Visites'].forEach((l, i) => { const c = h2.getCell(4 + i); c.value = l; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = fill(PRIMARY); c.border = border; c.alignment = { horizontal: i ? 'center' : 'left', vertical: 'middle' }; });
    [...sum.audience.provenances, { label: '', value: '' }, ...sum.audience.appareils.map((a) => ({ label: `Appareil : ${a.label}`, value: a.value }))].forEach((p, i) => { const row = s5.getRow(5 + i); [p.label, p.value].forEach((v, k) => { const c = row.getCell(4 + k); c.value = v; if (v !== '') c.border = border; c.alignment = { horizontal: typeof v === 'number' ? 'right' : 'left' }; }); });
  }

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileBase(data)}.xlsx`);
}

// =====================================================================================================
// PDF
// =====================================================================================================
// Les polices intégrées au PDF ne couvrent que le latin de base : on remplace les signes typographiques
// (apostrophes courbes, espaces fines, tirets longs…) et on retire les émojis.
const pdfText = (v) => String(v ?? '')
  .replace(/[‘’ʼ]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—−]/g, '-').replace(/…/g, '...')
  .replace(/[    ]/g, ' ').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/→/g, '->').replace(/×/g, 'x').replace(/÷/g, '/')
  .replace(/[^\x09\x0A\x20-\x7E¡-ÿ]/g, '').replace(/[ \t]+/g, ' ').trim();

export async function exportPdf(data, sum, step) {
  const [{ jsPDF }, at] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = at.default || at.autoTable;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210; const H = 297; const M = 14;
  const T = (s, x, y, o) => doc.text(pdfText(s), x, y, o);
  const setFill = (hex) => doc.setFillColor(...rgb(hex));
  const setInk = (hex) => doc.setTextColor(...rgb(hex));

  // ----- En-tête
  setFill(BAND); doc.rect(0, 0, W, 46, 'F');
  setFill(ACCENT); doc.rect(0, 46, W, 1.6, 'F');
  // motif : filaments du réseau, en filigrane
  doc.setDrawColor(...rgb('3FB5AC')); doc.setLineWidth(0.3);
  for (let i = 0; i < 7; i++) doc.lines([[18, -6 - i, 34, 5, 52, -9 + i]], 118 + i * 3, 12 + i * 5, [1, 1], 'S', false);
  setInk('FFFFFF'); doc.setFont('helvetica', 'bold'); doc.setFontSize(21); T(data.site.nom, M, 19);
  setInk('D9F7A6'); doc.setFontSize(12.5); T('Rapport d\'activité', M, 28);
  setInk('E3F6F3'); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); T(`Période : ${periodLabel(data.periode)} · regroupement par ${stepName[step]}`, M, 36);
  doc.setFontSize(8.5); T(`Généré le ${fmtDateTime(data.genere_le)}`, M, 41.5);

  // ----- Chiffres clés : 4 × 2 tuiles
  let y = 56;
  setInk(DEEP); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); T('Chiffres clés', M, y); y += 4;
  const gap = 3.5; const tw = (W - 2 * M - 3 * gap) / 4; const th = 25;
  kpiList(sum).forEach(([label, value, hint], i) => {
    const x = M + (i % 4) * (tw + gap); const ty = y + Math.floor(i / 4) * (th + gap);
    setFill('F1F8F7'); doc.roundedRect(x, ty, tw, th, 2.5, 2.5, 'F');
    setFill(i < 4 ? PRIMARY : ACCENT); doc.roundedRect(x, ty, 1.6, th, 0.8, 0.8, 'F');
    setInk(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.3); T(doc.splitTextToSize(pdfText(label), tw - 7)[0], x + 4.5, ty + 5.8);
    setInk(DEEP); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); T(value, x + 4.5, ty + 14);
    setInk(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.4);
    doc.splitTextToSize(pdfText(hint), tw - 7).slice(0, 2).forEach((line, k) => T(line, x + 4.5, ty + 18.6 + k * 2.9));
  });
  y += 2 * th + gap + 9;

  // ----- Graphique : demandes par période (colonnes empilées)
  setInk(DEEP); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); T(`Demandes par ${stepName[step]}`, M, y);
  let lx = W - M; doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  [...TYPES].reverse().forEach((t) => { const wd = doc.getTextWidth(t.label); lx -= wd; setInk(INK); T(t.label, lx, y); lx -= 3.6; setFill(t.color.slice(1)); doc.roundedRect(lx, y - 2.3, 2.6, 2.6, 0.5, 0.5, 'F'); lx -= 4.5; });
  y += 4;
  const ch = 48; const cx0 = M + 8; const cw = W - 2 * M - 8; const base = y + ch;
  const ps = sum.periodes; const max = Math.max(1, ...ps.map((p) => p.total));
  const nice = (m) => { const pow = 10 ** Math.floor(Math.log10(m)); return [1, 2, 5, 10].map((k) => k * pow).find((s) => s >= m) || m; };
  let top = Math.max(2, nice(max)); if (top % 2) top += 1; // sommet pair : la graduation du milieu tombe sur un entier
  doc.setDrawColor(...rgb('E3EBE4')); doc.setLineWidth(0.15);
  [0, 0.5, 1].forEach((f) => { const gy = base - ch * f; doc.line(cx0, gy, cx0 + cw, gy); setInk(MUTED); doc.setFontSize(6.5); T(fmtInt(Math.round(top * f)), cx0 - 1.5, gy + 0.9, { align: 'right' }); });
  const band = cw / Math.max(1, ps.length); const bw = Math.max(0.6, Math.min(9, band * 0.62));
  const every = Math.max(1, Math.ceil(ps.length / 14));
  ps.forEach((p, i) => {
    const bx = cx0 + band * i + (band - bw) / 2; let acc = 0;
    TYPES.forEach((t) => { const v = p[t.id]; if (!v) return; const h = (v / top) * ch; setFill(t.color.slice(1)); doc.rect(bx, base - acc - h, bw, Math.max(0.2, h - 0.25), 'F'); acc += h; });
    if (i % every === 0) { setInk(MUTED); doc.setFontSize(6.2); T(p.short, bx + bw / 2, base + 3.6, { align: 'center' }); }
  });
  y = base + 12;

  // ----- Deux colonnes : statuts et services
  const colW = (W - 2 * M - 8) / 2;
  const bars = (title, items, x, y0, color) => {
    setInk(DEEP); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); T(title, x, y0);
    const m = Math.max(1, ...items.map((it) => it.value)); let yy = y0 + 6;
    if (!items.some((it) => it.value)) { setInk(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); T('Aucune donnée sur la période.', x, yy); return yy + 5; }
    items.forEach((it) => {
      setInk(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); T(doc.splitTextToSize(pdfText(it.label), colW - 16)[0], x, yy);
      doc.setFont('helvetica', 'bold'); T(fmtInt(it.value), x + colW, yy, { align: 'right' });
      setFill('E6F2F0'); doc.roundedRect(x, yy + 1.3, colW, 1.8, 0.9, 0.9, 'F');
      if (it.value) { setFill(color); doc.roundedRect(x, yy + 1.3, Math.max(1.8, (it.value / m) * colW), 1.8, 0.9, 0.9, 'F'); }
      yy += 7.6;
    });
    return yy;
  };
  const yA = bars('Où en sont les demandes', sum.parStatut, M, y, PRIMARY);
  const yB = bars('Services les plus demandés', sum.parService.length ? sum.parService.slice(0, 6) : [{ label: '—', value: 0 }], M + colW + 8, y, ACCENT);
  y = Math.max(yA, yB) + 4;

  // ----- Tableaux
  const tableStyle = {
    theme: 'grid', margin: { left: M, right: M, top: 22, bottom: 16 },
    styles: { font: 'helvetica', fontSize: 7.6, cellPadding: 1.8, textColor: rgb(INK), lineColor: rgb('DCE7DD'), lineWidth: 0.1, overflow: 'linebreak', valign: 'top' },
    headStyles: { fillColor: rgb(PRIMARY), textColor: 255, fontStyle: 'bold', fontSize: 7.8 },
    alternateRowStyles: { fillColor: rgb('F6FAF6') },
  };
  const section = (title, sub) => {
    if (y > H - 60) { doc.addPage(); y = 26; }
    setInk(DEEP); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); T(title, M, y);
    if (sub) { setInk(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); T(sub, M, y + 4.4); }
    y += sub ? 8 : 4;
  };
  const statusCell = (d) => { if (d.section === 'body' && d.column.index === 2) { const s = STATUTS.find((x) => x.label === d.cell.raw); if (s) { d.cell.styles.fillColor = rgb(s.hex); d.cell.styles.fontStyle = 'bold'; } } };

  section('Travail à faire', `${sum.aTraiter.length} demande${sum.aTraiter.length > 1 ? 's' : ''} ouverte${sum.aTraiter.length > 1 ? 's' : ''}, les plus anciennes en premier`);
  autoTable(doc, {
    ...tableStyle, startY: y, didParseCell: statusCell,
    head: [['N°', 'Reçue', 'Statut', 'Type', 'Client', 'Contact', 'Besoin']],
    body: sum.aTraiter.length ? sum.aTraiter.slice(0, 60).map((r) => [r.numero, `${fmtDay(r.jour)} (${r.age_j} j)`, statut(r.statut).label, r.type_label, [r.nom, r.organisation].filter(Boolean).join('\n'), [r.email, r.telephone].filter(Boolean).join('\n'), (r.resume || '').slice(0, 170)].map(pdfText)) : [[{ content: 'Rien à traiter : tout est à jour.', colSpan: 7, styles: { halign: 'center', textColor: rgb(MUTED) } }]],
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold' }, 1: { cellWidth: 19 }, 2: { cellWidth: 19, halign: 'center' }, 3: { cellWidth: 16 }, 4: { cellWidth: 26 }, 5: { cellWidth: 32 } },
  });
  y = doc.lastAutoTable.finalY + 10;

  section('Demandes de la période', `${data.demandes.length} demande${data.demandes.length > 1 ? 's' : ''} ${periodLabel(data.periode)}`);
  autoTable(doc, {
    ...tableStyle, startY: y, didParseCell: statusCell,
    head: [['N°', 'Reçue le', 'Statut', 'Type', 'Service', 'Client', 'Lieu', 'Canal']],
    body: data.demandes.length ? data.demandes.map((r) => [r.numero, fmtDateTime(r.cree_le), statut(r.statut).label, r.type_label, r.service, [r.nom, r.organisation].filter(Boolean).join('\n'), r.localisation, r.source].map(pdfText)) : [[{ content: 'Aucune demande sur la période.', colSpan: 8, styles: { halign: 'center', textColor: rgb(MUTED) } }]],
    columnStyles: { 0: { cellWidth: 19, fontStyle: 'bold' }, 1: { cellWidth: 24 }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 17 }, 7: { cellWidth: 18 } },
  });
  y = doc.lastAutoTable.finalY + 10;

  if (sum.audience) {
    section('Audience du site', 'Mesure sans cookie ni donnée personnelle : compteurs anonymes par jour.');
    const half = (W - 2 * M - 6) / 2;
    autoTable(doc, { ...tableStyle, startY: y, margin: { ...tableStyle.margin, right: M + half + 6 }, head: [['Page', 'Pages vues']], body: sum.audience.pages.length ? sum.audience.pages.map((p) => [pdfText(p.label), fmtInt(p.value)].map(pdfText)) : [['—', '0']], columnStyles: { 1: { halign: 'right', cellWidth: 24 } } });
    const endA = doc.lastAutoTable.finalY;
    autoTable(doc, { ...tableStyle, startY: y, margin: { ...tableStyle.margin, left: M + half + 6 }, head: [['Provenance', 'Visites']], body: sum.audience.provenances.length ? sum.audience.provenances.map((p) => [p.label, fmtInt(p.value)].map(pdfText)) : [['—', '0']], columnStyles: { 1: { halign: 'right', cellWidth: 24 } } });
    y = Math.max(endA, doc.lastAutoTable.finalY) + 8;
  }

  // ----- Bandeau et pied sur chaque page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    if (p > 1) { setFill(BAND); doc.rect(0, 0, W, 14, 'F'); setFill(ACCENT); doc.rect(0, 14, W, 0.8, 'F'); setInk('FFFFFF'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); T(data.site.nom, M, 9); setInk('E3F6F3'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); T(`Rapport d'activité · ${periodLabel(data.periode)}`, W - M, 9, { align: 'right' }); }
    doc.setDrawColor(...rgb('DCE7DD')); doc.setLineWidth(0.2); doc.line(M, H - 11, W - M, H - 11);
    setInk(MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    T('Document interne · données issues de l\'espace de pilotage', M, H - 6.5); T(`Page ${p} / ${pages}`, W - M, H - 6.5, { align: 'right' });
  }
  doc.save(`${fileBase(data)}.pdf`);
}
