import { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { uiText } from '../../shared/content/uiText';

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: uiText.dashboard.chatGreeting,
    },
  ]);

  const handleSend = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', content: trimmedQuery },
      {
        role: 'assistant',
        content: uiText.dashboard.chatResponse,
      },
    ]);
    setQuery('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 md:bottom-5 md:right-6">
      {isOpen ? (
        <section className="axis-glass mb-2 flex h-[420px] w-[330px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white/90 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#f2ebe6] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#EE7501]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black/90">{uiText.dashboard.chatTitle}</h2>
                <p className="text-xs text-black/48">{uiText.dashboard.chatSubtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-black/50 transition-colors hover:bg-[#F6F6F6] hover:text-black"
              aria-label="AI 채팅 패널 닫기"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F6F6F6] px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#EE7501] text-white'
                      : 'border border-black/10 bg-white text-black/80'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-black/8 bg-white p-3">
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
                className="axis-input min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none transition"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EE7501] text-white transition-colors hover:bg-[#db6c01] focus:outline-none focus:ring-4 focus:ring-[#EE7501]/16"
                aria-label="메시지 전송"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div
          className={`axis-glass pointer-events-none hidden w-56 rounded-2xl bg-white/90 p-4 shadow-xl transition-all duration-200 sm:block ${
            isBubbleVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-base font-bold text-black/90">AXIS</p>
            <span className="text-xl leading-none text-black/48">×</span>
          </div>
          <p className="text-sm leading-relaxed text-black/72">안녕하세요! AXIS입니다. 무엇을 도와드릴까요?</p>
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
        className={`flex size-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#EE7501]/14 ${
          isOpen ? 'bg-[#EE7501]' : 'bg-[#111111]'
        }`}
        aria-label={isOpen ? 'AI 채팅 패널 닫기' : 'AI 채팅 패널 열기'}
        aria-expanded={isOpen}
      >
        <span className="relative block size-7 rounded-full bg-[#EE7501]">
          <span className="absolute bottom-0 left-1.5 size-3 -skew-x-12 bg-[#E1002A]" />
        </span>
      </button>
    </div>
  );
}
