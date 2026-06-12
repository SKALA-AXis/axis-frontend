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
    reportMockFallback(error);
    return fallback();
  }
}

function reportMockFallback(error: unknown) {
  const detail = {
    resultKind: 'mock_data_fallback',
    message: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
  console.warn('[AXIS] remote request failed; mock fallback data returned', detail);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('axis:fallback', { detail }));
  }
}
