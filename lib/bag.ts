'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import { buildOrder, MAX_PER_LINE, type BagItem, type Order } from '@/lib/checkout';

const KEY = 'carmisetas:bolsa';

function read(): BagItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Se valida la forma: un localStorage de una versión vieja no debe reventar.
    return parsed.filter(
      (item): item is BagItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as BagItem).variantId === 'string' &&
        typeof (item as BagItem).unitPrice === 'number' &&
        typeof (item as BagItem).quantity === 'number',
    );
  } catch {
    return [];
  }
}

type BagContextValue = {
  items: BagItem[];
  order: Order;
  ready: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<BagItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  // Se lee después de montar: el servidor no tiene localStorage y el HTML
  // servido debe coincidir con el hidratado.
  useEffect(() => {
    setItems(read());
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key === KEY) setItems(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento, la bolsa dura lo que dure la pestaña.
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<BagItem, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.variantId === item.variantId);
      if (!existing) return [...current, { ...item, quantity }];
      return current.map((i) =>
        i.variantId === item.variantId
          ? { ...i, quantity: Math.min(MAX_PER_LINE, i.quantity + quantity) }
          : i,
      );
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.variantId !== variantId)
        : current.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(MAX_PER_LINE, quantity) }
              : i,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((current) => current.filter((i) => i.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<BagContextValue>(
    () => ({ items, order: buildOrder(items), ready, open, setOpen, add, setQuantity, remove, clear }),
    [items, ready, open, add, setQuantity, remove, clear],
  );

  return createElement(BagContext.Provider, { value }, children);
}

export function useBag(): BagContextValue {
  const context = useContext(BagContext);
  if (!context) throw new Error('useBag necesita estar dentro de <BagProvider>');
  return context;
}
