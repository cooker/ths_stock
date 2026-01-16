import { useState } from 'react'
import { Search, TrendingUp, RefreshCw } from 'lucide-react'

interface HeaderProps {
  onLoadStocks: () => void
  onSearch: (keyword: string) => void
  loading: boolean
  loadingProgress?: { completed: number; total: number }
}

export default function Header({ onLoadStocks, onSearch, loading, loadingProgress }: HeaderProps) {
  const [searchKeyword, setSearchKeyword] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchKeyword)
  }

  const progressPercent = loadingProgress && loadingProgress.total > 0
    ? Math.round((loadingProgress.completed / loadingProgress.total) * 100)
    : 0

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">选股平台</h1>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索股票代码、名称或拼音..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            {loading && loadingProgress && loadingProgress.total > 0 && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <span>加载进度:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="min-w-[60px] text-right">
                  {loadingProgress.completed}/{loadingProgress.total}
                </span>
              </div>
            )}
            <button
              onClick={onLoadStocks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '加载中...' : '加载全市场'}
            </button>
          </div>
        </div>
        {loading && loadingProgress && loadingProgress.total > 0 && (
          <div className="mt-3 md:hidden">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span>加载进度: {loadingProgress.completed}/{loadingProgress.total}</span>
              <span className="text-primary-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
