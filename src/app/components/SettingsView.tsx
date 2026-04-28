import { User, Bell, Shield, Globe } from 'lucide-react';
import { useState } from 'react';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'notifications', label: '알림 설정', icon: Bell },
    { id: 'security', label: '보안', icon: Shield },
    { id: 'preferences', label: '환경 설정', icon: Globe },
  ];

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-black sm:text-3xl">설정</h1>
          <p className="text-neutral-600">계정 및 시스템 환경 설정</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
              <nav className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 transition-colors lg:w-full ${
                        activeTab === tab.id
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'preferences' && <PreferencesSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-4">프로필 정보</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-black mb-2">이름</label>
          <input type="text" defaultValue="SK AX User" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">직책</label>
          <input type="text" defaultValue="전략기획 담당자" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">이메일</label>
        <input type="email" defaultValue="user@sk.com" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">부서</label>
        <input type="text" defaultValue="사업전략팀" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
      </div>

      <button
        onClick={() => setSaved(true)}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        변경사항 저장
      </button>
      {saved && <p className="text-sm text-green-700">프로필 변경사항이 저장되었습니다.</p>}
    </div>
  );
}

function NotificationSettings() {
  const [dailyBriefingTime, setDailyBriefingTime] = useState('08:30');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-4">알림 설정</h2>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-black">긴급 이슈 즉시 알림</p>
            <p className="text-sm text-neutral-600">긴급 중요도 이슈 발생 시 등록된 이메일로 즉시 전송</p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
        </label>

        <div className="p-4 border border-neutral-200 rounded-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-black">일간 브리핑</p>
              <p className="text-sm text-neutral-600">매일 설정한 시간에 이메일 브리핑 전송</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <label className="block text-sm font-medium text-black mb-2">브리핑 전송 시간</label>
            <input
              type="time"
              value={dailyBriefingTime}
              onChange={(event) => setDailyBriefingTime(event.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
            />
          </div>
        </div>

        <label className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-black">주간 요약</p>
            <p className="text-sm text-neutral-600">매주 월요일 이메일로 주간 동향 요약 전송</p>
          </div>
          <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
        </label>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-4">보안 설정</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">현재 비밀번호</label>
        <input type="password" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">새 비밀번호</label>
        <input type="password" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">새 비밀번호 확인</label>
        <input type="password" className="w-full px-4 py-2 border border-neutral-300 rounded-lg" />
      </div>

      <button
        onClick={() => setRequested(true)}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        비밀번호 변경
      </button>
      {requested && <p className="text-sm text-green-700">비밀번호 변경 요청이 접수되었습니다.</p>}

      <div className="pt-6 border-t border-neutral-200">
        <h3 className="font-bold text-black mb-3">로그인 이력</h3>
        <div className="space-y-2">
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-black">2026-04-22 09:30 · 서울, 한국</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-black">2026-04-21 08:15 · 서울, 한국</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  const defaultReasoningPrompt =
    '이슈의 사업 연관성, 고객군 중복 가능성, 확산 신호를 근거 중심으로 정리하세요. 추정은 명확히 구분하고 원문에서 확인 가능한 내용만 판단 근거로 사용하세요.';
  const defaultImplicationPrompt =
    'SK AX 관점에서 전략적 중요도, 시장 영향, 검토 질문을 도출하세요. 경쟁사 메시지와 SK AX의 대응 포인트가 분리되어 보이도록 작성하세요.';
  const [saved, setSaved] = useState(false);
  const [reasoningPrompt, setReasoningPrompt] = useState(defaultReasoningPrompt);
  const [implicationPrompt, setImplicationPrompt] = useState(defaultImplicationPrompt);

  const resetPrompts = () => {
    setReasoningPrompt(defaultReasoningPrompt);
    setImplicationPrompt(defaultImplicationPrompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-black">환경 설정</h2>
        <button
          onClick={resetPrompts}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          초기값으로 복원
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">판단 근거 프롬프트</label>
        <textarea
          value={reasoningPrompt}
          onChange={(event) => setReasoningPrompt(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">시사점 프롬프트</label>
        <textarea
          value={implicationPrompt}
          onChange={(event) => setImplicationPrompt(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
        />
      </div>

      <button
        onClick={() => setSaved(true)}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        변경사항 저장
      </button>
      {saved && <p className="text-sm text-green-700">환경 설정이 저장되었습니다.</p>}
    </div>
  );
}
