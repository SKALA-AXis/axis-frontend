import { env } from '../../../shared/config/env';
import { getAccessToken } from '../../../shared/api/authSession';
import type {
  AuthResponse,
  AuthUser,
  EmailVerificationResponse,
  LoginPayload,
  SignupPayload,
  SignupResponse,
} from '../model/auth';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
};

class AuthRepository {
  private readonly baseUrl = env.apiBaseUrl;

  enabled() {
    return Boolean(this.baseUrl);
  }

  login(payload: LoginPayload) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  signup(payload: SignupPayload) {
    return this.request<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  resendEmailVerification(email: string) {
    return this.request<EmailVerificationResponse>('/api/auth/email-verifications/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  verifyEmail(token: string) {
    return this.request<EmailVerificationResponse>(`/api/auth/email-verifications/confirm?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  }

  refresh() {
    return this.request<AuthResponse>('/api/auth/refresh', { method: 'POST' });
  }

  logout() {
    return this.request<{ result: string }>('/api/auth/logout', { method: 'POST' });
  }

  me() {
    return this.request<AuthUser>('/api/auth/me', { method: 'GET' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    const payload = await response.json() as ApiResponse<T>;
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error?.message ?? `Request failed: ${response.status}`);
    }
    return payload.data as T;
  }
}

export const authRepository = new AuthRepository();
