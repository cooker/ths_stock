import { useState } from 'react'
import { Filter, X } from 'lucide-react'

export interface FilterConfig {
  // 当日涨幅区间
  minChangePercent: number
  maxChangePercent: number
  // 股价区间
  minPrice: number
  maxPrice: number
  // 流通市值（单位：元）
  minCirculatingMarketValue: number
  maxCirculatingMarketValue: number
  // 量比
  minVolumeRatio: number
  maxVolumeRatio: number
  // 换手率（%）
  minTurnoverRate: number
  maxTurnoverRate: number
  // 分时强度
  minMinuteStrength: number
  maxMinuteStrength: number
  // 过滤ST开关（true=排除ST，false=不筛选）
  filterST: boolean
  // 过滤创业板开关（true=排除创业板，false=不筛选）
  filterChiNext: boolean
  // 排序
  sortBy: 'changePercent' | 'price' | 'circulatingMarketValue' | 'volumeRatio' | 'turnoverRate'
  sortOrder: 'asc' | 'desc'
}

interface FilterPanelProps {
  filters: FilterConfig
  onFilterChange: (filters: FilterConfig) => void
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [isOpen, setIsOpen] = useState(true)

  const handleApply = () => {
    onFilterChange(localFilters)
  }

  const handleReset = () => {
    const resetFilters: FilterConfig = {
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
      sortBy: 'changePercent',
      sortOrder: 'desc',
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">筛选条件</h2>
        </div>
        <X className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gray-200 max-h-[600px] overflow-y-auto">
          {/* 当日涨幅区间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当日涨幅区间 (%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minChangePercent === -Infinity ? '' : localFilters.minChangePercent}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minChangePercent: e.target.value ? Number(e.target.value) : -Infinity,
                  })
                }
                placeholder="最小涨幅"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxChangePercent === Infinity ? '' : localFilters.maxChangePercent}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxChangePercent: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最大涨幅"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 股价区间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              股价区间 (元)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minPrice === 0 ? '' : localFilters.minPrice}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minPrice: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="最低价"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxPrice === Infinity ? '' : localFilters.maxPrice}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxPrice: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最高价"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 流通市值 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              流通市值 (亿元)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minCirculatingMarketValue === 0 ? '' : localFilters.minCirculatingMarketValue}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minCirculatingMarketValue: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="最小值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxCirculatingMarketValue === Infinity ? '' : localFilters.maxCirculatingMarketValue}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxCirculatingMarketValue: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最大值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 量比 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              量比
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minVolumeRatio === 0 ? '' : localFilters.minVolumeRatio}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minVolumeRatio: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="最小值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxVolumeRatio === Infinity ? '' : localFilters.maxVolumeRatio}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxVolumeRatio: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最大值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 换手率 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              换手率 (%)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minTurnoverRate === 0 ? '' : localFilters.minTurnoverRate}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minTurnoverRate: e.target.value ? Number(e.target.value) : 0,
                  })
                }
                placeholder="最小值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxTurnoverRate === Infinity ? '' : localFilters.maxTurnoverRate}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxTurnoverRate: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最大值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 分时强度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分时强度
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={localFilters.minMinuteStrength === -Infinity ? '' : localFilters.minMinuteStrength}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minMinuteStrength: e.target.value ? Number(e.target.value) : -Infinity,
                  })
                }
                placeholder="最小值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                step="0.01"
                value={localFilters.maxMinuteStrength === Infinity ? '' : localFilters.maxMinuteStrength}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxMinuteStrength: e.target.value ? Number(e.target.value) : Infinity,
                  })
                }
                placeholder="最大值"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 过滤ST开关 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.filterST}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    filterST: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">过滤ST股票</span>
            </label>
          </div>

          {/* 过滤创业板开关 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.filterChiNext}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    filterChiNext: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">过滤创业板</span>
            </label>
          </div>

          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序方式
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sortBy: e.target.value as FilterConfig['sortBy'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="changePercent">涨跌幅</option>
              <option value="price">股价</option>
              <option value="circulatingMarketValue">流通市值</option>
              <option value="volumeRatio">量比</option>
              <option value="turnoverRate">换手率</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序顺序
            </label>
            <select
              value={localFilters.sortOrder}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sortOrder: e.target.value as FilterConfig['sortOrder'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              应用筛选
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
