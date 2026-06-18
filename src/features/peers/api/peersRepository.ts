/*
 * 작성일: 2026-04-27
 * 작성자: 안가은
 * 변경이력:
 *   2026-04-27 안가은 — 프론트엔드 폴더 구조 재정비 과정에서 Peers 리포지토리 구성, 이후 화면 UI 개선 및 키워드 그래프 API 연동
 *   2026-06-10 박진 — 목(mock) 비활성화 및 믹서 UX 개선
 */
import type { PeersData } from '../model/peer';
import { httpClient } from '../../../shared/api/httpClient';

export interface PeersRepository {
  getPeers(): Promise<PeersData>;
}

class HttpPeersRepository implements PeersRepository {
  async getPeers(): Promise<PeersData> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }

    return httpClient.get<PeersData>('/api/peers');
  }
}

export const peersRepository: PeersRepository = new HttpPeersRepository();
