import { httpClient } from '../../../shared/api/httpClient';
import type { LinkVerifyResponse } from '../model/linkVerify';

export interface LinkVerifyRepository {
  verify(cardId: string): Promise<LinkVerifyResponse>;
}

class HttpLinkVerifyRepository implements LinkVerifyRepository {
  async verify(cardId: string): Promise<LinkVerifyResponse> {
    if (!httpClient) {
      throw new Error('API client is not configured.');
    }
    return httpClient.post<LinkVerifyResponse>(`/api/cards/${encodeURIComponent(cardId)}/verify-link`);
  }
}

export const linkVerifyRepository: LinkVerifyRepository = new HttpLinkVerifyRepository();
