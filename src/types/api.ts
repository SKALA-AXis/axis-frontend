/**
 * AXIS API 타입 정의
 * 수동 수정 금지 — openapi-typescript로 재생성:
 *   npx openapi-typescript ../axis-infra/api/openapi.yaml -o src/types/api.ts
 */

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    detail?: string
  }
  timestamp: string
}

export type ImportanceEnum = 'urgent' | 'notable' | 'reference'
export type EventTypeEnum = 'partnership' | 'ma' | 'personnel' | 'tech' | 'regulation' | 'new_biz'

export interface IssueCard {
  id: string
  peerId: string
  clusterId?: number
  title: string
  summaryLines?: string[]
  eventType: EventTypeEnum
  importance: ImportanceEnum
  importanceScore?: number
  implication?: Implication
  sources?: Source[]
  createdAt: string
}

export interface Implication {
  whyImportant: string
  potentialImpact: string
  followUpQuestions: string[]
  suggestedActions: string[]
  confidence: number
  sourcesUsed?: number[]
}

export interface Source {
  index: number
  title: string
  sourceName: string
  url: string
  credibilityScore?: number
}

export interface PeerCompany {
  peerId: string
  name: string
}

export interface SearchRequest {
  query: string
  peerId?: string
  eventType?: EventTypeEnum
  topK?: number
}

export interface SearchResponse {
  answer: string
  sources: Source[]
  scPassed?: boolean
  scScore?: number
}

export interface AlertSettings {
  briefingTime: string
  enableUrgent: boolean
  slackEnabled: boolean
}

export interface PipelineStatus {
  status: 'idle' | 'running' | 'error'
  lastRun?: string
}
