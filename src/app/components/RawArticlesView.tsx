import { ExternalLink, Filter } from 'lucide-react';
import { useState } from 'react';
import { useRawArticles } from '../../features/raw-articles/hooks/useRawArticles';
import { uiText } from '../../shared/content/uiText';

export function RawArticlesView() {
  const { articles, isLoading, error } = useRawArticles();
  const [isFiltered, setIsFiltered] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-neutral-50">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-black sm:text-3xl">{uiText.rawArticles.pageTitle}</h1>
          <p className="text-neutral-600">{uiText.rawArticles.pageSubtitle}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <select className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm sm:w-auto">
                <option>전체 Peer사</option>
                <option>삼성SDS</option>
                <option>LG CNS</option>
                <option>현대오토에버</option>
              </select>
            </div>
            <button onClick={() => setIsFiltered(true)} className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 flex items-center gap-2 text-sm">
              <Filter size={16} />
              {uiText.rawArticles.filter}
            </button>
          </div>
          {isFiltered && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
              {uiText.rawArticles.filtered}
            </div>
          )}
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{uiText.common.loadError}</div>}
          {isLoading ? <div className="mb-4 text-sm text-neutral-500">{uiText.common.loading}</div> : null}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  {uiText.rawArticles.headers.map((header) => (
                    <th key={header} className="text-left py-3 px-4 text-sm font-medium text-neutral-600">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4"><p className="text-sm text-black font-medium">{article.title}</p></td>
                    <td className="py-3 px-4"><span className="text-sm text-neutral-600">{article.peerId}</span></td>
                    <td className="py-3 px-4"><span className="text-sm text-neutral-600">{article.sourceName}</span></td>
                    <td className="py-3 px-4"><span className="text-sm text-neutral-500">{new Date(article.collectedAt).toLocaleString('ko-KR')}</span></td>
                    <td className="py-3 px-4">
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-orange-600">
                        {uiText.rawArticles.openLink}
                        <ExternalLink size={15} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
