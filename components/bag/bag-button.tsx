'use client';

import { motion } from 'framer-motion';
import { useBag } from '@/lib/bag';
import { DURATION } from '@/lib/motion';

export function BagButton() {
  const { order, setOpen, ready } = useBag();
  const count = ready ? order.units : 0;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Abrir la bolsa, ${count} prendas` : 'Abrir la bolsa'}
      className="relative grid size-11 place-items-center rounded-full transition-colors"
    >
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3.5 6.5h13l-1 10.5a1.5 1.5 0 0 1-1.5 1.4H6a1.5 1.5 0 0 1-1.5-1.4L3.5 6.5Z" />
        <path d="M7 8V5.2a3 3 0 0 1 6 0V8" strokeLinecap="round" />
      </svg>

      {count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: DURATION.tap }}
          className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full px-1
                     text-[10px] font-medium tabular-nums
                     bg-[var(--ambient-fg)] text-[var(--ambient)]"
        >
          {count}
        </motion.span>
      ) : null}
    </button>
  );
}
