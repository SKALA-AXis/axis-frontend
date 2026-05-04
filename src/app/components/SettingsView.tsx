import { Bell, Clock3, KeyRound, MapPin, ShieldCheck, User, Wifi } from 'lucide-react';
import { useState } from 'react';

type SettingsTab = 'account' | 'history' | 'notifications';

type LoginHistoryItem = {
  id: string;
  date: string;
  time: string;
  country: string;
  ipAddress: string;
};

const loginHistory: LoginHistoryItem[] = [
  { id: '1', date: '2026.05.04', time: '09:14', country: '대한민국', ipAddress: '121.168.25.41' },
  { id: '2', date: '2026.05.03', time: '18:42', country: '대한민국', ipAddress: '121.168.25.41' },
  { id: '3', date: '2026.05.02', time: '08:57', country: '일본', ipAddress: '103.24.77.118' },
  { id: '4', date: '2026.05.01', time: '21:05', country: '미국', ipAddress: '34.201.11.82' },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    issueAlert: true,
    briefingAlert: true,
    marketingAlert: false,
    briefingTime: '08:30',
  });

  const tabs: Array<{ id: SettingsTab; label: string; icon: typeof User }> = [
    { id: 'account', label: '회원 정보', icon: User },
    { id: 'history', label: '로그인 이력', icon: ShieldCheck },
    { id: 'notifications', label: '알림 설정', icon: Bell },
  ];

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="axis-page-header">
          <h1 className="axis-page-title">회원 정보</h1>
          <p className="axis-page-subtitle">계정 정보, 로그인 이력, 알림 설정을 관리할 수 있습니다.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="axis-glass h-fit rounded-[1.15rem] bg-white/82 p-3">
            <nav className="flex gap-2 overflow-x-auto lg:flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-[0.95rem] px-4 py-3 text-left transition lg:w-full ${
                      isActive ? 'bg-[#ff7f00] text-white' : 'text-black/72 hover:bg-white/70'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="axis-glass rounded-[1.15rem] bg-white/82 p-4 sm:p-5">
            {activeTab === 'account' ? (
              <div className="space-y-8">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <User size={18} className="text-[#d96200]" />
                    <h2 className="axis-section-title">회원 정보</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="이름" defaultValue="Andrew Smith" />
                    <Field label="이메일" type="email" defaultValue="andrew.smith@skax.com" />
                    <Field label="부서" defaultValue="전략기획팀" />
                    <Field label="직책" defaultValue="Product Designer" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileSaved(true)}
                    className="mt-5 rounded-[0.8rem] bg-[#111111] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#ff7f00]"
                  >
                    회원 정보 저장
                  </button>
                  {profileSaved ? <p className="mt-2 text-xs text-[#d96200]">회원 정보가 저장되었습니다.</p> : null}
                </div>

                <div className="border-t border-black/8 pt-7">
                  <div className="mb-4 flex items-center gap-2">
                    <KeyRound size={18} className="text-[#E1002A]" />
                    <h2 className="axis-section-title">비밀번호 수정</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="현재 비밀번호" type="password" />
                    <div />
                    <Field label="새 비밀번호" type="password" />
                    <Field label="새 비밀번호 확인" type="password" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setPasswordSaved(true)}
                    className="mt-5 rounded-[0.8rem] bg-[#E1002A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#ff7f00]"
                  >
                    비밀번호 변경
                  </button>
                  {passwordSaved ? <p className="mt-2 text-xs text-[#E1002A]">비밀번호 변경 요청이 저장되었습니다.</p> : null}
                </div>
              </div>
            ) : null}

            {activeTab === 'history' ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#d96200]" />
                  <h2 className="axis-section-title">로그인 이력</h2>
                </div>
                <p className="mb-5 text-sm text-black/56">최근 로그인 기록을 날짜, 시간, 국가, IP 주소 기준으로 확인할 수 있습니다.</p>

                <div className="overflow-hidden rounded-[1rem] border border-black/8 bg-white/72">
                  <div className="grid grid-cols-4 gap-3 border-b border-black/8 bg-[#f5f6fa] px-4 py-3 text-xs font-semibold text-black/58">
                    <span>날짜</span>
                    <span>시간</span>
                    <span>나라</span>
                    <span>IP 주소</span>
                  </div>

                  <div className="divide-y divide-black/6">
                    {loginHistory.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-3 px-4 py-3 text-sm text-black/80">
                        <span>{item.date}</span>
                        <span>{item.time}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#d96200]" />
                          {item.country}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-black/72">
                          <Wifi size={14} className="text-[#d96200]" />
                          {item.ipAddress}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'notifications' ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-[#d96200]" />
                  <h2 className="axis-section-title">알림 설정</h2>
                </div>
                <p className="mb-5 text-sm text-black/56">알림 수신 여부와 브리핑 발송 시간을 설정할 수 있습니다.</p>

                <div className="space-y-3">
                  <ToggleCard
                    title="긴급 이슈 알림"
                    description="중요도가 높은 이슈 발생 시 알림을 수신합니다."
                    checked={notificationSettings.issueAlert}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, issueAlert: checked }))}
                  />
                  <ToggleCard
                    title="브리핑 알림"
                    description="일간 브리핑 발송 시 알림을 수신합니다."
                    checked={notificationSettings.briefingAlert}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, briefingAlert: checked }))}
                  />
                  <ToggleCard
                    title="서비스 안내 알림"
                    description="새 기능 또는 운영 안내 알림을 수신합니다."
                    checked={notificationSettings.marketingAlert}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, marketingAlert: checked }))}
                  />
                </div>

                <div className="mt-5 rounded-[1rem] border border-black/8 bg-white/78 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock3 size={16} className="text-[#d96200]" />
                    <h3 className="text-sm font-semibold text-black/88">브리핑 시간 설정</h3>
                  </div>
                  <p className="mb-3 text-xs text-black/54">브리핑 알림이 켜져 있을 때 적용됩니다.</p>
                  <input
                    type="time"
                    value={notificationSettings.briefingTime}
                    onChange={(event) =>
                      setNotificationSettings((current) => ({
                        ...current,
                        briefingTime: event.target.value,
                      }))
                    }
                    className="axis-input h-10 rounded-[0.8rem] px-4 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setNotificationSaved(true)}
                  className="mt-5 rounded-[0.8rem] bg-[#111111] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#ff7f00]"
                >
                  알림 설정 저장
                </button>
                {notificationSaved ? <p className="mt-2 text-xs text-[#d96200]">알림 설정이 저장되었습니다.</p> : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = 'text',
}: {
  label: string;
  defaultValue?: string;
  type?: 'text' | 'email' | 'password';
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-black/82">{label}</label>
      <input type={type} defaultValue={defaultValue} className="axis-input h-10 w-full rounded-[0.8rem] px-4 text-sm" />
    </div>
  );
}

function ToggleCard({
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
    <label className="flex items-center justify-between gap-4 rounded-[1rem] border border-black/8 bg-white/78 px-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-black/88">{title}</p>
        <p className="mt-1 text-xs text-black/54">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? 'bg-[#ff7f00]' : 'bg-black/14'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}
