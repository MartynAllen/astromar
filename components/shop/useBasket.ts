"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addToBasket,
  basketCount,
  deserialiseBasket,
  removeLine,
  serialiseBasket,
  setLineQty,
} from "@/lib/shop/basket";
import type { BasketLine } from "@/lib/shop/types";

// A tiny external store over localStorage. useSyncExternalStore (not
// useState + an effect) so every component showing the basket — header
// count, product page, basket page — reads one source and re-renders
// together, and so the server-rendered HTML (always an empty basket) swaps
// to the real one after hydration without a mismatch error.
//
// Only {productId, variantKey, qty} is ever stored — never a price. The
// basket page re-prices everything from the server on every load.

const STORAGE_KEY = "astromar-shop-basket";
const EMPTY: BasketLine[] = [];

let lines: BasketLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(raw: string | null): BasketLine[] {
  const parsed = deserialiseBasket(raw);
  return parsed.length > 0 ? parsed : EMPTY;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = readStorage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage blocked (private mode, disabled cookies): fall back to an
    // in-memory basket for this tab rather than breaking the shop.
    lines = EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: BasketLine[]) {
  lines = next.length > 0 ? next : EMPTY;
  try {
    if (next.length > 0) window.localStorage.setItem(STORAGE_KEY, serialiseBasket(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not persisted, but still held in memory and shown.
  }
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  lines = readStorage(event.newValue);
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): BasketLine[] {
  load();
  return lines;
}

function getServerSnapshot(): BasketLine[] {
  return EMPTY;
}

export function useBasket() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback(
    (productId: string, variantKey: string, qty = 1) =>
      commit(addToBasket(getSnapshot(), productId, variantKey, qty)),
    [],
  );
  const setQty = useCallback(
    (productId: string, variantKey: string, qty: number) =>
      commit(setLineQty(getSnapshot(), productId, variantKey, qty)),
    [],
  );
  const remove = useCallback(
    (productId: string, variantKey: string) =>
      commit(removeLine(getSnapshot(), productId, variantKey)),
    [],
  );
  const clear = useCallback(() => commit(EMPTY), []);

  return { lines: current, count: basketCount(current), add, setQty, remove, clear };
}
