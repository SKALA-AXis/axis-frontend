/**
 * LinkVerification 응답 — axis-ai `/link/verify` 출력 스키마.
 * spec: axis-ai/design/30-analysis/link-verification.md §5
 */

export type LinkStatusEnum =
  | 'live'
  | 'dead'
  | 'redirected'
  | 'error'
  | 'live (content_changed)';

export type LinkOverallStatus = 'all_live' | 'some_dead' | 'all_dead' | 'content_changed';

export interface LinkStatus {
  url: string;
  status: LinkStatusEnum;
  http_code?: number | null;
  final_url?: string | null;
  content_changed: boolean;
  last_modified?: string | null;
  checked_at: string;
}

export interface LinkVerifyResponse {
  card_id: string;
  sources: LinkStatus[];
  overall_status: LinkOverallStatus;
  verified_at: string;
  warning?: string | null;
}
