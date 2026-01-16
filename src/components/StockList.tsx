import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { StockQuote } from '../App'
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from '../services/storage'
import { formatStockCode } from '../utils/stockCode'

interface StockListProps {
  stocks: StockQuote[]
  loading: boolean
  onSelectStock: (code: string) => void
}

const ITEMS_PER_PAGE = 50

export default function StockList({ stocks, loading, onSelectStock }: StockListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const totalPages = Math.ceil(stocks.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentStocks = stocks.slice(startIndex, endIndex)

  // 当 stocks 变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [stocks.length])

  // 加载收藏状态
  useEffect(() => {
    const favSet = new Set<string>()
    stocks.forEach(stock => {
      if (isInWatchlist(stock.code)) {
        favSet.add(stock.code)
      }
    })
    setFavorites(favSet)
  }, [stocks])

  const handleToggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (favorites.has(code)) {
      removeFromWatchlist(code)
      setFavorites(prev => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })
    } else {
      addToWatchlist(code)
      setFavorites(prev => new Set(prev).add(code))
    }
  }
  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + '亿'
    } else if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万'
    }
    return num.toFixed(2)
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-red-50'
    if (change < 0) return 'bg-green-50'
    return 'bg-gray-50'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">加载中...</p>
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-600">暂无数据，请点击"刷新数据"加载股票行情</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                代码/名称
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                最新价
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                涨跌额
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                涨跌幅
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                成交量
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                成交额
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                操作
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                收藏
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentStocks.map((stock) => (
              <tr
                key={stock.code}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectStock(stock.code)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatStockCode(stock.code)}</div>
                    <div className="text-sm text-gray-500">{stock.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                    {stock.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className={`text-sm ${getChangeColor(stock.change)}`}>
                    {stock.change > 0 ? '+' : ''}
                    {stock.change.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeBgColor(
                      stock.change
                    )} ${getChangeColor(stock.change)}`}
                  >
                    {stock.change > 0 ? (
                      <ArrowUp className="w-3 h-3 mr-1" />
                    ) : stock.change < 0 ? (
                      <ArrowDown className="w-3 h-3 mr-1" />
                    ) : null}
                    {stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatNumber(stock.volume)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                  {formatNumber(stock.amount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectStock(stock.code)
                    }}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    查看详情
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    onClick={(e) => handleToggleFavorite(stock.code, e)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={favorites.has(stock.code) ? '取消收藏' : '加入自选'}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        favorites.has(stock.code)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            共 {stocks.length} 只股票，当前显示第 {startIndex + 1}-{Math.min(endIndex, stocks.length)} 条
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="上一页"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="下一页"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
