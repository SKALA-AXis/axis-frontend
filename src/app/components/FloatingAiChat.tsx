import { useState } from 'react';
import { FileText, Send, Sparkles, X } from 'lucide-react';
import { uiText } from '../../shared/content/uiText';
import { useChat } from '../../features/chat/hooks/useChat';
import { AgentTimeline } from '../../features/chat/components/AgentTimeline';
import type {
  AgentTraceStep,
  ChatIntent,
  ChatLens,
  FollowUpSuggestion,
  ChatTurnResponse,
} from '../../features/chat/model/chat';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  reportPreview?: boolean;
  intent?: ChatIntent;
  followUps?: FollowUpSuggestion[];
  finalOneLiner?: string | null;
  skAxImplication?: string | null;
  sources?: ChatTurnResponse['sources'];
  confidence?: number;
  warning?: string | null;
  agentTrace?: AgentTraceStep[];
};

const INTENT_LABEL: Record<ChatIntent, string> = {
  insight: '인사이트',
  mixer: '믹서',
  peer_compare: 'Peer 비교',
  global_trends: '글로벌 동향',
  link_verify: '출처 검증',
  search: '검색',
  summary: '요약',
  smalltalk: '대화',
};

const LENS_LABEL: Record<ChatLens, string> = {
  technical: '기술',
  financial: '재무',
  competitive: '경쟁',
  regulatory: '규제',
  customer: '고객',
};

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `${uiText.dashboard.chatGreeting} "삼성SDS 전략", "오늘 인사이트", "글로벌 동향" 같이 물어보시면 적절한 분석을 실행해드릴게요.`,
    },
  ]);
  const { send, isLoading } = useChat();

  const handleSend = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) return;

    const asksForReport = /pdf|보고서|리포트|문서|출력/i.test(trimmedQuery);
    if (asksForReport) {
      // PDF preview flow (기존 mock 동작 유지)
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmedQuery },
        {
          role: 'assistant',
          content:
            '좋습니다. 오늘 인사이트, 근거 카드뉴스, SK AX 대응 방향을 묶어 PDF 보고서 초안을 만들었습니다. 아래 미리보기에서 형식을 확인해보세요.',
          reportPreview: true,
        },
      ]);
      setQuery('');
      return;
    }

    // 실 API 호출
    const userMessage: ChatMessage = { role: 'user', content: trimmedQuery };
    const historyForApi = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');

    const result = await send(trimmedQuery, historyForApi);

    if (!result) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '죄송해요, 지금은 응답을 가져올 수 없어요. 잠시 후 다시 시도해주세요.',
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: result.reply,
        intent: result.intent,
        followUps: result.follow_up_suggestions,
        finalOneLiner: result.final_one_liner,
        skAxImplication: result.sk_ax_implication,
        sources: result.sources,
        confidence: result.confidence,
        warning: result.warning,
        agentTrace: result.agent_trace,
      },
    ]);
  };

  const handleFollowUp = (label: string) => {
    setQuery(label);
  };

  return (
    <div className="fixed bottom-20 right-4 z-[55] flex flex-col items-end gap-3 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="mb-2 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.62)]">
          <div className="flex items-center justify-between border-b border-[var(--axis-hairline)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--axis-ink)]">{uiText.dashboard.chatTitle}</h2>
                <p className="text-xs text-[var(--axis-muted)]">{uiText.dashboard.chatSubtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex size-8 items-center justify-center rounded-[var(--axis-radius-md)] text-[var(--axis-muted)] transition-colors hover:bg-[var(--axis-surface-muted)] hover:text-[var(--axis-ink)]"
              aria-label="AI 채팅 패널 닫기"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--axis-canvas)] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-[var(--axis-radius-lg)] px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[var(--axis-navy)] text-white'
                      : 'border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)]'
                  }`}
                >
                  {message.intent && message.role === 'assistant' ? (
                    <div className="mb-2 flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(220,90,36,0.10)] px-2 py-0.5 text-[10px] font-bold text-[var(--axis-accent-strong)]">
                        <Sparkles size={10} />
                        {INTENT_LABEL[message.intent]}
                      </span>
                      {message.confidence !== undefined && message.confidence > 0 ? (
                        <span className="text-[10px] font-semibold text-[var(--axis-muted)]">
                          신뢰도 {Math.round(message.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.skAxImplication ? (
                    <p className="mt-2 rounded-[var(--axis-radius-sm)] bg-[var(--axis-surface-muted)] p-2 text-xs italic text-[var(--axis-body)]">
                      SK AX 시사점: {message.skAxImplication}
                    </p>
                  ) : null}
                  {message.sources && message.sources.length > 0 ? (
                    <p className="mt-2 text-[10px] font-mono text-[var(--axis-muted)]">
                      근거: {message.sources.map((s) => s.card_id).filter(Boolean).slice(0, 5).join(', ')}
                    </p>
                  ) : null}
                  {message.warning ? (
                    <p className="mt-2 text-[10px] font-semibold text-yellow-700">⚠️ {message.warning}</p>
                  ) : null}
                  {message.agentTrace && message.agentTrace.length > 0 ? (
                    <AgentTimeline trace={message.agentTrace} />
                  ) : null}
                  {message.followUps && message.followUps.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {message.followUps.slice(0, 5).map((f, i) => (
                        <button
                          key={`${index}-fu-${i}`}
                          type="button"
                          onClick={() => handleFollowUp(f.label)}
                          className="rounded-full border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-2 py-0.5 text-[10px] font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
                          title={f.topic_anchor ?? undefined}
                        >
                          {f.lens ? `${LENS_LABEL[f.lens]} 관점 · ` : ''}
                          {f.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {message.reportPreview ? (
                    <button
                      type="button"
                      onClick={() => setReportPreviewOpen(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-xs font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
                    >
                      <FileText size={14} />
                      PDF 미리보기
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-[var(--axis-radius-lg)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-muted)]">
                  분석 중… (30~60초 소요)
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isLoading) {
                    handleSend();
                  }
                }}
                placeholder={uiText.dashboard.chatPlaceholder}
                disabled={isLoading}
                className="min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-ink)] outline-none transition placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading}
                className="flex size-10 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-white transition-colors hover:bg-[var(--axis-ink)] focus:outline-none disabled:opacity-50"
                aria-label="메시지 전송"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          className={`pointer-events-none hidden w-56 rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-4 shadow-[0_18px_54px_-34px_rgba(0,0,0,0.52)] transition-all duration-200 sm:block ${
            isBubbleVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-base font-bold text-[var(--axis-ink)]">AXIS</p>
            <span className="text-xl leading-none text-[var(--axis-muted)]">×</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--axis-body)]">안녕하세요. 오늘의 전략 신호를 함께 정리해드릴게요.</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
          setIsBubbleVisible(false);
        }}
        onMouseEnter={() => setIsBubbleVisible(true)}
        onMouseLeave={() => setIsBubbleVisible(false)}
        onFocus={() => setIsBubbleVisible(true)}
        onBlur={() => setIsBubbleVisible(false)}
        className={`flex size-14 items-center justify-center rounded-[var(--axis-radius-xl)] border border-white/20 text-white shadow-[0_18px_54px_-28px_rgba(220,90,36,0.82)] transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--axis-canvas)] ${
          isOpen ? 'bg-[var(--axis-accent-strong)]' : 'bg-[var(--axis-accent)]'
        }`}
        aria-label={isOpen ? 'AI 채팅 패널 닫기' : 'AI 채팅 패널 열기'}
        aria-expanded={isOpen}
      >
        <Sparkles className="size-6" />
      </button>
      {reportPreviewOpen ? (
        <div className="fixed inset-0 z-[60] bg-[rgba(8,10,14,0.58)] p-4 backdrop-blur-sm">
          <section className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_30px_100px_-44px_rgba(0,0,0,0.62)]">
            <header className="flex items-center justify-between border-b border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <div>
                <p className="axis-kicker">PDF preview</p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--axis-ink)]">오늘 인사이트 보고서 초안</h2>
              </div>
              <button
                type="button"
                onClick={() => setReportPreviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-muted)] hover:border-[var(--axis-accent)]"
                aria-label="PDF 미리보기 닫기"
              >
                <X size={16} />
              </button>
            </header>
            <article className="min-h-0 flex-1 overflow-y-auto bg-[var(--axis-surface-soft)] p-5">
              <div className="mx-auto max-w-2xl rounded-[12px] border border-[#E8DED0] bg-white p-7 text-[#1A1A1F]">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#DC5A24]">AXIS Insight Report</p>
                <h1 className="mt-2 text-2xl font-bold leading-tight">과거와의 변화를 기반으로 오늘의 동향</h1>
                <p className="mt-4 rounded-[10px] border border-[#EDE4D8] bg-[#FFFCF7] p-4 text-sm font-semibold leading-7">
                  포스코DX의 공공 수주 신호와 주요 Peer사의 AI 인프라 투자가 함께 포착되어, 고객 제안에서는 운영 KPI와 레퍼런스 근거를 먼저 제시해야 합니다.
                </p>
                {[
                  ['핵심 변화', 'AX 시장은 PoC 검증보다 실제 운영 확산과 수주 기반 KPI 증명으로 이동하고 있습니다.'],
                  ['시사점', 'Peer사의 메시지는 기술 발표보다 산업별 고객 성과와 운영 안정성을 강조하는 방향으로 수렴합니다.'],
                  ['SK AX 대응', '고객 산업별 제안서에 IR 근거, 카드뉴스 요약, Graphify 관계도를 함께 묶어 사전 브리핑 자료로 제공합니다.'],
                ].map(([title, body], index) => (
                  <section key={title} className="mt-5 border-t border-[#EDE4D8] pt-4">
                    <h2 className="text-base font-bold">{index + 1}. {title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[#2D2D33]">{body}</p>
                  </section>
                ))}
              </div>
            </article>
            <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--axis-hairline)] bg-[var(--axis-surface-muted)] px-5 py-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-4 py-2 text-sm font-semibold text-[var(--axis-ink)] hover:border-[var(--axis-accent)]"
              >
                인쇄/PDF 저장
              </button>
              <button
                type="button"
                onClick={() => setReportPreviewOpen(false)}
                className="rounded-[var(--axis-radius-md)] bg-[var(--axis-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--axis-accent-strong)]"
              >
                대화로 돌아가기
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
