import { Bell, Clock3, KeyRound, LogOut, Plus, RefreshCw, ShieldCheck, X, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import type { AuthUser } from '../../../../features/auth/model/auth';
import { notificationsRepository } from '../../../../features/notifications/api/notificationsRepository';
import type { NotificationPreferences } from '../../../../features/notifications/model/notification';
import { settingsRepository } from '../../../../features/settings/api/settingsRepository';
import type { AccessLogItem } from '../../../../features/settings/model/accessLog';

type SettingsTab = 'account' | 'history' | 'notifications';
type AccessLogStatus = 'idle' | 'loading' | 'success' | 'error';
type NotificationPreferenceStatus = 'idle' | 'loading' | 'success' | 'error';
type PasswordChangeStatus = 'idle' | 'loading' | 'success' | 'error';

export function SettingsView({ onLogout, currentUser }: { onLogout: () => void | Promise<void>; currentUser?: AuthUser | null }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [profileSaved, setProfileSaved] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [accessLogStatus, setAccessLogStatus] = useState<AccessLogStatus>('idle');
  const [accessLogError, setAccessLogError] = useState('');
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<PasswordChangeStatus>('idle');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    enabled: true,
    importantEnabled: true,
    keywords: [],
  });
  const [notificationPreferenceStatus, setNotificationPreferenceStatus] = useState<NotificationPreferenceStatus>('idle');
  const [notificationPreferenceError, setNotificationPreferenceError] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'AXIS 사용자';
  const email = currentUser?.email || 'axis.user@sk.com';
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    inApp: true,
    msTeams: false,
    briefingTime: '08:30',
    eventImmediate: true,
  });

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: 'account', label: '회원 정보', icon: User },
    { id: 'history', label: '접속 로그', icon: ShieldCheck },
    { id: 'notifications', label: '알림 설정', icon: Bell },
  ];

  const loadAccessLogs = useCallback(async () => {
    setAccessLogStatus('loading');
    setAccessLogError('');
    try {
      const items = await settingsRepository.accessLogs();
      setAccessLogs(items);
      setAccessLogStatus('success');
    } catch (error) {
      setAccessLogs([]);
      setAccessLogStatus('error');
      setAccessLogError(error instanceof Error ? error.message : '접속 로그를 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && accessLogStatus === 'idle') {
      void loadAccessLogs();
    }
  }, [accessLogStatus, activeTab, loadAccessLogs]);

  const loadNotificationPreferences = useCallback(async () => {
    setNotificationPreferenceStatus('loading');
    setNotificationPreferenceError('');
    try {
      setNotificationPreferences(await notificationsRepository.preferences());
      setNotificationPreferenceStatus('success');
    } catch (error) {
      setNotificationPreferenceStatus('error');
      setNotificationPreferenceError(error instanceof Error ? error.message : '알림 설정을 불러오지 못했습니다.');
    }
  }, []);

  const saveNotificationPreferences = async () => {
    setNotificationPreferenceStatus('loading');
    setNotificationPreferenceError('');
    try {
      setNotificationPreferences(await notificationsRepository.updatePreferences(notificationPreferences));
      setNotificationPreferenceStatus('success');
    } catch (error) {
      setNotificationPreferenceStatus('error');
      setNotificationPreferenceError(error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.');
    }
  };

  const addKeyword = () => {
    const keyword = keywordDraft.trim().replace(/\s+/g, ' ');
    if (!keyword || notificationPreferences.keywords.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
      setKeywordDraft('');
      return;
    }
    setNotificationPreferences((current) => ({ ...current, keywords: [...current.keywords, keyword] }));
    setKeywordDraft('');
  };

  useEffect(() => {
    if (activeTab === 'notifications' && notificationPreferenceStatus === 'idle') {
      void loadNotificationPreferences();
    }
  }, [activeTab, loadNotificationPreferences, notificationPreferenceStatus]);

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordChangeStatus('idle');
    setPasswordChangeMessage('');
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;

    if (currentPassword.length === 0) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('현재 비밀번호를 입력하세요.');
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('새 비밀번호는 8자 이상 64자 이하로 입력하세요.');
      return;
    }
    if (newPassword !== passwordForm.confirmPassword) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage('새 비밀번호와 확인 값이 일치하지 않습니다.');
      return;
    }

    setPasswordChangeStatus('loading');
    setPasswordChangeMessage('');
    try {
      await settingsRepository.changePassword(currentPassword, newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordChangeStatus('success');
      setPasswordChangeMessage('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인하세요.');
      window.setTimeout(() => {
        void onLogout();
      }, 900);
    } catch (error) {
      setPasswordChangeStatus('error');
      setPasswordChangeMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="User settings"
          title="회원 정보"
          subtitle="프로필, 접속 로그, 알림 채널을 OpenAPI Settings 도메인 구조에 맞춰 관리합니다."
          actions={<ExecutiveButton variant="danger" icon={<LogOut size={16} />} onClick={onLogout}>로그아웃</ExecutiveButton>}
        />

        <section className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="axis-panel-flat h-fit p-3">
            <nav data-guide="settings-tabs" className="flex gap-2 overflow-x-auto lg:flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-[var(--axis-radius-md)] px-4 py-3 text-left transition lg:w-full ${
                      isActive
                        ? 'bg-[var(--axis-accent)] text-white shadow-[0_14px_34px_-26px_rgba(220,90,36,0.65)]'
                        : 'text-[var(--axis-body)] hover:bg-[var(--axis-surface-muted)]'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="axis-panel-flat overflow-hidden">
            {activeTab === 'account' ? (
              <section className="p-5">
                <div className="flex items-center gap-2">
                  <User size={17} className="text-[var(--axis-accent)]" />
                  <h2 className="axis-section-heading">프로필</h2>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="이름" defaultValue={displayName} />
                  <Field label="이메일" type="email" defaultValue={email} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <ExecutiveButton onClick={() => setProfileSaved(true)}>회원 정보 저장</ExecutiveButton>
                  <ExecutiveButton
                    variant="secondary"
                    icon={<KeyRound size={16} />}
                    onClick={() => {
                      if (passwordFormOpen) {
                        resetPasswordForm();
                      }
                      setPasswordFormOpen((current) => !current);
                    }}
                  >
                    비밀번호 변경
                  </ExecutiveButton>
                  {profileSaved ? <ExecutiveBadge tone="success">저장되었습니다</ExecutiveBadge> : null}
                </div>
                {passwordFormOpen ? (
                  <form
                    className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4"
                    onSubmit={handlePasswordChange}
                    noValidate
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <PasswordField
                        id="settings-current-password"
                        label="현재 비밀번호"
                        value={passwordForm.currentPassword}
                        onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                      />
                      <PasswordField
                        id="settings-new-password"
                        label="새 비밀번호"
                        value={passwordForm.newPassword}
                        onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                      />
                      <PasswordField
                        id="settings-confirm-password"
                        label="새 비밀번호 확인"
                        value={passwordForm.confirmPassword}
                        onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
                      <ExecutiveButton type="submit" disabled={passwordChangeStatus === 'loading'}>
                        {passwordChangeStatus === 'loading' ? '변경 중' : '변경 저장'}
                      </ExecutiveButton>
                      <ExecutiveButton
                        variant="ghost"
                        disabled={passwordChangeStatus === 'loading'}
                        onClick={() => {
                          resetPasswordForm();
                          setPasswordFormOpen(false);
                        }}
                      >
                        취소
                      </ExecutiveButton>
                      {passwordChangeMessage ? (
                        <p className={`min-w-0 text-sm font-semibold leading-5 ${passwordChangeStatus === 'success' ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'}`}>
                          {passwordChangeMessage}
                        </p>
                      ) : null}
                    </div>
                  </form>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'history' ? (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={17} className="text-[var(--axis-accent)]" />
                    <h2 className="axis-section-heading">접속 로그</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExecutiveButton
                      variant="secondary"
                      icon={<RefreshCw size={14} />}
                      disabled={accessLogStatus === 'loading'}
                      onClick={() => void loadAccessLogs()}
                    >
                      새로고침
                    </ExecutiveButton>
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)]">
                  <table className="axis-data-table">
                    <thead>
                      <tr>
                        <th>일시</th>
                        <th>Action</th>
                        <th>국가</th>
                        <th>IP 주소</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessLogStatus === 'loading' ? (
                        <tr>
                          <td colSpan={4} className="text-center text-[var(--axis-muted)]">접속 로그를 불러오는 중입니다.</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'error' ? (
                        <tr>
                          <td colSpan={4} className="text-center text-[var(--axis-danger)]">{accessLogError}</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'success' && accessLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-[var(--axis-muted)]">표시할 접속 로그가 없습니다.</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'success' && accessLogs.map((item) => (
                        <tr key={item.id}>
                          <td>{formatAccessLogTime(item.occurredAt)}</td>
                          <td>{formatAccessLogAction(item)}</td>
                          <td>{item.country || '알 수 없음'}</td>
                          <td>{item.ipAddress || '기록 없음'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {activeTab === 'notifications' ? (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell size={17} className="text-[var(--axis-accent)]" />
                    <h2 className="axis-section-heading">알림 채널·시간</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <ToggleRow
                    title="알림 전체"
                    description="상단 알림창과 배지 알림을 사용합니다."
                    checked={notificationPreferences.enabled}
                    onChange={(checked) => setNotificationPreferences((current) => ({ ...current, enabled: checked }))}
                  />
                  <ToggleRow
                    title="중요 시그널"
                    description="수주, 계약, 실적, 투자 등 중요 키워드 감지를 포함합니다."
                    checked={notificationPreferences.importantEnabled}
                    onChange={(checked) => setNotificationPreferences((current) => ({ ...current, importantEnabled: checked }))}
                  />
                  <ToggleRow
                    title="Email"
                    description="브리핑과 중요 이벤트를 이메일로 수신합니다."
                    checked={notificationSettings.email}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, email: checked }))}
                  />
                  <ToggleRow
                    title="In-app"
                    description="AXIS 콘솔 내부 알림을 표시합니다."
                    checked={notificationSettings.inApp}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, inApp: checked }))}
                  />
                  <ToggleRow
                    title="MS Teams"
                    description="Teams Webhook 채널로 브리핑을 전달합니다."
                    checked={notificationSettings.msTeams}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, msTeams: checked }))}
                  />
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--axis-ink)]">관심 키워드</h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">등록한 키워드가 카드뉴스 본문에 포함되면 알림을 생성합니다.</p>
                    </div>
                    <ExecutiveBadge>{notificationPreferences.keywords.length}/20</ExecutiveBadge>
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addKeyword();
                    }}
                  >
                    <input
                      value={keywordDraft}
                      onChange={(event) => setKeywordDraft(event.target.value)}
                      maxLength={30}
                      className="h-10 min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
                      placeholder="예: 수주, AI agent, 클라우드"
                    />
                    <ExecutiveButton type="submit" variant="secondary" icon={<Plus size={15} />}>추가</ExecutiveButton>
                  </form>
                  <div className="mt-3 flex min-h-9 flex-wrap gap-2">
                    {notificationPreferences.keywords.length === 0 ? (
                      <span className="text-xs font-semibold text-[var(--axis-muted)]">등록된 관심 키워드가 없습니다.</span>
                    ) : null}
                    {notificationPreferences.keywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => setNotificationPreferences((current) => ({
                          ...current,
                          keywords: current.keywords.filter((item) => item !== keyword),
                        }))}
                        className="inline-flex items-center gap-1 rounded-sm border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-1 text-xs font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-danger)] hover:text-[var(--axis-danger)]"
                      >
                        {keyword}
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock3 size={16} className="text-[var(--axis-accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--axis-ink)]">브리핑 발송 시간</h3>
                  </div>
                  <input
                    type="time"
                    value={notificationSettings.briefingTime}
                    onChange={(event) => setNotificationSettings((current) => ({ ...current, briefingTime: event.target.value }))}
                    className="h-10 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <ExecutiveButton
                    onClick={() => void saveNotificationPreferences()}
                    disabled={notificationPreferenceStatus === 'loading'}
                  >
                    알림 설정 저장
                  </ExecutiveButton>
                  {notificationPreferenceStatus === 'success' ? <ExecutiveBadge tone="success">저장되었습니다</ExecutiveBadge> : null}
                  {notificationPreferenceStatus === 'error' ? <ExecutiveBadge tone="danger">{notificationPreferenceError}</ExecutiveBadge> : null}
                </div>
              </section>
            ) : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function formatAccessLogTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '기록 없음';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

