import { useState } from 'react'
import Header from './components/Header'
import StockList from './components/StockList'
import FilterPanel from './components/FilterPanel'
import StockDetail from './components/StockDetail'
import IndustryPanel from './components/IndustryPanel'
import WatchlistPanel from './components/WatchlistPanel'
import RankingsPanel from './components/RankingsPanel'
import { StockSDK } from 'stock-sdk'
import { isExcluded } from './services/storage'

export interface StockQuote {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
  high: number
  low: number
  open: number
  prevClose: number
  // 新增字段
  circulatingMarketValue?: number // 流通市值（元）
  volumeRatio?: number // 量比
  turnoverRate?: number // 换手率（%）
  minuteStrength?: number // 分时强度
}

function App() {
  const [sdk] = useState(() => new StockSDK())
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [filteredStocks, setFilteredStocks] = useState<StockQuote[]>([])
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState({ completed: 0, total: 0 })
  const [activeTab, setActiveTab] = useState<'stocks' | 'industry' | 'watchlist' | 'rankings'>('stocks')
  const [filters, setFilters] = useState({
    minChangePercent: -Infinity,
    maxChangePercent: Infinity,
    minPrice: 0,
    maxPrice: Infinity,
    minCirculatingMarketValue: 0,
    maxCirculatingMarketValue: Infinity,
    minVolumeRatio: 0,
    maxVolumeRatio: Infinity,
    minTurnoverRate: 0,
    maxTurnoverRate: Infinity,
    minMinuteStrength: -Infinity,
    maxMinuteStrength: Infinity,
    filterST: false,
    filterChiNext: false,
    sortBy: 'changePercent' as 'changePercent' | 'price' | 'circulatingMarketValue' | 'volumeRatio' | 'turnoverRate',
    sortOrder: 'desc' as 'asc' | 'desc',
  })

  const loadStocks = async () => {
    setLoading(true)
    setLoadingProgress({ completed: 0, total: 0 })
    try {
      // 使用 getAllAShareQuotes 获取全市场A股行情
      // 注意：getAllAShareQuotes 可能返回的是 SimpleQuote，需要获取完整数据
      const quotes = await sdk.getAllAShareQuotes({
        batchSize: 300,
        concurrency: 5,
        onProgress: (completed, total) => {
          setLoadingProgress({ completed, total })
        },
      })
      
      // 由于 getAllAShareQuotes 可能不包含所有字段，我们需要批量获取完整数据
      // 但为了性能，先使用现有数据，后续可以优化为批量获取完整数据
      const stockData: StockQuote[] = quotes.map((q: any) => {
        // 计算分时强度（当日涨幅相对于昨收的强度）
        const minuteStrength = q.prevClose && q.price ? 
          ((q.price - q.prevClose) / q.prevClose) * 100 : 0
        
        return {
          code: q.code,
          name: q.name,
          price: q.price || 0,
          change: q.change || 0,
          changePercent: q.changePercent || 0,
          volume: q.volume || 0,
          amount: q.amount || 0,
          high: q.high || 0,
          low: q.low || 0,
          open: q.open || 0,
          prevClose: q.prevClose || 0,
          // 新增字段
          circulatingMarketValue: q.circulatingMarketValue || q.circulatingValue || q.floatMarketValue || 0,
          volumeRatio: q.volumeRatio || q.volRatio || q.volumeRate || 0,
          turnoverRate: q.turnoverRate || q.turnover || q.turnoverRatio || 0,
          minuteStrength: minuteStrength,
        }
      })
      
      setStocks(stockData)
      applyFilters(stockData, filters)
    } catch (error) {
      console.error('加载股票数据失败:', error)
      alert('加载股票数据失败，请检查网络连接')
    } finally {
      setLoading(false)
      setLoadingProgress({ completed: 0, total: 0 })
    }
  }

  const applyFilters = (stockList: StockQuote[], filterConfig: typeof filters) => {
    let filtered = stockList.filter(stock => {
      // 排除已剔除的股票
      if (isExcluded(stock.code)) {
        return false
      }
      // 当日涨幅区间筛选
      if (stock.changePercent < filterConfig.minChangePercent || 
          stock.changePercent > filterConfig.maxChangePercent) {
        return false
      }

      // 股价区间筛选
      if (stock.price < filterConfig.minPrice || 
          stock.price > filterConfig.maxPrice) {
        return false
      }

      // 流通市值筛选（注意：输入是亿元，需要转换为元进行比较）
      const circulatingValue = stock.circulatingMarketValue || 0
      const minCirculatingValue = filterConfig.minCirculatingMarketValue * 100000000 // 亿元转元
      const maxCirculatingValue = filterConfig.maxCirculatingMarketValue === Infinity ? 
        Infinity : filterConfig.maxCirculatingMarketValue * 100000000 // 亿元转元
      if (circulatingValue < minCirculatingValue || 
          circulatingValue > maxCirculatingValue) {
        return false
      }

      // 量比筛选
      const volumeRatio = stock.volumeRatio || 0
      if (volumeRatio < filterConfig.minVolumeRatio || 
          volumeRatio > filterConfig.maxVolumeRatio) {
        return false
      }

      // 换手率筛选（注意：API返回的可能是小数形式，需要转换为百分比）
      const turnoverRate = stock.turnoverRate || 0
      const turnoverRatePercent = turnoverRate < 1 ? turnoverRate * 100 : turnoverRate
      if (turnoverRatePercent < filterConfig.minTurnoverRate || 
          turnoverRatePercent > filterConfig.maxTurnoverRate) {
        return false
      }

      // 分时强度筛选
      const minuteStrength = stock.minuteStrength || 0
      if (minuteStrength < filterConfig.minMinuteStrength || 
          minuteStrength > filterConfig.maxMinuteStrength) {
        return false
      }

      // 过滤ST股票（开关为true时排除ST）
      if (filterConfig.filterST) {
        const isST = stock.name.includes('ST') || stock.name.includes('*ST')
        if (isST) {
          return false
        }
      }

      // 过滤科创板（开关为true时排除科创板）
      if (filterConfig.filterChiNext) {
        const codeStr = stock.code.replace(/^sz|^sh|^bj/, '') // 移除前缀
        const isSciTech = codeStr.startsWith('688') // 科创板代码以688开头
        if (isSciTech) {
          return false
        }
      }

      return true
    })

    filtered.sort((a, b) => {
      let aVal: number
      let bVal: number
      
      switch (filterConfig.sortBy) {
        case 'changePercent':
          aVal = a.changePercent
          bVal = b.changePercent
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'circulatingMarketValue':
          aVal = a.circulatingMarketValue || 0
          bVal = b.circulatingMarketValue || 0
          break
        case 'volumeRatio':
          aVal = a.volumeRatio || 0
          bVal = b.volumeRatio || 0
          break
        case 'turnoverRate':
          aVal = (a.turnoverRate || 0) < 1 ? (a.turnoverRate || 0) * 100 : (a.turnoverRate || 0)
          bVal = (b.turnoverRate || 0) < 1 ? (b.turnoverRate || 0) * 100 : (b.turnoverRate || 0)
          break
        default:
          aVal = a.changePercent
          bVal = b.changePercent
      }
      
      if (filterConfig.sortOrder === 'desc') {
        return bVal - aVal
      } else {
        return aVal - bVal
      }
    })

    setFilteredStocks(filtered)
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    applyFilters(stocks, newFilters)
  }

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      // 清空搜索时，恢复显示所有股票（应用筛选条件）
      applyFilters(stocks, filters)
      return
    }

    setLoading(true)
    try {
      const results = await sdk.search(keyword)
      if (results.length > 0) {
        // 搜索时最多显示前100个结果
        const codes = results.slice(0, 100).map(r => r.code)
        const quotes = await sdk.getSimpleQuotes(codes)
        
        const stockData: StockQuote[] = quotes.map((q: any) => {
          // 计算分时强度（当日涨幅相对于昨收的强度）
          const minuteStrength = q.prevClose && q.price ? 
            ((q.price - q.prevClose) / q.prevClose) * 100 : 0
          
          return {
            code: q.code,
            name: q.name,
            price: q.price || 0,
            change: q.change || 0,
            changePercent: q.changePercent || 0,
            volume: q.volume || 0,
            amount: q.amount || 0,
            high: q.high || 0,
            low: q.low || 0,
            open: q.open || 0,
            prevClose: q.prevClose || 0,
            // 新增字段
            circulatingMarketValue: q.circulatingMarketValue || q.circulatingValue || q.floatMarketValue || 0,
            volumeRatio: q.volumeRatio || q.volRatio || q.volumeRate || 0,
            turnoverRate: q.turnoverRate || q.turnover || q.turnoverRatio || 0,
            minuteStrength: minuteStrength,
          }
        })
        
        // 搜索结果显示时也应用筛选条件
        applyFilters(stockData, filters)
      } else {
        setFilteredStocks([])
      }
    } catch (error) {
      console.error('搜索失败:', error)
      alert('搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onLoadStocks={loadStocks}
        onSearch={handleSearch}
        loading={loading}
        loadingProgress={loadingProgress}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'stocks'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            股票列表
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'watchlist'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            自选股
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'rankings'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            排行榜
          </button>
          <button
            onClick={() => setActiveTab('industry')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'industry'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            板块分析
          </button>
        </div>

        {activeTab === 'stocks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 sticky top-4 self-start">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="lg:col-span-3">
              {selectedStock ? (
                <StockDetail
                  code={selectedStock}
                  sdk={sdk}
                  onBack={() => setSelectedStock(null)}
                />
              ) : (
                <StockList
                  stocks={filteredStocks}
                  loading={loading}
                  onSelectStock={setSelectedStock}
                  onExcludeStock={() => {
                    // 重新应用筛选，排除已剔除的股票
                    applyFilters(stocks, filters)
                  }}
                />
              )}
            </div>
          </div>
        ) : activeTab === 'watchlist' ? (
          <div>
            {selectedStock ? (
              <StockDetail
                code={selectedStock}
                sdk={sdk}
                onBack={() => setSelectedStock(null)}
              />
            ) : (
              <WatchlistPanel
                sdk={sdk}
                onSelectStock={setSelectedStock}
              />
            )}
          </div>
        ) : activeTab === 'rankings' ? (
          <div>
            {selectedStock ? (
              <StockDetail
                code={selectedStock}
                sdk={sdk}
                onBack={() => setSelectedStock(null)}
              />
            ) : (
              <RankingsPanel
                sdk={sdk}
                stocks={stocks}
                onSelectStock={setSelectedStock}
              />
            )}
          </div>
        ) : (
          <IndustryPanel sdk={sdk} />
        )}
      </div>
    </div>
  )
}

export default App
