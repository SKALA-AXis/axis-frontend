/*
 * 작성일: 2026-05-21
 * 작성자: 박진
 * 변경이력:
 *   2026-05-21 박진 — 로그인/회원가입 모델 추가, 이후 비밀번호 찾기 관련 타입 추가
 */
export type AuthUser = {
  id?: string;
  email: string;
  name?: string;
  department?: string;
  job_title?: string;
  role?: 'USER' | 'ADMIN' | string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | string;
  email_verified?: boolean;
  last_login_at?: string | null;
};

export type AuthResponse = {
  access_token?: string;
  expires_at?: string;
  expires_in_seconds?: number;
  user?: AuthUser;
};

export type SignupResponse = {
  user?: AuthUser;
  email_verification_required?: boolean;
  verification_expires_at?: string;
};

export type EmailVerificationResponse = {
  verified: boolean;
};

export type PasswordResetRequestResponse = {
  accepted?: boolean;
  message?: string;
  expires_in_minutes?: number;
};

export type PasswordResetConfirmResponse = {
  password_reset?: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember_me: boolean;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};
