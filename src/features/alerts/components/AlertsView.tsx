import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import type { AlertRule } from '../model/alert';
import { uiText } from '../../../shared/content/uiText';

export function AlertsView() {
  const { alertsData, isLoading, error } = useAlerts();
  const [activeTab, setActiveTab] = useState<'history' | 'rules'>('history');
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  const openNewRule = () => {
    const fallback = alertsData?.conditionOptions[0] ?? '';
    setSelectedRule({
      id: 'RULE-NEW',
      name: uiText.alerts.newRuleName,
      description: fallback,
      enabled: false,
      channels: ['email'],
      lastTriggered: new Date().toISOString(),
    });
  };

  return (
    <div className="axis-page flex-1 overflow-auto">
      <div className="p-3 sm:p-4 lg:p-5">
        <div className="axis-page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="axis-page-title">{uiText.alerts.pageTitle}</h1>
              <p className="axis-page-subtitle">{uiText.alerts.pageSubtitle}</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{uiText.common.loadError}</div>}
        {isLoading && !alertsData ? <div className="mb-6 text-sm text-neutral-500">{uiText.common.loading}</div> : null}

        {alertsData ? (
          <>
            <div className="mb-6 flex gap-2 ">
              <button onClick={() => setActiveTab('history')} className={`axis-tab ${
                activeTab === 'history' ? 'border-action text-action' : ''
              }`}>
                {uiText.alerts.historyTab}
              </button>
              <button onClick={() => setActiveTab('rules')} className={`axis-tab ${
                activeTab === 'rules' ? 'border-action text-action' : ''
              }`}>
                {uiText.alerts.rulesTab}
              </button>
            </div>

            {activeTab === 'history' && (
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-12">
                  <div className="axis-panel p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-black mb-4">{uiText.alerts.historyTitle}</h2>
                    <div className="space-y-3">
                      {alertsData.history.map((alert) => (
                        <div key={alert.id} className="axis-panel-vivid p-4 transition-colors hover:border-action/28">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action/10">
                              <Bell size={16} className="text-action" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-black mb-1">{alert.title}</h3>
                              <p className="text-sm text-neutral-600 mb-2">{alert.message}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  {alert.status === 'sent' ? uiText.alerts.sent : uiText.alerts.pending}
                                </span>
                                <span className="text-xs text-neutral-500">이메일</span>
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
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="axis-panel p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-black mb-4">{uiText.alerts.rulesTitle}</h2>
                    <div className="space-y-3">
                      {alertsData.rules.map((rule) => (
                        <div key={rule.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-black">{rule.name}</h3>
                                {rule.enabled ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">{uiText.alerts.enabled}</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">{uiText.alerts.disabled}</span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mb-2">{rule.description}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded border border-action/20 bg-action/10 px-2 py-1 text-xs text-action">이메일</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500 mt-2">{uiText.alerts.lastTriggered}: {new Date(rule.lastTriggered).toLocaleString('ko-KR')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  {selectedRule ? (
                    <div className="axis-glass mb-6 rounded-xl bg-white/82 p-4 sm:p-6">
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
                                selectedRule.description === option ? 'border-action bg-action/10 text-action' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                              }`} aria-pressed={selectedRule.description === option}>
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-black">{uiText.alerts.channel}</label>
                          <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">이메일</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button className="flex-1 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-primary-deep">{uiText.alerts.saveRule}</button>
                          <button onClick={() => setSelectedRule(null)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">{uiText.common.cancel}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="axis-panel border border-dashed border-neutral-300 bg-white/82 p-8 text-center">
                      <p className="font-bold text-black">{uiText.alerts.emptyRuleTitle}</p>
                      <p className="mt-2 text-sm text-neutral-600">{uiText.alerts.emptyRuleBody}</p>
                      <button onClick={openNewRule} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-urgent px-4 py-2 text-sm font-medium text-white hover:bg-primary-deep">
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
