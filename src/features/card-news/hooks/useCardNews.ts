import { useCallback, useEffect, useState } from 'react';
import { cardNewsRepository } from '../api/cardNewsRepository';
import type { CardNewsItem } from '../model/cardNews';

interface UseCardNewsResult {
  cards: CardNewsItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCardNews(): UseCardNewsResult {
  const [cards, setCards] = useState<CardNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextCards = await cardNewsRepository.list();
      setCards(nextCards);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '카드뉴스를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { cards, isLoading, error, reload };
}
