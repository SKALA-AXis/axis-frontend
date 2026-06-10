import { env } from '../config/env';

export async function resolveWithFallback<T>(
  remote: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  try {
    return await remote();
  } catch (error) {
    if (!env.enableMockData) {
      throw error;
    }
    return fallback();
  }
}
