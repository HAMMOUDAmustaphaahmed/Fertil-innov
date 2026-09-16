// Carte OpenStreetMap (Leaflet, sans clé) : siège + laboratoire. Chargée uniquement côté client.
import { useEffect, useRef } from 'react';
import { useSite } from '../site/SiteProvider';

export default function MapSites({ className = '' }) {
  const ref = useRef(null);
  const { entreprise: e, nom } = useSite();
  useEffect(() => {
    let map;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !ref.current) return;
      const icon = L.divIcon({ className: '', html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#2e7d32;border:3px solid #fff;box-shadow:0 4px 14px rgba(27,94,32,.45)"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
      map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }).addTo(map);
      const pts = [];
      if (e.coords) { pts.push(e.coords); L.marker(e.coords, { icon }).addTo(map).bindPopup(`<strong>${nom}</strong><br>${e.adresse}, ${e.codePostal} ${e.ville}`); }
      if (e.labo?.coords) { pts.push(e.labo.coords); L.marker(e.labo.coords, { icon }).addTo(map).bindPopup(`<strong>${e.labo.nom || 'Laboratoire'}</strong><br>${e.labo.adresse}, ${e.labo.codePostal} ${e.labo.ville}`); }
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] }); else map.setView(pts[0] || [43.65, 3.82], 13);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [e, nom]);
  return <div ref={ref} className={`h-72 md:h-full min-h-[18rem] w-full rounded-3xl overflow-hidden border border-fi-light bg-fi-mint ${className}`} role="region" aria-label="Carte" />;
}
