import { LayoutGroup } from 'framer-motion';
import { PillNav } from '@/components/ui/pill-nav';

/**
 * `LayoutGroup` mantiene vivos los `layoutId` mientras se navega entre el
 * catálogo y la ficha: la prenda vuela a su nueva posición en lugar de
 * desaparecer y volver a aparecer.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutGroup>
      <PillNav />
      {children}
    </LayoutGroup>
  );
}
