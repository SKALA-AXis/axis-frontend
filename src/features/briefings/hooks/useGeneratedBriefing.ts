import { useCallback, useEffect, useState } from 'react';
import type { BriefingPeriod } from '../data/periodMeta';
import { briefingsRepository, type BriefingGenerateResult } from '../api/briefingsRepository';
import type { BriefingViewModel } from '../mappers/briefingGenerateMapper';
import { mapGeneratedBriefingToView } from '../mappers/briefingGenerateMapper';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import type { BriefingRange } from '../utils/briefingDate';
import { HttpRequestError } from '../../../shared/api/httpClient';

export type BriefingPeriodSelection = {
  anchorDate: string;
  month?: string;
  weekIndex?: number;
  briefingId?: string;
};

interface UseGeneratedBriefingResult {
  briefing: BriefingViewModel | null;
  isGenerating: boolean;
  error: string | null;
  savedBriefingMissing: boolean;
  reload: () => void;
}

export function useGeneratedBriefing(
  period: BriefingPeriod,
  selection: BriefingPeriodSelection,
  fallbackCards: CardNewsItem[],
  range: BriefingRange,
  initialResult?: BriefingGenerateResult | null,
): UseGeneratedBriefingResult {
  const mapResult = useCallback((result: BriefingGenerateResult) => (
    mapGeneratedBriefingToView(
      result as Parameters<typeof mapGeneratedBriefingToView>[0],
      period,
      fallbackCards,
      range,
    )
  ), [fallbackCards, period, range]);
  const [briefing, setBriefing] = useState<BriefingViewModel | null>(() => (
    initialResult ? mapGeneratedBriefingToView(initialResult as Parameters<typeof mapGeneratedBriefingToView>[0], period, fallbackCards, range) : null
  ));
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedBriefingMissing, setSavedBriefingMissing] = useState(false);

  const load = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setSavedBriefingMissing(false);
    try {
      const { result, savedMissing } = await loadSavedOrGenerate(period, selection);
      setBriefing(mapResult(result));
      setSavedBriefingMissing(savedMissing);
    } catch (err) {
      setBriefing(null);
      setError(err instanceof Error ? err.message : '브리핑 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [mapResult, period, selection]);

  useEffect(() => {
    if (!initialResult) return;
    setBriefing(mapResult(initialResult));
    setError(null);
    setSavedBriefingMissing(false);
  }, [initialResult, mapResult]);

  useEffect(() => {
    void load();
  }, [load]);

  return { briefing, isGenerating, error, savedBriefingMissing, reload: load };
}

async function loadSavedOrGenerate(period: BriefingPeriod, selection: BriefingPeriodSelection) {
  if (selection.briefingId) {
    const result = await briefingsRepository.getBriefingById(selection.briefingId);
    return { result, savedMissing: false };
  }

  const summaryRequest =
    period === 'daily'
      ? { briefing_type: period, anchor_date: selection.anchorDate }
      : period === 'weekly'
        ? {
          briefing_type: period,
          anchor_date: selection.anchorDate,
          month: selection.month,
          week_index: selection.weekIndex,
        }
        : { briefing_type: period, anchor_date: selection.anchorDate, month: selection.month };
  try {
    const result = await briefingsRepository.getBriefingSummary(summaryRequest);
    return { result, savedMissing: false };
  } catch (err) {
    if (!isMissingSavedBriefing(err)) {
      throw err;
    }
  }

  const result = await briefingsRepository.generateBriefing({
    briefing_type: period,
    anchor_date: selection.anchorDate,
    month: selection.month,
    week_index: selection.weekIndex,
    refine_display_copy: true,
    save: false,
    limit: period === 'daily' ? 12 : 20,
  });
  return { result, savedMissing: true };
}

function isMissingSavedBriefing(err: unknown) {
  return err instanceof HttpRequestError
    && (err.status === 404 || err.status === 503 || err.code === 'BRIEFING_REPORT_UNAVAILABLE');
}
