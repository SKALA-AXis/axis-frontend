import { useCallback } from 'react';
import { useAsyncResource } from '../../../shared/hooks/useAsyncResource';
import { cardNewsRepository } from '../api/cardNewsRepository';
import type { CardNewsItem } from '../model/cardNews';

interface UseCardNewsResult {
  cards: CardNewsItem[];
  isLoading: boolean;
  error: string | null;
}

export function useCardNews(): UseCardNewsResult {
  const load = useCallback(() => cardNewsRepository.list(), []);
  const { data, isLoading, error } = useAsyncResource<CardNewsItem[]>(load, [], [load]);

  return { cards: data, isLoading, error };
}
