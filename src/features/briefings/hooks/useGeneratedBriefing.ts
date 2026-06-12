import { useCallback, useEffect, useState } from 'react';
import type { BriefingPeriod } from '../data/periodMeta';
import { briefingsRepository } from '../api/briefingsRepository';
import type { BriefingViewModel } from '../mappers/briefingGenerateMapper';
import { mapGeneratedBriefingToView } from '../mappers/briefingGenerateMapper';
import type { CardNewsItem } from '../../card-news/model/cardNews';
import type { BriefingRange } from '../utils/briefingDate';
import { HttpRequestError } from '../../../shared/api/httpClient';

interface UseGeneratedBriefingResult {
  briefing: BriefingViewModel | null;
  isGenerating: boolean;
  error: string | null;
  reload: () => void;
}

export function useGeneratedBriefing(
  period: BriefingPeriod,
  anchorDate: string,
  fallbackCards: CardNewsItem[],
  range: BriefingRange,
): UseGeneratedBriefingResult {
  const [briefing, setBriefing] = useState<BriefingViewModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await loadSavedOrGenerate(period, anchorDate);
      setBriefing(
        mapGeneratedBriefingToView(
          result as Parameters<typeof mapGeneratedBriefingToView>[0],
          period,
          fallbackCards,
          range,
        ),
      );
    } catch (err) {
      setBriefing(null);
      setError(err instanceof Error ? err.message : '브리핑 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  }, [anchorDate, fallbackCards, period, range]);

  useEffect(() => {
    void load();
  }, [load]);

  return { briefing, isGenerating, error, reload: load };
}

async function loadSavedOrGenerate(period: BriefingPeriod, anchorDate: string) {
  try {
    return await briefingsRepository.getBriefingSummary({
      briefing_type: period,
      anchor_date: anchorDate,
    });
  } catch (err) {
    if (!isMissingSavedBriefing(err)) {
      throw err;
    }
  }

  return briefingsRepository.generateBriefing({
    briefing_type: period,
    anchor_date: anchorDate,
    refine_display_copy: true,
    save: false,
    limit: period === 'daily' ? 12 : 20,
  });
}

function isMissingSavedBriefing(err: unknown) {
  return err instanceof HttpRequestError
    && (err.status === 404 || err.status === 503 || err.code === 'BRIEFING_REPORT_UNAVAILABLE');
}
