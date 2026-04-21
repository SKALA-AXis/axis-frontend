import client from './client'
import type { IssueCard, PeerCompany } from '../types/api'

export const peersApi = {
  getList: (): Promise<PeerCompany[]> =>
    client.get('/api/peers'),

  getPeerIssues: (peerId: string): Promise<IssueCard[]> =>
    client.get(`/api/peers/${peerId}/issues`),
}
