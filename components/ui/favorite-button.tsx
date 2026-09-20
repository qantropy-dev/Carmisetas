'use client';

import { motion } from 'framer-motion';
import { useFavorites } from '@/lib/favorites';
import { DURATION } from '@/lib/motion';

export function FavoriteButton({
  id,
  name,
  className = '',
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const { has, toggle, ready } = useFavorites();
  const on = ready && has(id);

  return (
    <motion.button
      type="button"
      onClick={() => toggle(id)}
      whileTap={{ scale: 0.86 }}
      transition={{ duration: DURATION.tap }}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      className={`grid size-11 place-items-center rounded-full border transition-colors
                  border-[var(--ambient-hairline)] hover:border-[var(--ambient-fg)] ${className}`}
    >
      <svg width="17" height="16" viewBox="0 0 17 16" aria-hidden className="overflow-visible">
        <path
          d="M8.5 14.2 2.9 8.8A3.6 3.6 0 0 1 8.5 4.3a3.6 3.6 0 0 1 5.6 4.5l-5.6 5.4Z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
