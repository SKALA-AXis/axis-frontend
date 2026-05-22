import { env } from '../../../shared/config/env';
import { getAccessToken } from '../../../shared/api/authSession';
import type {
  AuthResponse,
  AuthUser,
  EmailVerificationResponse,
  LoginPayload,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
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
    return true;
  }

  login(payload: LoginPayload) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { auth: false });
  }

  signup(payload: SignupPayload) {
    return this.request<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { auth: false });
  }

  resendEmailVerification(email: string) {
    return this.request<EmailVerificationResponse>('/api/auth/email-verifications/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, { auth: false });
  }

  verifyEmail(token: string) {
    return this.request<EmailVerificationResponse>(`/api/auth/email-verifications/confirm?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    }, { auth: false });
  }

  requestPasswordReset(email: string) {
    return this.request<PasswordResetRequestResponse>('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, { auth: false, credentials: false });
  }

  confirmPasswordReset(token: string, newPassword: string) {
    return this.request<PasswordResetConfirmResponse>('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }, { auth: false, credentials: false });
  }

  refresh() {
    return this.request<AuthResponse>('/api/auth/refresh', { method: 'POST' }, { auth: false });
  }

  logout() {
    return this.request<{ result: string }>('/api/auth/logout', { method: 'POST' });
  }

  me() {
    return this.request<AuthUser>('/api/auth/me', { method: 'GET' });
  }

  private async request<T>(path: string, init: RequestInit, options: { auth?: boolean; credentials?: boolean } = {}): Promise<T> {
    const shouldAttachAccessToken = options.auth !== false;
    const shouldIncludeCredentials = options.credentials !== false;
    const accessToken = shouldAttachAccessToken ? getAccessToken() : null;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        credentials: shouldIncludeCredentials ? 'include' : 'omit',
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
    }

    const payload = await parseApiResponse<T>(response);
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error?.message ?? koreanHttpError(response.status));
    }
    return payload.data as T;
  }
}

export const authRepository = new AuthRepository();

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.ok) {
      return { success: true, data: undefined as T, timestamp: new Date().toISOString() };
    }
    return {
      success: false,
      error: { code: 'EMPTY_RESPONSE', message: koreanHttpError(response.status) },
      timestamp: new Date().toISOString(),
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON_RESPONSE',
        message: response.ok ? '서버 응답 형식이 올바르지 않습니다.' : koreanHttpError(response.status),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

function koreanHttpError(status: number) {
  if (status === 400) return '요청 값이 올바르지 않습니다.';
  if (status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다. 로그인 상태를 초기화한 뒤 다시 시도하세요.';
  if (status === 404) return '요청한 API를 찾을 수 없습니다. 백엔드 서버 주소를 확인하세요.';
  if (status === 503) return '인증 메일 발송 시스템에 연결할 수 없습니다. 서버 메일 설정을 확인하세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.';
  return `요청 처리에 실패했습니다. (${status})`;
}
