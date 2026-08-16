/** Last-known-good market payload cache (server memory). */
const store = new Map<string, { at: number; value: unknown }>();

export function cacheSet(key: string, value: unknown) {
  store.set(key, { at: Date.now(), value });
}

export function cacheGet<T>(key: string): { at: number; value: T } | null {
  const hit = store.get(key);
  return hit ? { at: hit.at, value: hit.value as T } : null;
}
