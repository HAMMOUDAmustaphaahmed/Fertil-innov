// Loader « germination » : Petit Pois apparaît, une pousse grandit, la page s'ouvre.
// Court (≈1,4 s), une seule fois par session ; respecte prefers-reduced-motion.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useImage } from '../site/SiteProvider';

const DURATION = 1400;

export default function Loader({ onDone }) {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  const img = useImage();

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), reduced ? 200 : DURATION);
    return () => clearTimeout(id);
  }, [reduced]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div role="status" aria-live="polite" aria-label="Chargement" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-fi-deep text-white grain"
          exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}>
          <motion.img {...img('petit_pois')} alt="" width={120} height={120} className="h-28 w-28 object-contain drop-shadow-[0_10px_30px_rgba(139,195,74,0.35)]"
            initial={{ y: 30, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
          <svg width="120" height="8" viewBox="0 0 120 8" className="mt-6" aria-hidden>
            <rect x="0" y="3" width="120" height="2" rx="1" fill="rgba(255,255,255,0.15)" />
            <motion.rect x="0" y="3" height="2" rx="1" fill="rgb(139 195 74)" initial={{ width: 0 }} animate={{ width: 120 }} transition={{ duration: (reduced ? 200 : DURATION) / 1000, ease: 'easeInOut' }} />
          </svg>
          <p className="mt-3 text-sm text-white/60 font-display tracking-wide">Fertil’Innov Environnement</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
