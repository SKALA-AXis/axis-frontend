import { Bell, Clock3, KeyRound, LayoutDashboard, LogOut, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutivePage,
} from '../../../app/components/executive/ExecutiveSystem';
import {
  getStoredContentViewMode,
  setStoredContentViewMode,
  type ContentViewMode,
} from '../../../shared/config/viewPreferences';
import { mockLoginHistory } from '../../../shared/mocks/userSettings';

type SettingsTab = 'account' | 'view' | 'history' | 'notifications';

export function SettingsView({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [profileSaved, setProfileSaved] = useState(false);
  const [contentViewMode, setContentViewMode] = useState<ContentViewMode>(getStoredContentViewMode);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    inApp: true,
    msTeams: false,
    briefingTime: '08:30',
    eventImmediate: true,
  });

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: 'account', label: '회원 정보', icon: User },
    { id: 'view', label: '기본 보기', icon: LayoutDashboard },
    { id: 'history', label: '접속 로그', icon: ShieldCheck },
    { id: 'notifications', label: '알림 설정', icon: Bell },
  ];

  const updateContentViewMode = (mode: ContentViewMode) => {
    setContentViewMode(mode);
    setStoredContentViewMode(mode);
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
                  <Field label="이름" defaultValue="Andrew Smith" />
                  <Field label="이메일" type="email" defaultValue="andrew.smith@skax.com" />
                  <Field label="부서" defaultValue="Corporate Strategy" />
                  <Field label="역할" defaultValue="strategist" />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <ExecutiveButton onClick={() => setProfileSaved(true)}>회원 정보 저장</ExecutiveButton>
                  <ExecutiveButton variant="secondary" icon={<KeyRound size={16} />}>비밀번호 변경</ExecutiveButton>
                  {profileSaved ? <ExecutiveBadge tone="success">저장되었습니다</ExecutiveBadge> : null}
                </div>
              </section>
            ) : null}

            {activeTab === 'view' ? (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard size={17} className="text-[var(--axis-accent)]" />
                    <h2 className="axis-section-heading">본문 기본 보기</h2>
                  </div>
                  <ExecutiveBadge tone="accent">기본값: 도형위주</ExecutiveBadge>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--axis-muted)]">
                  브리핑, 인사이트, Peer+의 핵심 내용을 줄글 중심으로 볼지, 도형과 관계 중심으로 압축해서 볼지 선택합니다.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => updateContentViewMode('visual')}
                    className={`rounded-[var(--axis-radius-lg)] border p-5 text-left transition ${
                      contentViewMode === 'visual'
                        ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)]'
                        : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] hover:border-[var(--axis-accent)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(220,90,36,0.14)] text-sm font-black text-[var(--axis-accent-strong)]">
                        01
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[var(--axis-ink)]">도형위주</p>
                        <p className="mt-1 text-sm text-[var(--axis-muted)]">관계, 흐름, 핵심 판단을 도형 카드로 먼저 봅니다.</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateContentViewMode('text')}
                    className={`rounded-[var(--axis-radius-lg)] border p-5 text-left transition ${
                      contentViewMode === 'text'
                        ? 'border-[var(--axis-accent)] bg-[rgba(220,90,36,0.10)]'
                        : 'border-[var(--axis-hairline)] bg-[var(--axis-surface)] hover:border-[var(--axis-accent)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-surface-muted)] text-sm font-black text-[var(--axis-ink)]">
                        Aa
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[var(--axis-ink)]">본문위주</p>
                        <p className="mt-1 text-sm text-[var(--axis-muted)]">현재처럼 상세 문장을 충분히 읽는 구성을 유지합니다.</p>
                      </div>
                    </div>
                  </button>
                </div>
              </section>
            ) : null}

            {activeTab === 'history' ? (
              <section className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={17} className="text-[var(--axis-accent)]" />
                    <h2 className="axis-section-heading">접속 로그</h2>
                  </div>
                  <ExecutiveBadge>FR-043</ExecutiveBadge>
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
                      {mockLoginHistory.map((item) => (
                        <tr key={item.id}>
                          <td>{item.date} {item.time}</td>
                          <td>{item.action}</td>
                          <td>{item.country}</td>
                          <td>{item.ipAddress}</td>
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
                  <ExecutiveBadge>FR-041</ExecutiveBadge>
                </div>

                <div className="mt-5 grid gap-3">
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
              </section>
            ) : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
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
