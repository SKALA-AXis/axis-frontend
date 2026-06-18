/*
 * 작성일: 2026-05-12
 * 작성자: 안가은
 * 변경이력:
 *   2026-05-12 안가은 — 화면 UI 개선, 관리자 카드뉴스 관리·감사로그 화면 추가, 로딩 표준화 및 키워드 트렌드 지연 로딩
 */
import { useCallback } from 'react';
import type { AsyncStatus } from '../../../shared/hooks/useAsyncResource';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { cardNewsRepository } from '../api/cardNewsRepository';
import type { CardNewsItem } from '../model/cardNews';

interface UseCardNewsResult {
  cards: CardNewsItem[];
  status: AsyncStatus;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCardNews(): UseCardNewsResult {
  const load = useCallback(() => cardNewsRepository.list(), []);
  const {
    data: cards,
    status,
    isLoading,
    error,
    reload,
  } = useAsyncResource<CardNewsItem[]>(load, [], [load], {
    errorMessage: '카드뉴스를 불러오지 못했습니다.',
  });

  return { cards, status, isLoading, error, reload };
}
