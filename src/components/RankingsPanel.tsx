import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { StockSDK } from 'stock-sdk'
import { StockQuote } from '../App'
import { formatStockCode } from '../utils/stockCode'

interface RankingsPanelProps {
  sdk: StockSDK
  stocks: StockQuote[]
  onSelectStock: (code: string) => void
}

export default function RankingsPanel({ sdk, stocks, onSelectStock }: RankingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'gain' | 'loss' | 'volume' | 'amount'>('gain')
  const [rankings, setRankings] = useState<StockQuote[]>([])

  useEffect(() => {
    updateRankings()
  }, [stocks, activeTab])

  const updateRankings = () => {
    let sorted = [...stocks]
    
    switch (activeTab) {
      case 'gain':
        sorted = sorted
          .filter(s => s.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 20)
        break
      case 'loss':
        sorted = sorted
          .filter(s => s.changePercent < 0)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 20)
        break
      case 'volume':
        sorted = sorted
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 20)
        break
      case 'amount':
        sorted = sorted
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 20)
        break
    }
    
    setRankings(sorted)
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + '亿'
    } else if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万'
    }
    return num.toFixed(2)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">排行榜</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('gain')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'gain'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            涨幅榜
          </button>
          <button
            onClick={() => setActiveTab('loss')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'loss'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-1" />
            跌幅榜
          </button>
          <button
            onClick={() => setActiveTab('volume')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'volume'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            成交量榜
          </button>
          <button
            onClick={() => setActiveTab('amount')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'amount'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            成交额榜
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                排名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                代码/名称
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                最新价
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                涨跌幅
              </th>
              {activeTab === 'volume' && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  成交量
                </th>
              )}
              {activeTab === 'amount' && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  成交额
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rankings.map((stock, index) => (
              <tr
                key={stock.code}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectStock(stock.code)}
              >
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${
                    index < 3 ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatStockCode(stock.code)}</div>
                    <div className="text-sm text-gray-500">{stock.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                    {stock.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                    {stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </td>
                {activeTab === 'volume' && (
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatNumber(stock.volume)}
                  </td>
                )}
                {activeTab === 'amount' && (
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {formatNumber(stock.amount)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
