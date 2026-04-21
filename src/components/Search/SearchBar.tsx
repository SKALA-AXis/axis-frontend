import { useState } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="무엇이 궁금하세요? (예: LG CNS 최근 전략 변화)"
        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50"
      >
        <Search size={16} />
      </button>
    </form>
  )
}
