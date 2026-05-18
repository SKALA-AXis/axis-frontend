import { Activity, Database, FileText, Gauge, History, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import {
  ExecutiveBadge,
  ExecutiveButton,
  ExecutiveContainer,
  ExecutiveHeader,
  ExecutiveMetric,
  ExecutivePage,
} from '../../../shared/ui/ExecutiveSystem';
import {
  mockAdminAuditLogs,
  mockAdminPeers,
  mockAdminPrompts,
  mockAdminSchedulerJobs,
  mockAdminSources,
} from '../../../shared/mocks/admin';

type AdminTab = 'peers' | 'sources' | 'prompts' | 'scheduler' | 'usage' | 'audit';

const tabs: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
  { id: 'peers', label: 'Peer사', icon: Users },
  { id: 'sources', label: '데이터 소스', icon: Database },
  { id: 'prompts', label: '프롬프트', icon: FileText },
  { id: 'scheduler', label: '스케줄러', icon: Activity },
  { id: 'usage', label: '사용량', icon: Gauge },
  { id: 'audit', label: '감사 로그', icon: History },
];

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('peers');

  return (
    <ExecutivePage>
      <ExecutiveContainer className="pb-24">
        <ExecutiveHeader
          eyebrow="Admin console"
          title="관리자"
          subtitle="OpenAPI Admin 도메인의 Peer, 소스, 프롬프트, 스케줄러, 사용량, 감사 로그를 운영합니다."
          actions={<ExecutiveButton icon={<Settings size={16} />}>운영 설정 저장</ExecutiveButton>}
        />

        <section className="grid gap-3 md:grid-cols-4">
          <ExecutiveMetric label="Active peers" value={mockAdminPeers.length} helper="모니터링 대상" />
          <ExecutiveMetric label="Sources" value={mockAdminSources.length} helper="수집 채널" tone="success" />
          <ExecutiveMetric label="Prompt version" value="v3.0" helper="Evidence pipeline" tone="accent" />
          <ExecutiveMetric label="Budget used" value="23.5%" helper="today" tone="warning" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="axis-panel-flat h-fit p-3">
            <nav className="flex gap-2 overflow-x-auto xl:flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-3 rounded-[var(--axis-radius-md)] px-4 py-3 text-left transition xl:w-full ${
                      isActive ? 'bg-[var(--axis-navy)] text-white' : 'text-[var(--axis-body)] hover:bg-white'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="axis-panel-flat overflow-hidden p-5">
            {activeTab === 'peers' ? <AdminTable title="모니터링 대상 Peer사" rows={mockAdminPeers} /> : null}
            {activeTab === 'sources' ? <AdminTable title="데이터 소스·크롤러" rows={mockAdminSources} /> : null}
            {activeTab === 'prompts' ? <AdminTable title="프롬프트 템플릿" rows={mockAdminPrompts} /> : null}
            {activeTab === 'scheduler' ? <AdminTable title="스케줄러 작업" rows={mockAdminSchedulerJobs} /> : null}
            {activeTab === 'usage' ? <UsagePanel /> : null}
            {activeTab === 'audit' ? <AdminTable title="감사 로그" rows={mockAdminAuditLogs} /> : null}
          </main>
        </section>
      </ExecutiveContainer>
    </ExecutivePage>
  );
}

function AdminTable({ title, rows }: { title: string; rows: Array<Record<string, string | number>> }) {
  const columns = Object.keys(rows[0] ?? {});

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Operations</p>
          <h2 className="axis-section-heading mt-1">{title}</h2>
        </div>
        <ExecutiveBadge>OpenAPI admin</ExecutiveBadge>
      </div>
      <div className="overflow-x-auto rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-white">
        <table className="axis-data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {columns.map((column) => (
                  <td key={column}>
                    {column === 'status' ? (
                      <ExecutiveBadge tone={row[column] === 'active' ? 'success' : 'warning'}>{row[column]}</ExecutiveBadge>
                    ) : (
                      row[column]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsagePanel() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="axis-kicker">Usage</p>
          <h2 className="axis-section-heading mt-1">API 비용·토큰 사용량</h2>
        </div>
        <ExecutiveBadge tone="warning">FR Admin Usage</ExecutiveBadge>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <ExecutiveMetric label="Tokens" value="12,500" helper="today" />
        <ExecutiveMetric label="Cost" value="18,500원" helper="OpenAI provider" tone="warning" />
        <ExecutiveMetric label="API calls" value="64" helper="today" tone="accent" />
        <ExecutiveMetric label="Budget" value="23.5%" helper="used" tone="success" />
      </div>
    </section>
  );
}
