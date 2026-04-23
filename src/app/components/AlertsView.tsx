import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';

type AlertRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  last_triggered: string;
};

const mockAlertRules: AlertRule[] = [
  {
    id: 'RULE-001',
    name: '긴급 이슈 즉시 알림',
    description: '중요도가 긴급인 이슈 발생 시 즉시 Slack 알림',
    enabled: true,
    channels: ['slack', 'email'],
    last_triggered: '2026-04-22T09:15:00Z',
  },
  {
    id: 'RULE-002',
    name: 'Agentic AI/산업 AX 알림',
    description: 'Agentic AI, 제조 AX, 금융 AX 키워드 포함 시 알림',
    enabled: true,
    channels: ['email'],
    last_triggered: '2026-04-22T08:30:00Z',
  },
  {
    id: 'RULE-003',
    name: '파트너십 & M&A',
    description: '파트너십, M&A 이벤트 타입 알림',
    enabled: false,
    channels: ['dashboard'],
    last_triggered: '2026-04-20T14:20:00Z',
  },
];

const mockAlertHistory = [
  {
    id: 'ALERT-001',
    title: '[전략 검토] 삼성SDS - 제조 AX 레퍼런스 확대',
    message: '삼성SDS가 생성형 AI 운영 플랫폼을 제조/금융 고객 레퍼런스로 확장했습니다.',
    channel: 'slack',
    status: 'sent',
    triggered_at: '2026-04-22T09:15:00Z',
  },
  {
    id: 'ALERT-002',
    title: '[영업 공유] LG CNS - 금융 AI 보안 패키지',
    message: 'LG CNS가 금융권 대상 AI+클라우드 보안 패키지를 출시했습니다.',
    channel: 'email',
    status: 'sent',
    triggered_at: '2026-04-21T17:30:00Z',
  },
];

const alertConditionOptions = [
  '중요도가 긴급인 이슈 발생 시 즉시 알림',
  'Agentic AI, 제조 AX, 금융 AX 키워드 포함 시 알림',
  '파트너십, M&A 이벤트 타입 알림',
  '특정 Peer사 신규 이슈 수집 시 알림',
  '보고서 생성이 완료되면 알림',
];

const channelOptions = ['slack', 'email', 'dashboard'];

export function AlertsView() {
  const [activeTab, setActiveTab] = useState<'history' | 'rules'>('history');
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  const toggleChannel = (channel: string) => {
    if (!selectedRule) {
      return;
    }

    const nextChannels = selectedRule.channels.includes(channel)
      ? selectedRule.channels.filter((selectedChannel) => selectedChannel !== channel)
      : [...selectedRule.channels, channel];

    setSelectedRule({
      ...selectedRule,
      channels: nextChannels,
    });
  };

  const openNewRule = () => {
    setSelectedRule({
      id: 'RULE-NEW',
      name: '새 알림 규칙',
      description: alertConditionOptions[0],
      enabled: false,
      channels: ['dashboard'],
      last_triggered: new Date().toISOString(),
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">알림 센터</h1>
              <p className="text-neutral-600">알림 이력 확인과 발송 규칙 관리</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            알림 이력
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-neutral-600 hover:text-black'
            }`}
          >
            알림 규칙
          </button>
        </div>

        {activeTab === 'history' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12">
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-black mb-4">최근 알림 이력</h2>
                <div className="space-y-3">
                  {mockAlertHistory.map((alert) => (
                    <div key={alert.id} className="border border-neutral-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bell size={16} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-black mb-1">{alert.title}</h3>
                          <p className="text-sm text-neutral-600 mb-2">{alert.message}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                              {alert.status === 'sent' ? '전송 완료' : '대기 중'}
                            </span>
                            <span className="text-xs text-neutral-500">{alert.channel}</span>
                            <span className="text-xs text-neutral-400">
                              · {new Date(alert.triggered_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-black mb-4">알림 규칙</h2>
                <div className="space-y-3">
                  {mockAlertRules.map((rule) => (
                    <div key={rule.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-black">{rule.name}</h3>
                            {rule.enabled ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">활성</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">비활성</span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">{rule.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {rule.channels.map((channel) => (
                              <span key={channel} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 mt-2">
                        마지막 발동: {new Date(rule.last_triggered).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-5">
              {selectedRule ? (
              <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-black">새 알림 규칙</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">규칙명</label>
                    <input
                      value={selectedRule.name}
                      onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">알림 조건</label>
                    <div className="flex flex-wrap gap-2">
                      {alertConditionOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedRule({ ...selectedRule, description: option })}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedRule.description === option
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                          aria-pressed={selectedRule.description === option}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">발송 채널</label>
                    <div className="flex flex-wrap gap-2">
                      {channelOptions.map((channel) => (
                        <button
                          key={channel}
                          onClick={() => toggleChannel(channel)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedRule.channels.includes(channel)
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                          aria-pressed={selectedRule.channels.includes(channel)}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                      규칙 저장
                    </button>
                    <button
                      onClick={() => setSelectedRule(null)}
                      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                  <p className="font-bold text-black">새 규칙을 추가해보세요</p>
                  <p className="mt-2 text-sm text-neutral-600">
                    알림 조건과 발송 채널을 선택해 알림 발송 기준을 설정할 수 있습니다.
                  </p>
                  <button
                    onClick={openNewRule}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    <Plus size={16} />
                    새 규칙 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
