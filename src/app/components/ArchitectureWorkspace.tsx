import { useMemo, useState } from 'react';
import { IssuesPanel } from '../../features/issues/ui/IssuesPanel';

type WorkspaceTab = 'overview' | 'issues' | 'integration';

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: '구조 개요' },
  { id: 'issues', label: '이슈 피드 예시' },
  { id: 'integration', label: '연결 전략' },
];

export function ArchitectureWorkspace() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  const content = useMemo(() => {
    if (activeTab === 'issues') {
      return <IssuesPanel />;
    }

    if (activeTab === 'integration') {
      return (
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-950">백엔드 / AI 연결 원칙</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Card
              title="1. 백엔드만 호출"
              body="프론트는 Python AI 서버를 직접 호출하지 않고, SpringBoot 또는 BFF API만 바라보게 합니다."
            />
            <Card
              title="2. AI 초안과 검수본 분리"
              body="AI가 생성한 요약, 사람이 승인한 요약, 원문 URL을 별도 필드로 분리하면 검수 흐름이 단순해집니다."
            />
            <Card
              title="3. 화면 상태와 서버 상태 분리"
              body="필터, 탭, 모달은 UI 상태로 두고, 이슈 목록과 보고서 상세는 repository와 hook으로 가져오게 합니다."
            />
            <Card
              title="4. mock은 저장소에서만"
              body="컴포넌트 안의 mock 배열을 없애고 repository 구현만 mock으로 바꾸면 API 전환이 쉬워집니다."
            />
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Workspace</p>
        <h2 className="mt-2 text-3xl font-bold text-neutral-950">재설계 시작점</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
          기존 화면은 유지하되 새 기능은 이 워크스페이스 구조에 맞춰 옮기는 방식이 가장 안전합니다.
          당장은 전체를 한 번에 갈아엎지 말고, 이슈 목록, 상세, 보고서 생성처럼 API 의존도가 높은
          기능부터 repository와 feature 단위로 분리하는 것이 좋습니다.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card
            title="app"
            body="앱 부트스트랩, 화면 조합, 레이아웃만 담당합니다."
          />
          <Card
            title="features"
            body="이슈 조회, 검색, 보고서 생성 같은 사용자 기능을 담습니다."
          />
          <Card
            title="shared"
            body="API 클라이언트, 환경변수, 공용 유틸, mock을 둡니다."
          />
        </div>
      </section>
    );
  }, [activeTab]);

  return (
    <div className="flex-1 overflow-auto bg-[#f5f1e8]">
      <div className="mx-auto max-w-7xl p-8">
        <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_30%),linear-gradient(135deg,_#1f2937,_#111827)] p-8 text-white shadow-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-orange-200">Axis Frontend Rebuild</p>
          <h1 className="mt-3 text-4xl font-bold">목업에서 연결 가능한 프론트 구조로 전환</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-200">
            현재 목업은 보존하고, 새 구조를 옆에 세워 점진적으로 이전할 수 있게 구성했습니다.
            이 화면은 새 구조를 실험하고 API 연결 방식을 정리하는 작업 공간입니다.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-950 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">{content}</div>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  body: string;
}

function Card({ title, body }: CardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
      <h3 className="text-lg font-bold text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </div>
  );
}