function formatAccessLogAction(item: AccessLogItem) {
  const labels: Record<string, string> = {
    SIGNUP: '회원가입',
    EMAIL_VERIFIED: '이메일 인증',
    EMAIL_VERIFICATION_RESENT: '인증 메일 재발송',
    LOGIN_SUCCESS: '로그인 성공',
    LOGIN_FAILURE: '로그인 실패',
    LOGOUT: '로그아웃',
    REFRESH_ROTATED: '자동 로그인 갱신',
    REFRESH_REUSE_DETECTED: '토큰 재사용 탐지',
    PASSWORD_CHANGED: '비밀번호 변경',
    PROFILE_UPDATED: '프로필 수정',
    SETTINGS_UPDATED: '설정 변경',
    login: '로그인',
    logout: '로그아웃',
    view: '조회',
    download: '다운로드',
    share: '공유',
  };
  const label = labels[item.action] ?? item.action;
  if (item.success || item.action.endsWith('_FAILURE') || item.action === 'REFRESH_REUSE_DETECTED') {
    return label;
  }
  return `${label} 실패`;
}

function Field({
  label,
  type = 'text',
  defaultValue,
}: {
  label: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--axis-ink)]">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-3 text-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
      />
    </label>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--axis-ink)]">{label}</span>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={id === 'settings-current-password' ? 'current-password' : 'new-password'}
        className="h-11 w-full rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
      />
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--axis-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--axis-muted)]">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full border transition ${
          checked
            ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)]'
            : 'border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)]'
        }`}
        aria-pressed={checked}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-[#FFFFFF] shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}
