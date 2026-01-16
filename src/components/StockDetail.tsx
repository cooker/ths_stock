import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import { StockSDK } from 'stock-sdk'
import { formatStockCode } from '../utils/stockCode'

interface StockDetailProps {
  code: string
  sdk: StockSDK
  onBack: () => void
}

export default function StockDetail({ code, sdk, onBack }: StockDetailProps) {
  const [klineData, setKlineData] = useState<any>(null)
  const [minuteKlineData, setMinuteKlineData] = useState<any>(null)
  const [indicators, setIndicators] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'kline' | 'minute'>('kline')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 格式化股票代码，确保包含市场前缀（sh、sz、bj等）
      const formattedCode = formatStockCode(code)
      console.log('原始代码:', code, '格式化后:', formattedCode)
      
      // 优先使用 getFullQuotes 获取详细行情数据
      let quoteData: any = null
      
      try {
        const quotes = await sdk.getFullQuotes([formattedCode])
        if (quotes && quotes.length > 0) {
          quoteData = quotes[0]
        }
      } catch (fullError) {
        console.warn('getFullQuotes 失败，尝试 getSimpleQuotes:', fullError)
      }

      // 如果 getFullQuotes 失败，使用 getSimpleQuotes 作为备用
      if (!quoteData) {
        try {
          const simpleQuotes = await sdk.getSimpleQuotes([formattedCode])
          if (simpleQuotes && simpleQuotes.length > 0) {
            quoteData = simpleQuotes[0]
          }
        } catch (simpleError) {
          console.error('getSimpleQuotes 也失败:', simpleError)
        }
      }

      if (!quoteData) {
        setError('未找到该股票数据')
        setLoading(false)
        return
      }

      // 打印原始数据以便调试
      console.log('获取到的股票数据:', quoteData)
      console.log('市值相关字段:', {
        totalMarketValue: quoteData.totalMarketValue,
        totalValue: quoteData.totalValue,
        marketValue: quoteData.marketValue,
        totalMarketCap: quoteData.totalMarketCap,
        mktValue: quoteData.mktValue,
        circulatingMarketValue: quoteData.circulatingMarketValue,
        circulatingValue: quoteData.circulatingValue,
        floatMarketValue: quoteData.floatMarketValue,
        floatValue: quoteData.floatValue,
        circulatingMarketCap: quoteData.circulatingMarketCap,
        floatCap: quoteData.floatCap,
      })
      
      // 标准化数据字段，确保所有字段都有值
      // 市值字段可能有多种命名方式，尝试多种可能的字段名
      const getTotalMarketValue = () => {
        return quoteData.totalMarketValue || 
               quoteData.totalValue || 
               quoteData.marketValue || 
               quoteData.totalMarketCap || 
               quoteData.mktValue ||
               quoteData.marketCap ||
               quoteData.totalCap ||
               undefined
      }
      
      const getCirculatingMarketValue = () => {
        return quoteData.circulatingMarketValue || 
               quoteData.circulatingValue || 
               quoteData.floatMarketValue || 
               quoteData.floatValue ||
               quoteData.circulatingMarketCap ||
               quoteData.floatCap ||
               quoteData.circulatingCap ||
               undefined
      }
      
      const normalizedQuote = {
        code: quoteData.code || formattedCode,
        name: quoteData.name || '--',
        price: quoteData.price || quoteData.current || quoteData.now || 0,
        change: quoteData.change || quoteData.changeAmount || 0,
        changePercent: quoteData.changePercent || quoteData.changePct || 0,
        open: quoteData.open || quoteData.todayOpen || quoteData.openPrice || 0,
        prevClose: quoteData.prevClose || quoteData.yesterdayClose || quoteData.preClose || quoteData.lastClose || 0,
        high: quoteData.high || quoteData.todayHigh || quoteData.highPrice || 0,
        low: quoteData.low || quoteData.todayLow || quoteData.lowPrice || 0,
        volume: quoteData.volume || quoteData.turnoverVolume || 0,
        amount: quoteData.amount || quoteData.turnoverAmount || quoteData.totalAmount || 0,
        turnoverRate: quoteData.turnoverRate || quoteData.turnover || quoteData.turnoverRatio,
        volumeRatio: quoteData.volumeRatio || quoteData.volRatio || quoteData.volumeRate,
        pe: quoteData.pe || quoteData.peRatio || quoteData.priceEarningRatio,
        pb: quoteData.pb || quoteData.pbRatio || quoteData.priceBookRatio,
        totalMarketValue: getTotalMarketValue(),
        circulatingMarketValue: getCirculatingMarketValue(),
        // 保留原始数据以便调试
        _raw: quoteData,
      }
      
      setQuote(normalizedQuote)

      // 获取历史K线数据（使用 getHistoryKline）
      try {
        const historyKline = await sdk.getHistoryKline(formattedCode, {
          period: 'daily' as any,
        } as any)
        
        if (historyKline && historyKline.length > 0) {
          // 手动计算技术指标
          const closes = historyKline.map((item: any) => Number(item.close) || 0)
          const ma5 = calculateMA(closes, 5)
          const ma10 = calculateMA(closes, 10)
          const ma20 = calculateMA(closes, 20)
          
          setKlineData({ data: historyKline })
          setIndicators({
            MA: {
              MA5: ma5,
              MA10: ma10,
              MA20: ma20,
            },
          })
        } else {
          console.warn('getHistoryKline 返回空数据')
        }
      } catch (klineError) {
        console.error('获取K线数据失败:', klineError)
      }

      // 获取今日走势数据（使用 getMinuteKline）
      try {
        const minuteKline = await sdk.getMinuteKline(formattedCode, {
          period: '1', // 1分钟K线
        })
        
        if (minuteKline && minuteKline.length > 0) {
          setMinuteKlineData({ data: minuteKline })
        } else {
          console.warn('getMinuteKline 返回空数据')
        }
      } catch (minuteError) {
        console.error('获取今日走势数据失败:', minuteError)
      }
    } catch (error: any) {
      console.error('加载数据失败:', error)
      setError(error?.message || '加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  // 计算移动平均线
  const calculateMA = (data: number[], period: number): number[] => {
    const result: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN)
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        result.push(sum / period)
      }
    }
    return result
  }

  // 格式化成交量
  const formatVolume = (volume: number | undefined): string => {
    if (!volume || volume === 0) return '--'
    if (volume >= 10000) {
      return (volume / 10000).toFixed(2) + '万手'
    }
    return volume.toFixed(0) + '手'
  }

  // 格式化成交额
  const formatAmount = (amount: number | undefined): string => {
    if (!amount || amount === 0) return '--'
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(2) + '亿'
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(2) + '万'
    }
    return amount.toFixed(2)
  }

  // 格式化市值
  // 注意：stock-sdk 返回的市值单位可能是"元"或"万元"
  // 如果数值很大（>1000亿），可能是"元"单位
  // 如果数值较小（<1000），可能是"万元"单位
  const formatMarketValue = (value: number | undefined): string => {
    if (!value || value === 0) return '--'
    const numValue = Number(value)
    if (isNaN(numValue)) return '--'
    
    // 如果数值很大（>1000亿），假设单位是"元"，需要转换为"亿元"
    if (numValue >= 100000000000) {
      return (numValue / 100000000).toFixed(2) + '亿'
    }
    // 如果数值较大（>1000万），假设单位是"元"，需要转换为"亿元"或"万元"
    else if (numValue >= 10000000) {
      return (numValue / 100000000).toFixed(2) + '亿'
    }
    // 如果数值中等（>1000），可能是"万元"单位，直接显示为"亿元"
    else if (numValue >= 1000) {
      return (numValue / 10000).toFixed(2) + '亿'
    }
    // 如果数值较小（>0），可能是"万元"单位，显示为"亿元"或"万元"
    else if (numValue >= 1) {
      return numValue.toFixed(2) + '亿'
    }
    // 如果数值很小（<1），可能是"亿元"单位，直接显示
    else {
      return (numValue * 10000).toFixed(2) + '万'
    }
  }

  // 格式化换手率
  const formatTurnoverRate = (value: number | undefined): string => {
    if (!value || value === 0) return '--'
    const numValue = Number(value)
    if (isNaN(numValue)) return '--'
    // 如果值小于1，可能是小数形式（如0.1396），需要乘以100
    // 如果值大于1，可能已经是百分比形式
    if (numValue < 1) {
      return (numValue * 100).toFixed(2) + '%'
    }
    return numValue.toFixed(2) + '%'
  }

  // 获取今日走势图表配置
  const getMinuteKlineOption = () => {
    const displayCode = formatStockCode(code)
    if (!minuteKlineData || !minuteKlineData.data || minuteKlineData.data.length === 0) {
      return {
        title: {
          text: `${displayCode} 今日走势`,
          left: 'center',
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无今日走势数据',
            fontSize: 16,
            fill: '#999',
          },
        },
      }
    }

    // 处理时间格式
    const times = minuteKlineData.data.map((item: any) => {
      if (item.time) {
        return typeof item.time === 'string' ? item.time : item.time.toString()
      }
      return item.date || item.timestamp || ''
    })
    
    const prices = minuteKlineData.data.map((item: any) => Number(item.price || item.close) || 0)
    const volumes = minuteKlineData.data.map((item: any) => Number(item.volume) || 0)

    // 计算均价线
    const avgPrices: number[] = []
    for (let i = 0; i < prices.length; i++) {
      const sum = prices.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)
      avgPrices.push(sum / (i + 1))
    }

    return {
      title: {
        text: `${displayCode} 今日走势`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          const param = params[0]
          return `
            <div>
              <div>时间: ${param.axisValue}</div>
              <div>价格: ${param.value.toFixed(2)}</div>
              ${params[1] ? `<div>均价: ${params[1].value.toFixed(2)}</div>` : ''}
            </div>
          `
        },
      },
      legend: {
        data: ['价格', '均价', '成交量'],
        top: 30,
      },
      grid: [
        {
          left: '10%',
          right: '8%',
          top: '15%',
          height: '50%',
        },
        {
          left: '10%',
          right: '8%',
          top: '70%',
          height: '15%',
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: times,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
        },
        {
          type: 'category',
          gridIndex: 1,
          data: times,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
          },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '90%',
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: '价格',
          type: 'line',
          data: prices,
          smooth: true,
          lineStyle: {
            color: '#0ea5e9',
            width: 2,
          },
          itemStyle: {
            color: '#0ea5e9',
          },
        },
        {
          name: '均价',
          type: 'line',
          data: avgPrices,
          smooth: true,
          lineStyle: {
            color: '#f59e0b',
            width: 1,
          },
          itemStyle: {
            color: '#f59e0b',
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex
              if (idx === 0) return '#999'
              return prices[idx] >= prices[idx - 1] ? '#ef5350' : '#26a69a'
            },
          },
        },
      ],
    }
  }

  const getKlineOption = () => {
    const displayCode = formatStockCode(code)
    if (!klineData || !klineData.data || klineData.data.length === 0) {
      return {
        title: {
          text: `${displayCode} K线图`,
          left: 'center',
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无K线数据',
            fontSize: 16,
            fill: '#999',
          },
        },
      }
    }

    // 处理日期格式，支持多种格式
    const dates = klineData.data.map((item: any) => {
      if (item.date) {
        // 如果是字符串，直接使用；如果是日期对象，转换为字符串
        return typeof item.date === 'string' ? item.date : item.date.toISOString().split('T')[0]
      }
      // 如果没有date字段，尝试使用time或其他字段
      return item.time || item.timestamp || ''
    })
    
    const opens = klineData.data.map((item: any) => Number(item.open) || 0)
    const closes = klineData.data.map((item: any) => Number(item.close) || 0)
    const volumes = klineData.data.map((item: any) => Number(item.volume) || 0)

    const ma5 = (indicators?.MA?.MA5 || []).map((v: any) => isNaN(v) ? null : Number(v))
    const ma10 = (indicators?.MA?.MA10 || []).map((v: any) => isNaN(v) ? null : Number(v))
    const ma20 = (indicators?.MA?.MA20 || []).map((v: any) => isNaN(v) ? null : Number(v))

    return {
      title: {
        text: `${displayCode} K线图`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['K线', 'MA5', 'MA10', 'MA20', '成交量'],
        top: 30,
      },
      grid: [
        {
          left: '10%',
          right: '8%',
          top: '15%',
          height: '50%',
        },
        {
          left: '10%',
          right: '8%',
          top: '70%',
          height: '15%',
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          scale: true,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true,
          },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '90%',
          start: 50,
          end: 100,
        },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: klineData.data.map((item: any) => [
            item.open,
            item.close,
            item.low,
            item.high,
          ]),
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a',
          },
        },
        {
          name: 'MA5',
          type: 'line',
          data: ma5,
          smooth: true,
          lineStyle: {
            width: 1,
          },
        },
        {
          name: 'MA10',
          type: 'line',
          data: ma10,
          smooth: true,
          lineStyle: {
            width: 1,
          },
        },
        {
          name: 'MA20',
          type: 'line',
          data: ma20,
          smooth: true,
          lineStyle: {
            width: 1,
          },
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex
              return closes[idx] >= opens[idx] ? '#ef5350' : '#26a69a'
            },
          },
        },
      ],
    }
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          返回列表
        </button>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {quote ? (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">股票名称</div>
                  <div className="text-lg font-semibold text-gray-900">{quote.name || '--'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">股票代码</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatStockCode(quote.code || code)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">今日价格</div>
                  <div className={`text-lg font-semibold ${
                    (quote.change || 0) > 0 ? 'text-red-600' : (quote.change || 0) < 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {quote.price && quote.price > 0 ? quote.price.toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">涨跌幅</div>
                  <div className={`text-lg font-semibold flex items-center gap-1 ${
                    (quote.changePercent || 0) > 0 ? 'text-red-600' : (quote.changePercent || 0) < 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {(quote.changePercent || 0) > 0 ? <TrendingUp className="w-4 h-4" /> : (quote.changePercent || 0) < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                    {(quote.changePercent || 0) > 0 ? '+' : ''}
                    {quote.changePercent !== undefined && quote.changePercent !== null ? quote.changePercent.toFixed(2) : '--'}%
                  </div>
                </div>
              </div>
            </div>

            {/* 价格信息 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">价格信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">今开</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.open && quote.open > 0 ? quote.open.toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">昨收</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.prevClose && quote.prevClose > 0 ? quote.prevClose.toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">最高</div>
                  <div className="text-lg font-semibold text-red-600">
                    {quote.high && quote.high > 0 ? quote.high.toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">最低</div>
                  <div className="text-lg font-semibold text-green-600">
                    {quote.low && quote.low > 0 ? quote.low.toFixed(2) : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* 成交信息 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">成交信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">成交量</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatVolume(quote.volume)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">成交额</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatAmount(quote.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">换手率</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTurnoverRate(quote.turnoverRate || quote.turnover || quote.turnoverRatio)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">量比</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.volumeRatio || quote.volRatio || quote.volumeRate ? 
                      Number(quote.volumeRatio || quote.volRatio || quote.volumeRate).toFixed(2) : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* 估值信息 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">估值信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">市盈率</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.pe || quote.peRatio || quote.priceEarningRatio ? 
                      Number(quote.pe || quote.peRatio || quote.priceEarningRatio).toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">市净率</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {quote.pb || quote.pbRatio || quote.priceBookRatio ? 
                      Number(quote.pb || quote.pbRatio || quote.priceBookRatio).toFixed(2) : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    总市值
                    <span className="text-xs text-gray-400 ml-1">(单位：元)</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMarketValue(
                      quote.totalMarketValue || 
                      quote.totalValue || 
                      quote.marketValue ||
                      quote.totalMarketCap ||
                      quote.mktValue ||
                      quote.marketCap ||
                      quote.totalCap ||
                      (quote._raw && (quote._raw.totalMarketValue || quote._raw.totalValue || quote._raw.marketValue || quote._raw.totalMarketCap))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    流通市值
                    <span className="text-xs text-gray-400 ml-1">(元)</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMarketValue(
                      quote.circulatingMarketValue || 
                      quote.circulatingValue || 
                      quote.floatMarketValue ||
                      quote.floatValue ||
                      quote.circulatingMarketCap ||
                      quote.floatCap ||
                      quote.circulatingCap ||
                      (quote._raw && (quote._raw.circulatingMarketValue || quote._raw.circulatingValue || quote._raw.floatMarketValue || quote._raw.circulatingMarketCap))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">暂无实时行情数据</p>
          </div>
        )}
      </div>

      {/* 图表切换和显示 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">图表分析</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('kline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                chartType === 'kline'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              K线图
            </button>
            <button
              onClick={() => setChartType('minute')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                chartType === 'minute'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              今日走势
            </button>
          </div>
        </div>

        {chartType === 'kline' ? (
          klineData && klineData.data && klineData.data.length > 0 ? (
            <ReactECharts
              option={getKlineOption()}
              style={{ height: '600px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-gray-600">暂无K线数据</p>
            </div>
          )
        ) : (
          minuteKlineData && minuteKlineData.data && minuteKlineData.data.length > 0 ? (
            <ReactECharts
              option={getMinuteKlineOption()}
              style={{ height: '600px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-gray-600">暂无今日走势数据</p>
            </div>
          )
        )}
      </div>

      {indicators && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">技术指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {indicators.MA && (
              <>
                <div>
                  <div className="text-sm text-gray-600">MA5</div>
                  <div className="text-lg font-semibold">
                    {indicators.MA.MA5?.[indicators.MA.MA5.length - 1]?.toFixed(2) || '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">MA10</div>
                  <div className="text-lg font-semibold">
                    {indicators.MA.MA10?.[indicators.MA.MA10.length - 1]?.toFixed(2) || '--'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">MA20</div>
                  <div className="text-lg font-semibold">
                    {indicators.MA.MA20?.[indicators.MA.MA20.length - 1]?.toFixed(2) || '--'}
                  </div>
                </div>
              </>
            )}
            {indicators.MACD && (
              <div>
                <div className="text-sm text-gray-600">MACD</div>
                <div className="text-lg font-semibold">
                  {indicators.MACD.DIF?.[indicators.MACD.DIF.length - 1]?.toFixed(4) || '--'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
