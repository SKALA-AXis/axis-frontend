import { useCallback, useEffect, useState } from 'react';
import { adminCardsRepository } from '../api/adminCardsRepository';
import type { AdminCard, AdminCardStatus } from '../model/adminCard';

interface UseAdminCardsResult {
  cards: AdminCard[];
  isLoading: boolean;
  error: string | null;
  updatingCardId: string | null;
  reload: () => Promise<void>;
  updateStatus: (cardId: string, status: AdminCardStatus, reason?: string) => Promise<void>;
}

export function useAdminCards(status?: AdminCardStatus): UseAdminCardsResult {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const nextCards = await adminCardsRepository.list(status);
      setCards(nextCards);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '카드뉴스 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateStatus = useCallback(async (cardId: string, nextStatus: AdminCardStatus, reason?: string) => {
    setUpdatingCardId(cardId);

    try {
      const updatedCard = await adminCardsRepository.updateStatus(cardId, nextStatus, reason);
      setCards((currentCards) => currentCards
        .map((card) => (card.id === cardId ? updatedCard : card))
        .filter((card) => status ? card.status === status : true));
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '카드뉴스 상태를 변경하지 못했습니다.');
      throw updateError;
    } finally {
      setUpdatingCardId(null);
    }
  }, [status]);

  return { cards, isLoading, error, updatingCardId, reload, updateStatus };
}
