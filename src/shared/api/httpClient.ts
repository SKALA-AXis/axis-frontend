import { env } from '../config/env';

export interface HttpClient {
  get<T>(path: string): Promise<T>;
}

class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export const httpClient: HttpClient | null = env.apiBaseUrl
  ? new FetchHttpClient(env.apiBaseUrl)
  : null;
