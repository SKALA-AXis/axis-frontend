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
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">설정</h1>
          <p className="text-neutral-600">계정 및 시스템 환경 설정</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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

          <div className="col-span-9">
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
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

      <div className="grid grid-cols-2 gap-4">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-4">알림 설정</h2>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
          <div>
            <p className="font-medium text-black">긴급 이슈 즉시 알림</p>
            <p className="text-sm text-neutral-600">긴급 중요도 이슈 발생 시 즉시 알림</p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
        </label>

        <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
          <div>
            <p className="font-medium text-black">일간 브리핑</p>
            <p className="text-sm text-neutral-600">매일 아침 8시 30분 브리핑 전송</p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-600 rounded" />
        </label>

        <label className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
          <div>
            <p className="font-medium text-black">주간 요약</p>
            <p className="text-sm text-neutral-600">매주 월요일 주간 동향 요약</p>
          </div>
          <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">알림 채널</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-600 rounded" />
            <span className="text-sm">이메일</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-600 rounded" />
            <span className="text-sm">Slack</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" />
            <span className="text-sm">Dashboard</span>
          </label>
        </div>
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
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-4">환경 설정</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">언어</label>
        <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg">
          <option>한국어</option>
          <option>English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">시간대</label>
        <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg">
          <option>Asia/Seoul (UTC+9)</option>
          <option>America/New_York (UTC-5)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">대시보드 레이아웃</label>
        <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg">
          <option>기본</option>
          <option>컴팩트</option>
          <option>확장</option>
        </select>
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
