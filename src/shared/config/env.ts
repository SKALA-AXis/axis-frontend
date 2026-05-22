function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  // Default to the current origin so local Vite proxying can handle `/api`
  // requests when no explicit backend URL is provided.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
};
