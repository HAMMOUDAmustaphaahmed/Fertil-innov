// Informations de l'entreprise — utilisées par le front (Footer, Contact, SEO)
// ET par le backend (/api, prompt de Petit Pois et du Chef). Pas de JSX ici.
// Ces valeurs sont les défauts : le propriétaire peut les changer via le Chef
// (elles vivent alors dans site_settings, voir api/_lib/settings.js).

export const ENTREPRISE = {
  nom: "Fertil'Innov Environnement",
  nomCourt: "Fertil'Innov",
  adresse: '460 Rue Louis Pasteur',
  codePostal: '34790',
  ville: 'Grabels',
  region: 'Occitanie',
  pays: 'France',
  telephone: '+33 4 99 62 98 71',
  mobile: '+33 6 38 74 76 69',
  email: 's.soussou@fertilinnov-environnement.com',
  linkedin: 'https://www.linkedin.com/company/fertil-innov-environnement',
  siteUrl: 'https://www.fertilinnov-environnement.com',
  fondation: '2013',
  timezone: 'Europe/Paris',
  coords: [43.6493, 3.8187],
  labo: { nom: 'Laboratoire', adresse: '2 Rue Louis Bréguet', codePostal: '34830', ville: 'Jacou', coords: [43.6616, 3.9103] },
};

// Horaires : [ouverture, fermeture] en heures décimales, null = fermé. Index = getDay() (0 = dimanche).
export const HORAIRES_SEMAINE = { 0: null, 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: null };

export const LANGS = ['fr', 'en', 'es'];
export const DEFAULT_LANG = 'fr';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Heure locale de Paris décomposée, quelle que soit la timezone du serveur. */
export function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: ENTREPRISE.timezone,
    weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const weekday = get('weekday');
  const day = JOURS.indexOf(weekday);
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return {
    day, weekday, hour, minute,
    decimal: hour + minute / 60,
    isoDate: `${get('year')}-${get('month')}-${get('day')}`,
    label: `${weekday} ${get('day')}/${get('month')}/${get('year')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

export function isOpenAt(day, decimalHour, horaires = HORAIRES_SEMAINE) {
  const plage = horaires?.[day];
  if (!plage) return false;
  return decimalHour >= plage[0] && decimalHour < plage[1];
}

export function isOpenNow(date = new Date(), horaires = HORAIRES_SEMAINE) {
  const { day, decimal } = parisNow(date);
  return isOpenAt(day, decimal, horaires);
}

const JOURS_LABEL = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
};
const FERME = { fr: 'Fermé', en: 'Closed', es: 'Cerrado' };
const TOUS = { fr: 'Tous les jours', en: 'Every day', es: 'Todos los días' };
const fmtH = (d) => { const h = Math.floor(d); const m = Math.round((d - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

/** Regroupe les horaires en lignes lisibles : [{ jour: 'Lundi — Vendredi', heures: '08:00 – 18:00' }]. */
export function horairesAffichage(horaires = HORAIRES_SEMAINE, lang = 'fr') {
  const L = JOURS_LABEL[lang] || JOURS_LABEL.fr;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const key = (d) => (horaires?.[d] ? `${fmtH(horaires[d][0])} – ${fmtH(horaires[d][1])}` : FERME[lang] || FERME.fr);
  const groups = [];
  for (const d of order) {
    const k = key(d);
    const last = groups[groups.length - 1];
    if (last && last.heures === k) last.days.push(d); else groups.push({ heures: k, days: [d] });
  }
  if (groups.length === 1) return [{ jour: TOUS[lang] || TOUS.fr, heures: groups[0].heures }];
  return groups.map((g) => ({ jour: g.days.length > 1 ? `${L[g.days[0]]} — ${L[g.days[g.days.length - 1]]}` : L[g.days[0]], heures: g.heures }));
}
