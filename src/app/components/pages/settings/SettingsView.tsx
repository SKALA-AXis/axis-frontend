import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
  X,
  User,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../executive/ExecutiveSystem';
import { Slider } from '../../ui/slider';
import { Switch } from '../../ui/switch';
import type { AuthUser } from '../../../../features/auth/model/auth';
import { notificationsRepository } from '../../../../features/notifications/api/notificationsRepository';
import type { NotificationPreferences } from '../../../../features/notifications/model/notification';
import {
  settingsRepository,
  type StrategyContextItem,
} from '../../../../features/settings/api/settingsRepository';
import type { AccessLogItem } from '../../../../features/settings/model/accessLog';
import { accessLogStatus, formatAccessLogAction, formatAccessLogClient, formatAccessLogLocation, formatAccessLogTime } from '../../../../features/settings/lib/accessLogFormat';
import { formatFileSize, formatStrategyContextTime, strategyContextPreview } from '../../../../features/settings/lib/strategyContextFormat';
import { Field, PasswordField, ToggleRow } from '../../../../features/settings/components/SettingsFormFields';
import {
  clampTextScaleStep,
  textScaleSteps,
  type TextPreference,
} from '../../../../shared/config/textPreferences';

type SettingsTab = 'account' | 'history' | 'notifications' | 'largeText' | 'strategyContext';
type AccessLogStatus = 'idle' | 'loading' | 'success' | 'error';
type NotificationPreferenceStatus = 'idle' | 'loading' | 'success' | 'error';
type PasswordChangeStatus = 'idle' | 'loading' | 'success' | 'error';
type StrategyContextStatus = 'idle' | 'loading' | 'success' | 'error';

const strategyContextFileMaxBytes = 5 * 1024 * 1024;

const ACCESS_LOG_PAGE_SIZE = 5;
const ACCESS_LOG_PAGE_WINDOW_SIZE = 5;

