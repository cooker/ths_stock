import { useState, useEffect } from 'react'
import { Building2, TrendingUp, TrendingDown } from 'lucide-react'
import { StockSDK } from 'stock-sdk'

interface IndustryPanelProps {
  sdk: StockSDK
}

export default function IndustryPanel({ sdk }: IndustryPanelProps) {
  const [industries, setIndustries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [constituents, setConstituents] = useState<any[]>([])

  useEffect(() => {
    loadIndustries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadIndustries = async () => {
    setLoading(true)
    try {
      const industryList = await sdk.getIndustryList()
      const industrySpot = await sdk.getIndustrySpot()
      
      const industryData = industryList.map((industry: string) => {
        const spot = industrySpot.find((s: any) => s.name === industry)
        return {
          name: industry,
          changePercent: spot?.changePercent || 0,
          ...spot,
        }
      })

      industryData.sort((a, b) => b.changePercent - a.changePercent)
      setIndustries(industryData)
    } catch (error) {
      console.error('加载行业数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectIndustry = async (industryName: string) => {
    setSelectedIndustry(industryName)
    try {
      const stocks = await sdk.getIndustryConstituents(industryName)
      setConstituents(stocks)
    } catch (error) {
      console.error('加载成分股失败:', error)
    }
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">行业板块</h2>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    行业名称
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    涨跌幅
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {industries.map((industry) => (
                  <tr
                    key={industry.name}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{industry.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-medium flex items-center justify-end gap-1 ${getChangeColor(
                          industry.changePercent
                        )}`}
                      >
                        {industry.changePercent > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : industry.changePercent < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {industry.changePercent > 0 ? '+' : ''}
                        {industry.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSelectIndustry(industry.name)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        查看成分股
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              {selectedIndustry ? `${selectedIndustry} 成分股` : '选择行业查看成分股'}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {constituents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {constituents.slice(0, 20).map((stock: any, index: number) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{stock.code || stock}</div>
                    {stock.name && (
                      <div className="text-xs text-gray-500">{stock.name}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                请选择一个行业查看成分股
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
