import type { CardNewsItem } from '../model/cardNews';
import { getSummaryLines } from '../mappers/cardNewsExecutive';

/**
 * 카드뉴스 공유 — 브라우저 Web Share API 우선, 미지원이면 clipboard 폴백.
 * 반환값은 사용자에게 노출할 토스트 문구.
 */
export async function shareCardNews(card: CardNewsItem): Promise<string> {
  const text = `${card.title}\n${getSummaryLines(card).join('\n')}\n${card.sourceUrl}`;
  if (navigator.share) {
    await navigator.share({ title: card.title, text, url: card.sourceUrl });
    return '공유를 열었습니다.';
  }
  await navigator.clipboard.writeText(text);
  return '카드뉴스 링크를 복사했습니다.';
}
