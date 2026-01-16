import { useState, useEffect } from 'react'
import { Star, X, Plus, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react'
import { StockSDK } from 'stock-sdk'
import { StockQuote } from '../App'
import {
  getWatchlist,
  saveWatchlist,
  addGroup,
  removeGroup,
  renameGroup,
} from '../services/storage'
import { formatStockCode } from '../utils/stockCode'

interface WatchlistPanelProps {
  sdk: StockSDK
  onSelectStock: (code: string) => void
}

export default function WatchlistPanel({ sdk, onSelectStock }: WatchlistPanelProps) {
  const [watchlist, setWatchlist] = useState(getWatchlist())
  const [stocks, setStocks] = useState<Record<string, StockQuote>>({})
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    loadWatchlistStocks()
  }, [watchlist])

  const loadWatchlistStocks = async () => {
    const allCodes = watchlist.groups.flatMap(g => g.codes)
    if (allCodes.length === 0) {
      setStocks({})
      return
    }

    try {
      // 格式化所有代码，确保包含市场前缀（sz、bj等）
      const formattedCodes = allCodes.map(code => formatStockCode(code))
      
      // 创建格式化代码到原始代码的映射（API返回的code可能是格式化后的）
      const formattedToOriginalMap = new Map<string, string>()
      allCodes.forEach((originalCode, index) => {
        const formattedCode = formattedCodes[index]
        formattedToOriginalMap.set(formattedCode, originalCode)
        // 也支持原始代码作为key（如果API返回的是原始代码）
        formattedToOriginalMap.set(originalCode, originalCode)
      })
      
      // 尝试使用 getFullQuotes 获取完整数据（包含换手率等字段）
      let quotes: any[]
      try {
        quotes = await sdk.getFullQuotes(formattedCodes)
      } catch (error) {
        // 如果失败，回退到 getSimpleQuotes
        quotes = await sdk.getSimpleQuotes(formattedCodes)
      }
      
      const stocksMap: Record<string, StockQuote> = {}
      quotes.forEach(q => {
        const quote = q as any
        // 处理换手率（可能是小数形式或百分比形式）
        const turnoverRate = quote.turnoverRate || quote.turnover || quote.turnoverRatio || 0
        const turnoverRatePercent = turnoverRate < 1 ? turnoverRate * 100 : turnoverRate
        
        // 从API返回的code找到对应的原始代码
        // API可能返回格式化后的code或原始code，我们需要找到对应的原始code
        const apiCode = q.code || ''
        const formattedApiCode = formatStockCode(apiCode)
        const originalCode = formattedToOriginalMap.get(apiCode) || 
                            formattedToOriginalMap.get(formattedApiCode) || 
                            apiCode
        
        stocksMap[originalCode] = {
          code: originalCode,
          name: q.name,
          price: q.price || 0,
          change: q.change || 0,
          changePercent: q.changePercent || 0,
          volume: q.volume || 0,
          amount: q.amount || 0,
          high: quote.high || 0,
          low: quote.low || 0,
          open: quote.open || 0,
          prevClose: quote.prevClose || 0,
          turnoverRate: turnoverRatePercent,
        }
      })
      setStocks(stocksMap)
    } catch (error) {
      console.error('加载自选股行情失败:', error)
    }
  }

  const handleAddGroup = () => {
    const name = newGroupName.trim() || `分组${watchlist.groups.length + 1}`
    addGroup(name)
    setWatchlist(getWatchlist())
    setNewGroupName('')
  }

  const handleRemoveGroup = (groupId: string) => {
    if (confirm('确定要删除这个分组吗？')) {
      removeGroup(groupId)
      setWatchlist(getWatchlist())
    }
  }

  const handleRenameGroup = (groupId: string, currentName: string) => {
    const newName = prompt('请输入新名称:', currentName)
    if (newName && newName.trim()) {
      renameGroup(groupId, newName.trim())
      setWatchlist(getWatchlist())
    }
  }

  const handleRemoveStock = (code: string, groupId: string) => {
    const group = watchlist.groups.find(g => g.id === groupId)
    if (group) {
      group.codes = group.codes.filter(c => c !== code)
      saveWatchlist(watchlist)
      setWatchlist(getWatchlist())
    }
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

  const formatNumber = (num: number) => {
    if (num === 0 || !num) return '--'
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + '亿'
    } else if (num >= 10000) {
      return (num / 10000).toFixed(2) + '万'
    }
    return num.toFixed(2)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            自选股
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="新分组名称"
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddGroup()
                }
              }}
            />
            <button
              onClick={handleAddGroup}
              className="flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加分组
            </button>
          </div>
        </div>

        {watchlist.groups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无自选股分组</p>
        ) : (
          <div className="space-y-4">
            {watchlist.groups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className="text-sm text-gray-500">({group.codes.length})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRenameGroup(group.id, group.name)}
                      className="p-1 text-gray-600 hover:text-gray-900"
                      title="重命名"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveGroup(group.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="删除分组"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {group.codes.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">该分组暂无股票</p>
                ) : (
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
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.codes.map((code) => {
                          const stock = stocks[code]
                          return (
                            <tr
                              key={code}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => onSelectStock(code)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{formatStockCode(code)}</div>
                                  <div className="text-sm text-gray-500">{stock?.name || '加载中...'}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                {stock ? (
                                  <span className={`text-sm font-medium ${getChangeColor(stock.change)}`}>
                                    {stock.price > 0 ? stock.price.toFixed(2) : '--'}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                {stock ? (
                                  <span className={`text-sm ${getChangeColor(stock.change)}`}>
                                    {stock.change > 0 ? '+' : ''}
                                    {stock.change.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                {stock ? (
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
                                ) : (
                                  <span className="text-sm text-gray-400">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                {stock ? formatNumber(stock.volume) : '--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                {stock ? formatNumber(stock.amount) : '--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveStock(code, group.id)
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="移除"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
