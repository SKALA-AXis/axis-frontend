import { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { uiText } from '../../../shared/content/uiText';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `${uiText.dashboard.chatGreeting} `,
    },
  ]);

  const handleSend = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setMessages((currentMessages) => {
      const nextMessages: ChatMessage[] = [
        ...currentMessages,
        { role: 'user', content: trimmedQuery },
      ];

      nextMessages.push({
        role: 'assistant',
        content: '관련 카드뉴스와 인사이트 흐름을 기준으로 정리해보면, 지금은 수주 신호와 AI 인프라 투자가 함께 움직이는지 먼저 확인하는 것이 좋습니다. 더 구체적으로 보고 싶은 기업, 기간, 키워드를 이어서 질문해 주세요.',
      });

      return nextMessages;
    });
    setQuery('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-[55] flex flex-col items-end gap-3 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="mb-2 flex h-[420px] w-[330px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--axis-radius-xl)] border border-[var(--axis-hairline)] bg-[var(--axis-surface)] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.62)]">
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
                  className={`max-w-[78%] rounded-[var(--axis-radius-lg)] px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[var(--axis-navy)] text-white'
                      : 'border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] text-[var(--axis-body)]'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--axis-hairline)] bg-[var(--axis-surface)] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder={uiText.dashboard.chatPlaceholder}
                className="min-w-0 flex-1 rounded-[var(--axis-radius-md)] border border-[var(--axis-hairline)] bg-[var(--axis-canvas)] px-3 py-2 text-sm text-[var(--axis-ink)] outline-none transition placeholder:text-[var(--axis-muted)] focus:border-[var(--axis-accent)]"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex size-10 shrink-0 items-center justify-center rounded-[var(--axis-radius-md)] bg-[var(--axis-navy)] text-white transition-colors hover:bg-[var(--axis-ink)] focus:outline-none"
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
        data-guide="ai-chat"
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
    </div>
  );
}
