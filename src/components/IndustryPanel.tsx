import { useState, useEffect } from 'react'
import { Building2, Lightbulb, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { StockSDK } from 'stock-sdk'
import { formatStockCode } from '../utils/stockCode'

interface IndustryPanelProps {
  sdk: StockSDK
}

interface SectorCard {
  name: string
  type: 'industry' | 'concept'
  changePercent: number
  amount?: number
  turnoverRate?: number
  volume?: number
  topStocks?: Array<{ code: string; name: string; changePercent: number }>
}

export default function IndustryPanel({ sdk }: IndustryPanelProps) {
  const [activeTab, setActiveTab] = useState<'industry' | 'concept' | 'all'>('all')
  const [industrySectors, setIndustrySectors] = useState<SectorCard[]>([])
  const [conceptSectors, setConceptSectors] = useState<SectorCard[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSector, setSelectedSector] = useState<SectorCard | null>(null)
  const [constituents, setConstituents] = useState<any[]>([])

  useEffect(() => {
    loadSectors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSectors = async () => {
    setLoading(true)
    try {
      // 加载行业板块
      try {
        const industryList = await sdk.getIndustryList()
        // getIndustrySpot 可能需要传递行业列表，或者不需要参数
        let industrySpot: any[] = []
        try {
          industrySpot = await (sdk.getIndustrySpot as any)(industryList) || await (sdk.getIndustrySpot as any)() || []
        } catch {
          // 如果传递参数失败，尝试不传参数
          try {
            industrySpot = await (sdk.getIndustrySpot as any)() || []
          } catch {
            industrySpot = []
          }
        }
        
        const industryData: SectorCard[] = industryList.map((industry: any) => {
          const industryName = typeof industry === 'string' ? industry : industry.name || industry
          const spot = industrySpot.find((s: any) => {
            const spotName = s.name || s
            return spotName === industryName
          })
          
          return {
            name: industryName,
            type: 'industry',
            changePercent: (spot as any)?.changePercent || (spot as any)?.change || 0,
            amount: (spot as any)?.amount || (spot as any)?.turnover || 0,
            turnoverRate: (spot as any)?.turnoverRate || (spot as any)?.turnover || 0,
            volume: (spot as any)?.volume || 0,
          }
        })
        industryData.sort((a, b) => b.changePercent - a.changePercent)
        setIndustrySectors(industryData)
      } catch (error) {
        console.error('加载行业板块失败:', error)
      }

      // 尝试加载概念板块（如果API存在）
      try {
        // 注意：stock-sdk 可能没有 getConceptList，这里先尝试
        if (typeof (sdk as any).getConceptList === 'function') {
          const conceptList = await (sdk as any).getConceptList()
          const conceptSpot = await (sdk as any).getConceptSpot?.() || []
          
          const conceptData: SectorCard[] = conceptList.map((concept: any) => {
            const conceptName = typeof concept === 'string' ? concept : concept.name || concept
            const spot = conceptSpot.find((s: any) => {
              const spotName = s.name || s
              return spotName === conceptName
            })
            
            return {
              name: conceptName,
              type: 'concept',
              changePercent: (spot as any)?.changePercent || (spot as any)?.change || 0,
              amount: (spot as any)?.amount || (spot as any)?.turnover || 0,
              turnoverRate: (spot as any)?.turnoverRate || (spot as any)?.turnover || 0,
              volume: (spot as any)?.volume || 0,
            }
          })
          conceptData.sort((a, b) => b.changePercent - a.changePercent)
          setConceptSectors(conceptData)
        }
      } catch (error) {
        console.warn('概念板块API不可用，仅显示行业板块')
      }
    } catch (error) {
      console.error('加载板块数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSector = async (sector: SectorCard) => {
    setSelectedSector(sector)
    try {
      if (sector.type === 'industry') {
        const stocks = await sdk.getIndustryConstituents(sector.name)
        setConstituents(stocks)
      } else if (sector.type === 'concept') {
        // 如果概念板块有对应的API
        if (typeof (sdk as any).getConceptConstituents === 'function') {
          const stocks = await (sdk as any).getConceptConstituents(sector.name)
          setConstituents(stocks)
        } else {
          setConstituents([])
        }
      }
    } catch (error) {
      console.error('加载成分股失败:', error)
      setConstituents([])
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const formatAmount = (amount: number) => {
    if (!amount || amount === 0) return '--'
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(2)}亿`
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(2)}万`
    }
    return amount.toFixed(2)
  }

  const getDisplaySectors = () => {
    if (activeTab === 'industry') return industrySectors
    if (activeTab === 'concept') return conceptSectors
    return [...industrySectors, ...conceptSectors]
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

  const displaySectors = getDisplaySectors()

  return (
    <div className="space-y-6">
      {/* 标签切换 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setActiveTab('industry')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'industry'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            行业板块
          </button>
          <button
            onClick={() => setActiveTab('concept')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'concept'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            概念板块
          </button>
          <div className="ml-auto text-sm text-gray-500">
            共 {displaySectors.length} 个板块
          </div>
        </div>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displaySectors.map((sector) => (
          <div
            key={`${sector.type}-${sector.name}`}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md cursor-pointer ${
              sector.type === 'industry'
                ? 'border-blue-200 hover:border-blue-400'
                : 'border-purple-200 hover:border-purple-400'
            } ${selectedSector?.name === sector.name && selectedSector?.type === sector.type ? 'ring-2 ring-primary-500' : ''}`}
            onClick={() => handleSelectSector(sector)}
          >
            <div className="p-4">
              {/* 板块类型标签 */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    sector.type === 'industry'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {sector.type === 'industry' ? '行业' : '概念'}
                </span>
                {sector.type === 'industry' ? (
                  <Building2 className="w-4 h-4 text-blue-500" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-purple-500" />
                )}
              </div>

              {/* 板块名称 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                {sector.name}
              </h3>

              {/* 涨跌幅 */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">涨跌幅</span>
                  <span
                    className={`text-lg font-bold flex items-center gap-1 ${getChangeColor(
                      sector.changePercent
                    )}`}
                  >
                    {sector.changePercent > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : sector.changePercent < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {sector.changePercent > 0 ? '+' : ''}
                    {sector.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 成交额 */}
              {sector.amount !== undefined && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">成交额</span>
                    <span className="text-gray-700 font-medium">
                      {formatAmount(sector.amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* 换手率 */}
              {sector.turnoverRate !== undefined && sector.turnoverRate > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">换手率</span>
                    <span className="text-gray-700 font-medium">
                      {sector.turnoverRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              {/* 查看详情按钮 */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-end text-primary-600 text-sm font-medium">
                  查看详情
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 成分股详情 */}
      {selectedSector && constituents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedSector.name} 成分股 ({constituents.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedSector(null)
                  setConstituents([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {constituents.slice(0, 30).map((stock: any, index: number) => {
                const stockCode = typeof stock === 'string' ? stock : stock.code
                const stockName = stock.name || ''
                const stockChange = stock.changePercent || 0
                return (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {formatStockCode(stockCode)}
                    </div>
                    {stockName && (
                      <div className="text-xs text-gray-500 mt-1">{stockName}</div>
                    )}
                    {stockChange !== 0 && (
                      <div className={`text-xs mt-1 ${getChangeColor(stockChange)}`}>
                        {stockChange > 0 ? '+' : ''}
                        {stockChange.toFixed(2)}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
