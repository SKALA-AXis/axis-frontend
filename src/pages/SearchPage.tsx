import { SearchBar } from '../components/Search/SearchBar'
import { SearchResult } from '../components/Search/SearchResult'
import { useSearch } from '../hooks/useSearch'

const SUGGESTIONS = [
  '삼성SDS AI 전략',
  'LG CNS 파트너십',
  '삼성SDS OpenAI 리셀러',
  'LG CNS 팔란티어',
]

export default function SearchPage() {
  const { mutate: search, data: result, isPending, reset } = useSearch()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">AI 검색</h1>

      <SearchBar onSearch={(query) => { reset(); search({ query }) }} isLoading={isPending} />

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => search({ query: s })}
            className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
          >
            {s}
          </button>
        ))}
      </div>

      {(result || isPending) && (
        <SearchResult result={result ?? { answer: '', sources: [] }} isLoading={isPending} />
      )}
    </div>
  )
}