export function SettingsView({
  onLogout,
  currentUser,
  textPreference,
  onTextPreferenceChange,
}: {
  onLogout: () => void | Promise<void>;
  currentUser?: AuthUser | null;
  textPreference: TextPreference;
  onTextPreferenceChange: (preference: TextPreference) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const strategyFileInputRef = useRef<HTMLInputElement>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [accessLogStatus, setAccessLogStatus] = useState<AccessLogStatus>('idle');
  const [accessLogError, setAccessLogError] = useState('');
  const [accessLogPage, setAccessLogPage] = useState(1);
  const [accessLogTotal, setAccessLogTotal] = useState(0);
  const [accessLogTotalPages, setAccessLogTotalPages] = useState(1);
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
  const [notificationPreferenceSaved, setNotificationPreferenceSaved] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [strategyContextItems, setStrategyContextItems] = useState<StrategyContextItem[]>([]);
  const [strategyContext, setStrategyContext] = useState('');
  const [strategyContextFile, setStrategyContextFile] = useState<{ fileName: string; fileSize: number } | null>(null);
  const [editingStrategyContextId, setEditingStrategyContextId] = useState<string | null>(null);
  const [strategyContextListOpen, setStrategyContextListOpen] = useState(false);
  const [strategyContextLoadStatus, setStrategyContextLoadStatus] = useState<StrategyContextStatus>('idle');
  const [strategyContextStatus, setStrategyContextStatus] = useState<StrategyContextStatus>('idle');
  const [strategyContextMessage, setStrategyContextMessage] = useState('');
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'AXIS 사용자';
  const email = currentUser?.email || 'axis.user@sk.com';
  const textScaleStep = clampTextScaleStep(textPreference.step);
  const textScaleLabel = `${Math.round((textScaleSteps[textScaleStep] - 1) * 100)}%`;
  const safeAccessLogPage = Math.min(accessLogPage, Math.max(1, accessLogTotalPages));
  const accessLogPageWindowStart = Math.floor((safeAccessLogPage - 1) / ACCESS_LOG_PAGE_WINDOW_SIZE) * ACCESS_LOG_PAGE_WINDOW_SIZE + 1;
  const visibleAccessLogPageNumbers = Array.from(
    { length: Math.min(ACCESS_LOG_PAGE_WINDOW_SIZE, Math.max(1, accessLogTotalPages) - accessLogPageWindowStart + 1) },
    (_, index) => accessLogPageWindowStart + index,
  );
  const accessLogRangeStart = accessLogTotal === 0 ? 0 : (safeAccessLogPage - 1) * ACCESS_LOG_PAGE_SIZE + 1;
  const accessLogRangeEnd = accessLogTotal === 0 ? 0 : Math.min(accessLogTotal, accessLogRangeStart + accessLogs.length - 1);

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: 'account', label: '회원 정보', icon: User },
    { id: 'history', label: '접속 로그', icon: ShieldCheck },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'strategyContext', label: '맞춤 전략 자료', icon: FileText },
    { id: 'largeText', label: '더 큰 텍스트', icon: Type },
  ];

  const loadAccessLogs = useCallback(async (page = 1) => {
    setAccessLogStatus('loading');
    setAccessLogError('');
    try {
      const result = await settingsRepository.accessLogs(Math.max(0, page - 1), ACCESS_LOG_PAGE_SIZE);
      setAccessLogs(result.items);
      setAccessLogPage(result.page + 1);
      setAccessLogTotal(result.total);
      setAccessLogTotalPages(Math.max(1, result.totalPages));
      setAccessLogStatus('success');
    } catch (error) {
      setAccessLogs([]);
      setAccessLogTotal(0);
      setAccessLogTotalPages(1);
      setAccessLogStatus('error');
      setAccessLogError(error instanceof Error ? error.message : '접속 로그를 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history' && accessLogStatus === 'idle') {
      void loadAccessLogs(1);
    }
  }, [accessLogStatus, activeTab, loadAccessLogs]);

  const moveAccessLogPage = (page: number) => {
    const nextPage = Math.min(Math.max(1, page), Math.max(1, accessLogTotalPages));
    setAccessLogPage(nextPage);
    void loadAccessLogs(nextPage);
  };

  const loadStrategyContexts = useCallback(async () => {
    setStrategyContextLoadStatus('loading');
    try {
      const items = await settingsRepository.strategyContexts();
      setStrategyContextItems(items);
      if (!editingStrategyContextId && !strategyContext.trim() && items[0]) {
        setStrategyContext(items[0].content);
        setStrategyContextFile(items[0].fileName && typeof items[0].fileSize === 'number'
          ? { fileName: items[0].fileName, fileSize: items[0].fileSize }
          : null);
      }
      setStrategyContextLoadStatus('success');
    } catch (error) {
      setStrategyContextLoadStatus('error');
      setStrategyContextStatus('error');
      setStrategyContextMessage(error instanceof Error ? error.message : '전략 자료를 불러오지 못했습니다.');
    }
  }, [editingStrategyContextId, strategyContext]);

  useEffect(() => {
    if (activeTab === 'strategyContext' && strategyContextLoadStatus === 'idle') {
      void loadStrategyContexts();
    }
  }, [activeTab, loadStrategyContexts, strategyContextLoadStatus]);

  const loadNotificationPreferences = useCallback(async () => {
    setNotificationPreferenceStatus('loading');
    setNotificationPreferenceError('');
    setNotificationPreferenceSaved(false);
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
    setNotificationPreferenceSaved(false);
    try {
      setNotificationPreferences(await notificationsRepository.updatePreferences(notificationPreferences));
      setNotificationPreferenceStatus('success');
      setNotificationPreferenceSaved(true);
    } catch (error) {
      setNotificationPreferenceStatus('error');
      setNotificationPreferenceError(error instanceof Error ? error.message : '알림 설정을 저장하지 못했습니다.');
    }
  };

  const updateNotificationPreferencesDraft = (updater: (current: NotificationPreferences) => NotificationPreferences) => {
    setNotificationPreferenceSaved(false);
    setNotificationPreferenceError('');
    setNotificationPreferences(updater);
  };

  const addKeyword = () => {
    const keyword = keywordDraft.trim().replace(/\s+/g, ' ');
    if (!keyword || notificationPreferences.keywords.some((item) => item.toLowerCase() === keyword.toLowerCase())) {
      setKeywordDraft('');
      return;
    }
    updateNotificationPreferencesDraft((current) => ({ ...current, keywords: [...current.keywords, keyword] }));
    setKeywordDraft('');
  };

  const saveStrategyContext = async () => {
    const nextContext = strategyContext.trim();
    if (!nextContext) {
      setStrategyContextStatus('error');
      setStrategyContextMessage('전략 자료 내용을 입력하세요.');
      return;
    }

    setStrategyContextStatus('loading');
    setStrategyContextMessage(editingStrategyContextId ? '수정 내용을 구조화하는 중입니다.' : '전략 자료를 구조화하는 중입니다.');
    try {
      const payload = {
        rawText: nextContext,
        sourceType: strategyContextFile ? 'uploaded_file' as const : 'manual_text' as const,
        fileName: strategyContextFile?.fileName,
        fileSize: strategyContextFile?.fileSize,
      };
      const savedItem = editingStrategyContextId
        ? await settingsRepository.updateStrategyContext(editingStrategyContextId, payload)
        : await settingsRepository.createStrategyContext(payload);
      setStrategyContextItems((current) => (
        editingStrategyContextId
          ? current.map((item) => (item.id === savedItem.id ? savedItem : item))
          : [savedItem, ...current.filter((item) => item.id !== savedItem.id)]
      ));
      setStrategyContext(savedItem.content);
      setEditingStrategyContextId(null);
      setStrategyContextFile(null);
      setStrategyContextListOpen(true);
      setStrategyContextStatus('success');
      setStrategyContextMessage(editingStrategyContextId ? '수정되었습니다' : '저장되었습니다');
    } catch (error) {
      setStrategyContextStatus('error');
      setStrategyContextMessage(error instanceof Error ? error.message : '전략 자료를 저장하지 못했습니다.');
    }
  };

  const clearStrategyContext = () => {
    setStrategyContext('');
    setStrategyContextFile(null);
    setEditingStrategyContextId(null);
    setStrategyContextStatus('idle');
    setStrategyContextMessage('');
  };

  const editStrategyContext = (item: StrategyContextItem) => {
    setStrategyContext(item.content);
    setStrategyContextFile(item.fileName && typeof item.fileSize === 'number'
      ? { fileName: item.fileName, fileSize: item.fileSize }
      : null);
    setEditingStrategyContextId(item.id);
    setStrategyContextStatus('idle');
    setStrategyContextMessage('');
  };

  const deleteStrategyContext = async (itemId: string) => {
    const item = strategyContextItems.find((current) => current.id === itemId);
    if (!item || !window.confirm('이 전략 자료를 삭제할까요?')) {
      return;
    }

    setStrategyContextStatus('loading');
    setStrategyContextMessage('삭제 중입니다.');
    try {
      await settingsRepository.deleteStrategyContext(itemId);
      const nextItems = strategyContextItems.filter((current) => current.id !== itemId);
      setStrategyContextItems(nextItems);
      if (editingStrategyContextId === itemId) {
        clearStrategyContext();
      }
      setStrategyContextStatus('success');
      setStrategyContextMessage('삭제되었습니다');
    } catch (error) {
      setStrategyContextStatus('error');
      setStrategyContextMessage(error instanceof Error ? error.message : '전략 자료를 삭제하지 못했습니다.');
    }
  };

  const handleStrategyContextFileUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (file.size > strategyContextFileMaxBytes) {
      setStrategyContextStatus('error');
      setStrategyContextMessage('파일은 5MB 이내로 업로드하세요.');
      if (strategyFileInputRef.current) {
        strategyFileInputRef.current.value = '';
      }
      return;
    }

    setStrategyContextStatus('loading');
    setStrategyContextMessage('파일 본문을 추출하는 중입니다.');
    try {
      const extraction = await settingsRepository.extractStrategyContextFile(file);
      const trimmedContent = extraction.extractedText.trim();
      if (!trimmedContent) {
        setStrategyContextStatus('error');
        setStrategyContextMessage('파일에서 읽을 수 있는 텍스트가 없습니다.');
        return;
      }

      setStrategyContext(trimmedContent);
      setStrategyContextFile({ fileName: extraction.fileName, fileSize: extraction.fileSize });
      setEditingStrategyContextId(null);
      setStrategyContextStatus('success');
      let message = '파일 내용을 불러왔습니다.';
      if (extraction.ocrUsed) {
        message = 'OCR로 파일 내용을 불러왔습니다.';
      }
      if (extraction.truncated) {
        message = '파일 내용이 길어 일부 텍스트만 불러왔습니다.';
      }
      setStrategyContextMessage(message);
    } catch (error) {
      setStrategyContextStatus('error');
      setStrategyContextMessage(error instanceof Error ? error.message : '파일 내용을 읽지 못했습니다.');
    } finally {
      if (strategyFileInputRef.current) {
        strategyFileInputRef.current.value = '';
      }
    }
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
          subtitle="프로필, 접속 로그, 웹 알림 기준을 관리합니다."
          actions={<ExecutiveButton variant="danger" icon={<LogOut size={16} />} onClick={onLogout}>로그아웃</ExecutiveButton>}
        />

        <section className="grid gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="axis-panel-flat h-fit p-3">
            <nav data-guide="settings-tabs" className="flex gap-2 overflow-x-auto xl:flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-[var(--axis-radius-md)] px-4 py-3 text-left transition xl:w-full ${
                      isActive
                        ? 'bg-[var(--axis-accent)] text-white shadow-[0_14px_34px_-26px_rgba(220,90,36,0.65)]'
                        : 'text-[var(--axis-body)] hover:bg-[var(--axis-surface-muted)]'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-body-sm font-semibold">{tab.label}</span>
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
                        <p className={`min-w-0 text-body-sm font-semibold leading-5 ${passwordChangeStatus === 'success' ? 'text-[var(--axis-success)]' : 'text-[var(--axis-danger)]'}`}>
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
                      onClick={() => void loadAccessLogs(safeAccessLogPage)}
                    >
                      새로고침
                    </ExecutiveButton>
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)]">
                  <table className="axis-data-table min-w-[900px]">
                    <thead>
                      <tr>
                        <th>일시</th>
                        <th>이벤트</th>
                        <th>상태</th>
                        <th>접속 위치</th>
                        <th>IP 주소</th>
                        <th>접속 환경</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessLogStatus === 'loading' ? (
                        <tr>
                          <td colSpan={6} className="text-center text-[var(--axis-muted)]">접속 로그를 불러오는 중입니다.</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'error' ? (
                        <tr>
                          <td colSpan={6} className="text-center text-[var(--axis-danger)]">{accessLogError}</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'success' && accessLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-[var(--axis-muted)]">표시할 접속 로그가 없습니다.</td>
                        </tr>
                      ) : null}
                      {accessLogStatus === 'success' && accessLogs.map((item) => (
                        <tr key={item.id}>
                          <td>{formatAccessLogTime(item.occurredAt)}</td>
                          <td>{formatAccessLogAction(item)}</td>
                          <td><AccessLogStatusPill item={item} /></td>
                          <td>{formatAccessLogLocation(item.country)}</td>
                          <td>{item.ipAddress || '기록 없음'}</td>
                          <td title={item.userAgent || undefined}>{formatAccessLogClient(item.userAgent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {accessLogStatus === 'success' && accessLogTotalPages > 1 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-caption-bold text-[var(--axis-muted)]">
                      총 {accessLogTotal.toLocaleString('ko-KR')}건 중 {accessLogRangeStart.toLocaleString('ko-KR')}-{accessLogRangeEnd.toLocaleString('ko-KR')}건
                    </p>
                    <nav className="flex items-center gap-1" aria-label="접속 로그 페이지">
                      <AccessLogPageButton
                        label="이전 페이지"
                        disabled={safeAccessLogPage <= 1}
                        onClick={() => moveAccessLogPage(safeAccessLogPage - 1)}
                      >
                        <ChevronLeft size={15} />
                      </AccessLogPageButton>
                      {visibleAccessLogPageNumbers.map((page) => (
                        <AccessLogPageButton
                          key={page}
                          label={`${page}페이지`}
                          isActive={page === safeAccessLogPage}
                          onClick={() => moveAccessLogPage(page)}
                        >
                          {page}
                        </AccessLogPageButton>
                      ))}
                      <AccessLogPageButton
                        label="다음 페이지"
                        disabled={safeAccessLogPage >= accessLogTotalPages}
                        onClick={() => moveAccessLogPage(safeAccessLogPage + 1)}
                      >
                        <ChevronRight size={15} />
                      </AccessLogPageButton>
                    </nav>
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'notifications' ? (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell size={17} className="text-[var(--axis-accent)]" />
                    <h2 className="axis-section-heading">웹 알림 기준</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <ToggleRow
                    title="알림 전체"
                    description="상단 알림창과 배지 알림을 사용합니다."
                    checked={notificationPreferences.enabled}
                    onChange={(checked) => updateNotificationPreferencesDraft((current) => ({ ...current, enabled: checked }))}
                  />
                  <ToggleRow
                    title="중요 시그널"
                    description="수주, 계약, 실적, 투자 등 중요 키워드 감지를 포함합니다."
                    checked={notificationPreferences.importantEnabled}
                    onChange={(checked) => updateNotificationPreferencesDraft((current) => ({ ...current, importantEnabled: checked }))}
                  />
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-heading-5 font-semibold text-[var(--axis-ink)]">관심 키워드</h3>
                      <p className="mt-1 text-caption leading-5 text-[var(--axis-muted)]">등록한 키워드가 카드뉴스 본문에 포함되면 알림을 생성합니다.</p>
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
                      className="h-10 min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 text-body-sm text-[var(--axis-ink)] outline-none focus:border-[var(--axis-accent)]"
                      placeholder="예: 수주, AI agent, 클라우드"
                    />
                    <ExecutiveButton type="submit" variant="secondary" icon={<Plus size={15} />}>추가</ExecutiveButton>
                  </form>
                  <div className="mt-3 flex min-h-9 flex-wrap gap-2">
                    {notificationPreferences.keywords.length === 0 ? (
                      <span className="text-caption-bold text-[var(--axis-muted)]">등록된 관심 키워드가 없습니다.</span>
                    ) : null}
                    {notificationPreferences.keywords.map((keyword) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => updateNotificationPreferencesDraft((current) => ({
                          ...current,
                          keywords: current.keywords.filter((item) => item !== keyword),
                        }))}
                        className="inline-flex items-center gap-1 rounded-sm border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-1 text-caption-bold text-[var(--axis-ink)] hover:border-[var(--axis-danger)] hover:text-[var(--axis-danger)]"
                      >
                        {keyword}
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <ExecutiveButton
                    onClick={() => void saveNotificationPreferences()}
                    disabled={notificationPreferenceStatus === 'loading'}
                  >
                    알림 설정 저장
                  </ExecutiveButton>
                  {notificationPreferenceSaved ? <ExecutiveBadge tone="success">저장되었습니다</ExecutiveBadge> : null}
                  {notificationPreferenceStatus === 'error' ? <ExecutiveBadge tone="danger">{notificationPreferenceError}</ExecutiveBadge> : null}
                </div>
              </section>
            ) : null}

            {activeTab === 'largeText' ? (
              <section className="p-5">
                <div className="flex items-center gap-2">
                  <Type size={17} className="text-[var(--axis-accent)]" />
                  <h2 className="axis-section-heading">더 큰 텍스트</h2>
                </div>
                <p className="mt-2 max-w-2xl text-body-sm text-[var(--axis-muted)]">
                  페이지마다 제목과 본문이 제각각 보이지 않도록 같은 기준으로 맞추고, 필요하면 더 크게 조절할 수 있습니다.
                </p>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-heading-5 font-semibold text-[var(--axis-ink)]">글자 더 크게 조절</h3>
                      <p className="mt-1 text-caption text-[var(--axis-muted)]">
                        {textPreference.enabled ? `현재 확대 ${textScaleLabel}` : '기본 텍스트 크기를 사용 중입니다.'}
                      </p>
                    </div>
                    <Switch
                      checked={textPreference.enabled}
                      onCheckedChange={(checked) => onTextPreferenceChange({ ...textPreference, enabled: checked, step: textScaleStep })}
                      aria-label="더 큰 텍스트 사용"
                      className="h-8 w-14 [&_[data-slot=switch-thumb]]:size-6"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-5 py-8">
                  <p className="mx-auto max-w-[28rem] text-center text-heading-4 leading-[1.55] text-[var(--axis-ink)]">
                    유동적 글자 크기를 지원하는 화면은 아래와 같이 선호하는 크기로 바로 조절됩니다.
                  </p>
                  <p className="mx-auto mt-4 max-w-[32rem] text-center text-body-md text-[var(--axis-muted)]">
                    슬라이더를 움직이면 현재 화면에서 즉시 크기를 미리 확인할 수 있습니다.
                  </p>
                </div>

                <div className={`mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-5 transition ${textPreference.enabled ? '' : 'opacity-55'}`}>
                  <div className="flex items-center gap-[16px] text-[16px]">
                    <span className="pointer-events-none shrink-0 basis-[2.25em] text-center text-[20px] leading-none text-[var(--axis-muted)]">가</span>
                    <div className="relative min-w-0 flex-1 px-[12px] py-[12px]">
                      <div className="pointer-events-none absolute inset-x-[12px] top-1/2 h-px -translate-y-1/2 bg-[var(--axis-hairline-strong)]" />
                      <div className="pointer-events-none absolute inset-x-[12px] top-1/2 flex -translate-y-1/2 justify-between px-[4px]">
                        {textScaleSteps.map((step, index) => (
                          <span
                            key={`${step}-${index}`}
                            className={`h-[10px] w-[2px] rounded-full ${index <= textScaleStep && textPreference.enabled ? 'bg-[var(--axis-accent)]' : 'bg-[var(--axis-hairline-strong)]'}`}
                          />
                        ))}
                      </div>
                      <Slider
                        min={0}
                        max={textScaleSteps.length - 1}
                        step={1}
                        value={[textScaleStep]}
                        disabled={!textPreference.enabled}
                        onValueChange={([value]) => {
                          const nextStep = clampTextScaleStep(value ?? textScaleStep);
                          onTextPreferenceChange({ ...textPreference, enabled: true, step: nextStep });
                        }}
                        aria-label="텍스트 크기 조절"
                        className="relative z-10"
                      />
                    </div>
                    <span className="pointer-events-none shrink-0 basis-[2.25em] text-center text-[32px] leading-none text-[var(--axis-muted)]">가</span>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'strategyContext' ? (
              <section className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText size={17} className="text-[var(--axis-accent)]" />
                      <h2 className="axis-section-heading">맞춤 전략 자료</h2>
                    </div>
                    <p className="mt-2 max-w-2xl text-body-sm text-[var(--axis-muted)]">
                      입력한 내용을 반영해 카드뉴스의 대응방안을 우리 조직 관점으로 더 구체화합니다.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <input
                      ref={strategyFileInputRef}
                      type="file"
                      accept=".txt,.md,.csv,.json,.log,.pdf,.png,.jpg,.jpeg,.webp,text/*,application/pdf,application/json,image/*"
                      className="hidden"
                      onChange={(event) => void handleStrategyContextFileUpload(event.currentTarget.files?.[0])}
                    />
                    <ExecutiveButton
                      variant="secondary"
                      icon={<Upload size={16} />}
                      disabled={strategyContextStatus === 'loading'}
                      onClick={() => strategyFileInputRef.current?.click()}
                    >
                      파일 업로드
                    </ExecutiveButton>
                    <ExecutiveButton
                      variant="secondary"
                      icon={<History size={16} />}
                      onClick={() => setStrategyContextListOpen((current) => !current)}
                    >
                      저장된 자료 보기
                    </ExecutiveButton>
                  </div>
                </div>

                <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-heading-5 font-semibold text-[var(--axis-ink)]">전략 자료 입력</h3>
                      <p className="mt-1 text-caption leading-5 text-[var(--axis-muted)]">
                        뉴스·공시 등 외부 수집 정보만으로는 알 수 없는 우리 조직의 계획, 제품 로드맵, 제안 방향을 입력해 주세요.
                      </p>
                    </div>
                    <p className="max-w-[360px] shrink-0 text-right text-caption leading-5 text-[var(--axis-muted)]">
                      해당 내용은 LLM에 전달되어 분석 처리되오니 유의 바랍니다.
                    </p>
                  </div>
                  {strategyContextLoadStatus === 'loading' ? (
                    <div className="mt-3">
                      <ExecutiveBadge>저장된 자료를 불러오는 중</ExecutiveBadge>
                    </div>
                  ) : null}
                  {editingStrategyContextId || strategyContextFile ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {editingStrategyContextId ? <ExecutiveBadge tone="warning">수정 중</ExecutiveBadge> : null}
                      {strategyContextFile ? (
                        <ExecutiveBadge>
                          {strategyContextFile.fileName} · {formatFileSize(strategyContextFile.fileSize)}
                        </ExecutiveBadge>
                      ) : null}
                    </div>
                  ) : null}

                  <label htmlFor="strategy-context-input" className="sr-only">맞춤 전략 자료 컨텍스트</label>
                  <textarea
                    id="strategy-context-input"
                    value={strategyContext}
                    rows={10}
                    onChange={(event) => {
                      setStrategyContext(event.target.value);
                      setStrategyContextStatus('idle');
                      setStrategyContextMessage('');
                    }}
                    placeholder="예: 현재 준비 중인 제품·서비스, 개발 단계, 기존 기획 범위, 보완이 필요한 기능, 우선 적용 업무, 타깃 고객, 제안 방향, 조직의 강점, 파트너 협력 필요 영역 등을 입력하세요."
                    className="mt-4 min-h-[220px] w-full resize-y rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] px-4 py-3 text-body-sm leading-6 text-[var(--axis-ink)] outline-none transition placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite">
                    <ExecutiveButton
                      icon={<Save size={16} />}
                      disabled={strategyContextStatus === 'loading'}
                      onClick={() => void saveStrategyContext()}
                    >
                      {strategyContextStatus === 'loading' ? '처리 중' : editingStrategyContextId ? '수정 저장' : '저장'}
                    </ExecutiveButton>
                    <ExecutiveButton
                      variant="secondary"
                      icon={<X size={16} />}
                      disabled={strategyContextStatus === 'loading'}
                      onClick={clearStrategyContext}
                    >
                      입력 비우기
                    </ExecutiveButton>
                    {strategyContextMessage ? (
                      <ExecutiveBadge tone={strategyContextStatus === 'error' ? 'danger' : strategyContextStatus === 'loading' ? 'warning' : 'success'}>
                        {strategyContextMessage}
                      </ExecutiveBadge>
                    ) : null}
                  </div>
                </div>

                {strategyContextListOpen ? (
                  <div className="mt-5 rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-heading-5 font-semibold text-[var(--axis-ink)]">누적 전략 자료</h3>
                        <p className="mt-1 text-caption leading-5 text-[var(--axis-muted)]">
                          저장된 자료를 불러와 수정하거나 삭제할 수 있습니다.
                        </p>
                      </div>
                      <ExecutiveBadge>{strategyContextItems.length}건</ExecutiveBadge>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {strategyContextItems.length === 0 ? (
                        <div className="rounded-[var(--axis-radius-md)] border border-dashed border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-6 text-center text-body-sm text-[var(--axis-muted)]">
                          저장된 전략 자료가 없습니다.
                        </div>
                      ) : null}
                      {strategyContextItems.map((item) => (
                        <article
                          key={item.id}
                          className={`rounded-[var(--axis-radius-md)] border bg-[var(--axis-canvas)] p-4 transition ${
                            editingStrategyContextId === item.id
                              ? 'border-[var(--axis-accent)]'
                              : 'border-[var(--axis-hairline)]'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <ExecutiveBadge>{item.sourceType === 'uploaded_file' ? '파일' : '직접 입력'}</ExecutiveBadge>
                                <span className="text-caption-bold text-[var(--axis-muted)]">
                                  {formatStrategyContextTime(item.updatedAt)} 업데이트
                                </span>
                                {item.fileName ? (
                                  <span className="min-w-0 break-words text-caption text-[var(--axis-muted)]">
                                    {item.fileName}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 max-h-12 overflow-hidden break-words text-caption leading-5 text-[var(--axis-muted)]">
                                {strategyContextPreview(item.content)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <ExecutiveButton
                                variant="secondary"
                                icon={<Pencil size={15} />}
                                disabled={strategyContextStatus === 'loading'}
                                onClick={() => editStrategyContext(item)}
                              >
                                수정
                              </ExecutiveButton>
                              <ExecutiveButton
                                variant="ghost"
                                icon={<Trash2 size={15} />}
                                disabled={strategyContextStatus === 'loading'}
                                onClick={() => void deleteStrategyContext(item.id)}
                              >
                                삭제
                              </ExecutiveButton>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function AccessLogStatusPill({ item }: { item: AccessLogItem }) {
  const status = accessLogStatus(item);
  return (
    <span className={`inline-flex h-7 min-w-[3rem] items-center justify-center rounded-sm border px-2 text-caption-bold ${status.className}`}>
      {status.label}
    </span>
  );
}

function AccessLogPageButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-caption-bold transition ${
        isActive
          ? 'border-[var(--axis-accent)] bg-[var(--axis-accent)] text-white'
          : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] text-[var(--axis-body)] hover:border-[var(--axis-accent)] hover:text-[var(--axis-accent)]'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

