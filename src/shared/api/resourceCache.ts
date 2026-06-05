type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
  updatedAt: number;
};

type CacheOptions = {
  staleTimeMs?: number;
  force?: boolean;
};

export const defaultResourceStaleTimeMs = 50 * 60 * 1000;

const resourceCache = new Map<string, CacheEntry<unknown>>();

export function getCachedResource<T>(
  key: string,
  load: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const staleTimeMs = options.staleTimeMs ?? defaultResourceStaleTimeMs;
  const existing = resourceCache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (!options.force && existing?.value !== undefined && now - existing.updatedAt < staleTimeMs) {
    return Promise.resolve(existing.value);
  }

  if (!options.force && existing?.promise) {
    return existing.promise;
  }

  const promise = load()
    .then((value) => {
      resourceCache.set(key, { value, updatedAt: Date.now() });
      return value;
    })
    .catch((error) => {
      const current = resourceCache.get(key) as CacheEntry<T> | undefined;
      if (current?.promise === promise) {
        resourceCache.delete(key);
      }
      throw error;
    });

  resourceCache.set(key, {
    value: existing?.value,
    promise,
    updatedAt: existing?.updatedAt ?? 0,
  });

  return promise;
}

export async function prefetchCachedResource<T>(
  key: string,
  load: () => Promise<T>,
  options: CacheOptions = {},
): Promise<void> {
  try {
    await getCachedResource(key, load, options);
  } catch {
    // Prefetch is opportunistic; screen-level loaders still surface real errors.
  }
}

export function invalidateCachedResource(key: string): void {
  resourceCache.delete(key);
}

export function invalidateCachedResources(prefix: string): void {
  Array.from(resourceCache.keys())
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => resourceCache.delete(key));
}
