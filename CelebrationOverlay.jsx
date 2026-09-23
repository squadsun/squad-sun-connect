import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CelebrationOverlay({ show, onClose, title = 'Congratulations!', message = 'Thank you for your purchase!' }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (show && !firedRef.current) {
      firedRef.current = true;
      const colors = ['#f59e0b', '#fbbf24', '#fde68a', '#ffffff'];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors });
      const end = Date.now() + 2500;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
    if (!show) firedRef.current = false;
  }, [show]);

  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative bg-background rounded-3xl p-8 mx-6 max-w-xs text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="font-display font-extrabold text-2xl text-ink mb-2">{title}</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-solar font-semibold mt-3">Our team will be in touch with you shortly.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}