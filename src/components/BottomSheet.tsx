import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Шторка, выезжающая снизу вверх. Навигация остаётся видимой под ней. */
export default function BottomSheet({ open, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 440);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-30 bg-black/35 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div
        className="absolute inset-0 z-40 overflow-hidden rounded-t-[26px] shadow-2xl transition-transform duration-[420ms]"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </>
  );
}
