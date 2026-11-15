"use client";

import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

/** "What should we call you?" — one shared store so every mood and the prompt see the same name. */
type State = { name: string | null; skipped: boolean; asking: boolean };

let state: State = { name: null, skipped: false, asking: false };
const listeners = new Set<() => void>();
let pending: ((name: string | null) => void) | null = null;
let started = false;

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const local = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};

/** Instant from localStorage, then reconciled with the database. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  set({ name: local.get("pml_name"), skipped: local.get("pml_name_skipped") === "1" });
  api
    .profile()
    .then((name) => {
      if (name) {
        local.set("pml_name", name);
        set({ name });
      } else if (state.name) {
        api.setName(state.name).catch(() => {}); // saved locally before the DB had it
      }
    })
    .catch(() => {});
}

export function useProfile(): State {
  start();
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state
  );
}

/** Opens the prompt; resolves with the chosen name, or null if they'd rather stay anonymous. */
export function askName(): Promise<string | null> {
  pending?.(state.name);
  set({ asking: true });
  return new Promise((resolve) => (pending = resolve));
}

export async function saveName(name: string) {
  const saved = await api.setName(name); // throws on invalid name — the prompt shows the error
  local.set("pml_name", saved);
  set({ name: saved, asking: false });
  pending?.(saved);
  pending = null;
}

export function skipName() {
  local.set("pml_name_skipped", "1");
  set({ skipped: true, asking: false });
  pending?.(state.name);
  pending = null;
}
