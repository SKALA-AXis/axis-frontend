import type { SearchResponse } from '../../types/api'
import { renderWithCitations } from './CitationChip'

interface SearchResultProps {
  result: SearchResponse
  isLoading?: boolean
}

export function SearchResult({ result, isLoading = false }: SearchResultProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  const answerHtml = result.sources?.length
    ? renderWithCitations(result.answer, result.sources)
    : result.answer

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-1 mb-3">
        <span>✨</span>
        <h3 className="text-sm font-semibold text-blue-800">AI 답변 (초안)</h3>
        {result.scPassed === false && (
          <span className="text-xs text-yellow-600 ml-2">⚠️ 검증 미통과</span>
        )}
      </div>
      <div
        className="text-sm text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: answerHtml }}
      />
      {result.sources?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 mb-2">출처</h4>
          <ul className="space-y-1">
            {result.sources.map((s) => (
              <li key={s.index} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">[{s.index}]</span>{' '}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {s.title}
                </a>{' '}— {s.sourceName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
