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
