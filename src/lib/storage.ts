export interface StorageItem {
  value: string;
}

export const storage = {
  async get(key: string, isShared: boolean = false): Promise<StorageItem | null> {
    if (typeof window === "undefined") return null;
    try {
      const storageKey = isShared ? `pml_shared:${key}` : `pml_private:${key}`;
      const val = window.localStorage.getItem(storageKey);
      if (val === null) return null;
      return { value: val };
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, isShared: boolean = false): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const storageKey = isShared ? `pml_shared:${key}` : `pml_private:${key}`;
      window.localStorage.setItem(storageKey, value);
    } catch (e) {
      console.error("Storage set error:", e);
    }
  },
};

if (typeof window !== "undefined") {
  if (!(window as unknown as { storage?: typeof storage }).storage) {
    (window as unknown as { storage: typeof storage }).storage = storage;
  }
}
