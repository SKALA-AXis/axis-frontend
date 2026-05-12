export async function resolveWithFallback<T>(
  remote: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await remote();
  } catch {
    return fallback();
  }
}
