import { alertsRepository } from '../../features/alerts/api/alertsRepository';
import { briefingsRepository } from '../../features/briefings/api/briefingsRepository';
import { cardNewsRepository } from '../../features/card-news/api/cardNewsRepository';
import { dashboardRepository } from '../../features/dashboard/api/dashboardRepository';
import { peerOverviewRepository } from '../../features/peers/api/peerOverviewRepository';
import { peerPositioningRepository } from '../../features/peers/api/peerPositioningRepository';
import { peersRepository } from '../../features/peers/api/peersRepository';
import { httpClient } from './httpClient';
import { prefetchCachedResource } from './resourceCache';

const bootstrapDelayMs = 160;
const keywordGraphOverviewCacheKey = 'keyword-graph:overview';

function prefetchKeywordGraphOverview(): Promise<void> | undefined {
  const client = httpClient;
  if (!client) return undefined;
  return prefetchCachedResource(keywordGraphOverviewCacheKey, () => client.get<unknown>('/api/keyword-graph'));
}

export function bootstrapAppData(): () => void {
  let cancelled = false;
  const run = () => {
    if (cancelled) return;

    const firstWave = [
      dashboardRepository.prefetch?.(),
      cardNewsRepository.prefetchList?.(),
    ];
    void Promise.allSettled(firstWave);

    window.setTimeout(() => {
      if (cancelled) return;
      void Promise.allSettled([
        peersRepository.prefetch?.(),
        peerOverviewRepository.prefetch?.(),
        peerPositioningRepository.prefetch?.(),
        briefingsRepository.prefetch?.(),
        alertsRepository.prefetch?.(),
        prefetchKeywordGraphOverview(),
      ]);
    }, bootstrapDelayMs);
  };

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(run, { timeout: 1200 });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = globalThis.setTimeout(run, bootstrapDelayMs);
  return () => {
    cancelled = true;
    globalThis.clearTimeout(timeoutId);
  };
}
