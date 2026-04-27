import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAlerts } from '../../features/alerts/hooks/useAlerts';
import type { AlertRule } from '../../features/alerts/model/alert';
import { uiText } from '../../shared/content/uiText';

export function AlertsView() {
  const { alertsData, isLoading, error } = useAlerts();
  const [activeTab, setActiveTab] = useState<'history' | 'rules'>('history');
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  const toggleChannel = (channel: string) => {
    if (!selectedRule) {
      return;
    }
    const nextChannels = selectedRule.channels.includes(channel)
      ? selectedRule.channels.filter((selectedChannel) => selectedChannel !== channel)
      : [...selectedRule.channels, channel];
    setSelectedRule({ ...selectedRule, channels: nextChannels });
  };

  const openNewRule = () => {
    const fallback = alertsData?.conditionOptions[0] ?? '';
    setSelectedRule({
      id: 'RULE-NEW',
      name: uiText.alerts.newRuleName,
      description: fallback,
      enabled: false,
      channels: ['dashboard'],
      lastTriggered: new Date().toISOString(),
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{uiText.alerts.pageTitle}</h1>
              <p className="text-neutral-600">{uiText.alerts.pageSubtitle}</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{uiText.common.loadError}</div>}
        {isLoading && !alertsData ? <div className="mb-6 text-sm text-neutral-500">{uiText.common.loading}</div> : null}

        {alertsData ? (
          <>
            <div className="mb-6 flex gap-2 border-b border-neutral-200">
              <button onClick={() => setActiveTab('history')} className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-600 hover:text-black'
              }`}>
                {uiText.alerts.historyTab}
              </button>
              <button onClick={() => setActiveTab('rules')} className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rules' ? 'border-orange-600 text-orange-600' : 'border-transparent text-neutral-600 hover:text-black'
              }`}>
                {uiText.alerts.rulesTab}
              </button>
            </div>

            {activeTab === 'history' && (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">
                  <div className="bg-white border border-neutral-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-black mb-4">{uiText.alerts.historyTitle}</h2>
                    <div className="space-y-3">
                      {alertsData.history.map((alert) => (
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
                                  {alert.status === 'sent' ? uiText.alerts.sent : uiText.alerts.pending}
                                </span>
                                <span className="text-xs text-neutral-500">{alert.channel}</span>
                                <span className="text-xs text-neutral-400">· {new Date(alert.triggeredAt).toLocaleString('ko-KR')}</span>
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
                    <h2 className="text-lg font-bold text-black mb-4">{uiText.alerts.rulesTitle}</h2>
                    <div className="space-y-3">
                      {alertsData.rules.map((rule) => (
                        <div key={rule.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-black">{rule.name}</h3>
                                {rule.enabled ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">{uiText.alerts.enabled}</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">{uiText.alerts.disabled}</span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mb-2">{rule.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {rule.channels.map((channel) => (
                                  <span key={channel} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">{channel}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500 mt-2">{uiText.alerts.lastTriggered}: {new Date(rule.lastTriggered).toLocaleString('ko-KR')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-5">
                  {selectedRule ? (
                    <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
                      <h2 className="mb-4 text-lg font-bold text-black">{uiText.alerts.ruleEditorTitle}</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.alerts.ruleName}</label>
                          <input value={selectedRule.name} onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.alerts.condition}</label>
                          <div className="flex flex-wrap gap-2">
                            {alertsData.conditionOptions.map((option) => (
                              <button key={option} onClick={() => setSelectedRule({ ...selectedRule, description: option })} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                selectedRule.description === option ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`} aria-pressed={selectedRule.description === option}>
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.alerts.channel}</label>
                          <div className="flex flex-wrap gap-2">
                            {alertsData.channelOptions.map((channel) => (
                              <button key={channel} onClick={() => toggleChannel(channel)} className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                selectedRule.channels.includes(channel) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`} aria-pressed={selectedRule.channels.includes(channel)}>
                                {channel}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">{uiText.alerts.saveRule}</button>
                          <button onClick={() => setSelectedRule(null)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">{uiText.common.cancel}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                      <p className="font-bold text-black">{uiText.alerts.emptyRuleTitle}</p>
                      <p className="mt-2 text-sm text-neutral-600">{uiText.alerts.emptyRuleBody}</p>
                      <button onClick={openNewRule} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                        <Plus size={16} />
                        {uiText.alerts.addRule}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
