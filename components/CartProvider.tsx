"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartLine = {
  productId: number;
  handle: string;
  title: string;
  image: string | null;
  /** Paise. Only ever used for display — the server re-prices at checkout. */
  price: number;
  compareAtPrice: number | null;
  quantity: number;
};

type Snapshot = { lines: CartLine[]; note: string; hydrated: boolean };

const LINES_KEY = "hueglam.cart.v1";
const NOTE_KEY = "hueglam.cart.note.v1";

/*
  The cart lives in a module-level store rather than component state so it can
  be hydrated from localStorage without a setState-inside-effect. The snapshot
  object is cached and only replaced on a real change, which is what
  useSyncExternalStore requires to avoid re-render loops.
*/

// Stable references: the same objects every call, so the snapshot never churns.
const EMPTY_LINES: CartLine[] = [];
const EMPTY: Snapshot = { lines: EMPTY_LINES, note: "", hydrated: false };

let snapshot: Snapshot = EMPTY;
let hydrationStarted = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(LINES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        Boolean(l) &&
        typeof l.productId === "number" &&
        typeof l.price === "number" &&
        typeof l.quantity === "number" &&
        l.quantity > 0,
    );
  } catch {
    // Private mode, cleared storage, or corrupt JSON — start empty.
    return [];
  }
}

function readStoredNote(): string {
  try {
    return window.localStorage.getItem(NOTE_KEY) ?? "";
  } catch {
    return "";
  }
}

function persistLines(lines: CartLine[]) {
  try {
    window.localStorage.setItem(LINES_KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable — the cart still works for this page session.
  }
}

function persistNote(note: string) {
  try {
    window.localStorage.setItem(NOTE_KEY, note);
  } catch {
    // As above.
  }
}

function setLines(next: CartLine[]) {
  snapshot = { ...snapshot, lines: next, hydrated: true };
  persistLines(next);
  emit();
}

function setStoredNote(next: string) {
  snapshot = { ...snapshot, note: next, hydrated: true };
  persistNote(next);
  emit();
}

function subscribe(listener: () => void) {
  // First client subscriber pulls the saved cart in. Runs once, before paint.
  if (!hydrationStarted) {
    hydrationStarted = true;
    snapshot = { lines: readStoredCart(), note: readStoredNote(), hydrated: true };
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

type CartContextValue = {
  lines: CartLine[];
  note: string;
  count: number;
  subtotal: number;
  ready: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  setNote: (note: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { lines, note, hydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    const current = snapshot.lines;
    const existing = current.find((l) => l.productId === line.productId);
    setLines(
      existing
        ? current.map((l) =>
            l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
          )
        : [...current, { ...line, quantity }],
    );
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    const current = snapshot.lines;
    setLines(
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: number) => {
    setLines(snapshot.lines.filter((l) => l.productId !== productId));
  }, []);

  const setNote = useCallback((next: string) => setStoredNote(next), []);

  const clear = useCallback(() => {
    setLines([]);
    setStoredNote("");
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
    return {
      lines,
      note,
      count,
      subtotal,
      ready: hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add,
      setQuantity,
      remove,
      setNote,
      clear,
    };
  }, [lines, note, hydrated, isOpen, add, setQuantity, remove, setNote, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
