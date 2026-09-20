import { LayoutGroup } from 'framer-motion';
import { BagButton } from '@/components/bag/bag-button';
import { BagDrawer } from '@/components/bag/bag-drawer';
import { PillNav } from '@/components/ui/pill-nav';
import { BagProvider } from '@/lib/bag';

/**
 * `LayoutGroup` mantiene vivos los `layoutId` mientras se navega entre el
 * catálogo y la ficha: la prenda vuela a su nueva posición en lugar de
 * desaparecer y volver a aparecer.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <BagProvider>
      <LayoutGroup>
        <PillNav>
          <BagButton />
        </PillNav>
        {children}
        <BagDrawer />
      </LayoutGroup>
    </BagProvider>
  );
}
