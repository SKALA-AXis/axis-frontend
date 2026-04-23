import { Users, Database, Activity, Settings, PlayCircle, PauseCircle } from 'lucide-react';
import { useState } from 'react';

export function AdminView() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: '사용자 관리', icon: Users },
    { id: 'pipeline', label: '파이프라인', icon: Activity },
    { id: 'sources', label: '크롤링 소스', icon: Database },
    { id: 'archives', label: '원문 아카이브', icon: Database },
    { id: 'audit', label: '감사 로그', icon: Settings },
    { id: 'system', label: '시스템 설정', icon: Settings },
  ];

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">관리자</h1>
          <p className="text-neutral-600">시스템 운영 및 사용자 관리</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 border-b border-neutral-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-neutral-600 hover:text-black'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'pipeline' && <PipelineManagement />}
        {activeTab === 'sources' && <SourceManagement />}
        {activeTab === 'archives' && <ArchiveManagement />}
        {activeTab === 'audit' && <AuditLog />}
        {activeTab === 'system' && <SystemSettings />}
      </div>
    </div>
  );
}

function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const users = [
    { id: '1', name: '김전략', email: 'strategy@sk.com', role: 'strategist', status: 'active' },
    { id: '2', name: '이분석', email: 'analyst@sk.com', role: 'analyst', status: 'active' },
    { id: '3', name: '박관리', email: 'admin@sk.com', role: 'admin', status: 'active' },
    { id: '4', name: '최대기', email: 'pending@sk.com', role: 'viewer', status: 'pending_approval' },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-black">사용자 목록</h2>
        <button
          onClick={() => {
            setIsInviting(true);
            setSelectedUser(null);
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          새 사용자 초대
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">이름</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">이메일</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">역할</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">상태</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm text-black">{user.name}</td>
                <td className="py-3 px-4 text-sm text-neutral-600">{user.email}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {user.status === 'active' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">활성</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">승인대기</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsInviting(false);
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isInviting || selectedUser) && (
        <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h3 className="mb-4 font-bold text-black">{isInviting ? '새 사용자 초대' : '사용자 정보 수정'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              defaultValue={selectedUser?.name}
              placeholder="이름"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              defaultValue={selectedUser?.email}
              placeholder="이메일"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <select defaultValue={selectedUser?.role || 'viewer'} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
              <option value="viewer">viewer</option>
              <option value="analyst">analyst</option>
              <option value="strategist">strategist</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <button className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700">
            {isInviting ? '초대 저장' : '변경사항 저장'}
          </button>
        </div>
      )}
    </div>
  );
}

function PipelineManagement() {
  const [manualRun, setManualRun] = useState<string | null>(null);

  const pipelines = [
    { name: 'Collection', status: 'running', lastRun: '2026-04-22 10:15', success: 247, failed: 3 },
    { name: 'Analysis', status: 'idle', lastRun: '2026-04-22 09:30', success: 38, failed: 0 },
    { name: 'Delivery', status: 'idle', lastRun: '2026-04-22 08:30', success: 1, failed: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {pipelines.map((pipeline) => (
          <div key={pipeline.name} className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-black mb-1">{pipeline.name}</h3>
                <p className="text-xs text-neutral-500">마지막 실행: {pipeline.lastRun}</p>
              </div>
              {pipeline.status === 'running' ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                  <PlayCircle size={12} />
                  실행중
                </span>
              ) : (
                <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded flex items-center gap-1">
                  <PauseCircle size={12} />
                  대기
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">성공</span>
                <span className="text-green-600 font-medium">{pipeline.success}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">실패</span>
                <span className="text-red-600 font-medium">{pipeline.failed}</span>
              </div>
            </div>

            <button
              onClick={() => setManualRun(pipeline.name)}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              수동 실행
            </button>
            {manualRun === pipeline.name && (
              <p className="mt-3 rounded bg-green-50 px-3 py-2 text-xs text-green-700">수동 실행 대기열에 추가됨</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-black mb-4">최근 실행 이력</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-black">Collection Pipeline</p>
              <p className="text-xs text-neutral-500">2026-04-22 10:15 - 10:18</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">성공</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-black">Analysis Pipeline</p>
              <p className="text-xs text-neutral-500">2026-04-22 09:30 - 09:45</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">성공</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceManagement() {
  const [selectedSource, setSelectedSource] = useState<{ name: string; type: string; tier: number; active: boolean } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sources = [
    { id: '1', name: 'Naver News API', type: 'news_api', tier: 1, active: true, lastCollected: '10분 전' },
    { id: '2', name: 'DART RSS', type: 'rss', tier: 2, active: true, lastCollected: '1시간 전' },
    { id: '3', name: 'JobKorea Crawl', type: 'job_posting', tier: 3, active: false, lastCollected: '3일 전' },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-black">크롤링 소스</h2>
        <button
          onClick={() => {
            setIsAdding(true);
            setSelectedSource(null);
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          소스 추가
        </button>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="border border-neutral-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-black">{source.name}</h3>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                    Tier {source.tier}
                  </span>
                  {source.active ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">활성</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">비활성</span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 mb-1">유형: {source.type}</p>
                <p className="text-xs text-neutral-500">마지막 수집: {source.lastCollected}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSource(source);
                  setIsAdding(false);
                }}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                설정
              </button>
            </div>
          </div>
        ))}
      </div>

      {(isAdding || selectedSource) && (
        <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h3 className="mb-4 font-bold text-black">{isAdding ? '소스 추가' : '소스 설정'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              defaultValue={selectedSource?.name}
              placeholder="소스명"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              defaultValue={selectedSource?.type}
              placeholder="유형"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              defaultValue={selectedSource?.tier || 1}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700">
            소스 저장
          </button>
        </div>
      )}
    </div>
  );
}

function ArchiveManagement() {
  const mockArchives = [
    { id: 1, title: '삼성SDS 제조 AX 레퍼런스', peer: '삼성SDS', status: 'EMBEDDED', collected: '2026-04-22 08:35' },
    { id: 2, title: 'LG CNS 금융 AI 보안 패키지', peer: 'LG CNS', status: 'CLUSTERED_DUPE', collected: '2026-04-22 07:20' },
    { id: 3, title: '현대오토에버 SDV 데이터 플랫폼', peer: '현대오토에버', status: 'SKIPPED_QUALITY', collected: '2026-04-21 16:50' },
  ];

  const statusColors = {
    EMBEDDED: 'bg-blue-100 text-blue-700',
    CLUSTERED_DUPE: 'bg-purple-100 text-purple-700',
    SKIPPED_QUALITY: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-black mb-6">원문 아카이브</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">제목</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Peer사</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">처리 상태</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">수집 시간</th>
            </tr>
          </thead>
          <tbody>
            {mockArchives.map((article) => (
              <tr key={article.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm text-black">{article.title}</td>
                <td className="py-3 px-4 text-sm text-neutral-600">{article.peer}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[article.status as keyof typeof statusColors]}`}>
                    {article.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-500">{article.collected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLog() {
  const logs = [
    { id: '1', actor: '박관리', action: 'USER_LOGIN', target: 'System', time: '2026-04-22 10:30', ip: '192.168.1.100' },
    { id: '2', actor: '김전략', action: 'ISSUE_REVIEW', target: 'IC-20260422-001', time: '2026-04-22 09:45', ip: '192.168.1.101' },
    { id: '3', actor: '이분석', action: 'REPORT_CREATE', target: 'RP-20260422-001', time: '2026-04-22 09:15', ip: '192.168.1.102' },
  ];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-black mb-6">감사 로그</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">사용자</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">작업</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">대상</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">시간</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">IP 주소</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm text-black">{log.actor}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-neutral-600">{log.target}</td>
                <td className="py-3 px-4 text-sm text-neutral-500">{log.time}</td>
                <td className="py-3 px-4 text-sm text-neutral-500">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemSettings() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <h2 className="text-lg font-bold text-black mb-6">시스템 운영 설정</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">일일 LLM 예산 (KRW)</label>
          <input
            type="number"
            defaultValue="100000"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
          />
          <p className="text-xs text-neutral-500 mt-1">일일 LLM API 사용 예산 상한선</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">원문 보관 기간 (일)</label>
          <input
            type="number"
            defaultValue="90"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">허용 이메일 도메인</label>
          <textarea
            defaultValue="@sk.com&#10;@skax.com"
            rows={3}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">브리핑 전송 시간</label>
          <input
            type="time"
            defaultValue="08:30"
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
          />
        </div>

        <button
          onClick={() => setSaved(true)}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          설정 저장
        </button>
        {saved && <p className="text-sm text-green-700">시스템 운영 설정이 저장되었습니다.</p>}
      </div>
    </div>
  );
}
