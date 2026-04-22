interface CitationChipProps {
  index: number
  url: string
  title: string
}

export function CitationChip({ index, url, title }: CitationChipProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200"
    >
      [{index}]
    </a>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function renderWithCitations(text: string, sources: { index: number; url: string; title: string }[]): string {
  return text.replace(/\[(\d+)\]/g, (_match, idx) => {
    const source = sources[parseInt(idx) - 1]
    if (!source) return `[${idx}]`
    return `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-1 py-0.5 rounded bg-blue-100 text-blue-700 text-xs hover:bg-blue-200">[${idx}]</a>`
  })
}
