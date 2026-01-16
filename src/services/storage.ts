// 本地存储服务，用于保存自选股等配置

const STORAGE_KEYS = {
  WATCHLIST: 'stock_watchlist',
  SETTINGS: 'stock_settings',
  EXCLUDED_STOCKS: 'stock_excluded',
} as const

export interface ExcludedStock {
  code: string
  name: string
  reason: string
  excludedAt: number // 时间戳
}

export interface WatchlistGroup {
  id: string
  name: string
  codes: string[]
}

export interface Watchlist {
  groups: WatchlistGroup[]
}

// 获取自选股列表
export function getWatchlist(): Watchlist {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('读取自选股失败:', error)
  }
  
  // 默认返回一个默认分组
  return {
    groups: [
      {
        id: 'default',
        name: '默认分组',
        codes: [],
      },
    ],
  }
}

// 保存自选股列表
export function saveWatchlist(watchlist: Watchlist): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(watchlist))
  } catch (error) {
    console.error('保存自选股失败:', error)
  }
}

// 添加股票到自选股
export function addToWatchlist(code: string, groupId: string = 'default'): void {
  const watchlist = getWatchlist()
  const group = watchlist.groups.find(g => g.id === groupId) || watchlist.groups[0]
  
  if (!group.codes.includes(code)) {
    group.codes.push(code)
    saveWatchlist(watchlist)
  }
}

// 从自选股移除股票
export function removeFromWatchlist(code: string, groupId?: string): void {
  const watchlist = getWatchlist()
  
  if (groupId) {
    const group = watchlist.groups.find(g => g.id === groupId)
    if (group) {
      group.codes = group.codes.filter(c => c !== code)
      saveWatchlist(watchlist)
    }
  } else {
    // 从所有分组中移除
    watchlist.groups.forEach(group => {
      group.codes = group.codes.filter(c => c !== code)
    })
    saveWatchlist(watchlist)
  }
}

// 检查股票是否在自选股中
export function isInWatchlist(code: string): boolean {
  const watchlist = getWatchlist()
  return watchlist.groups.some(group => group.codes.includes(code))
}

// 获取所有自选股代码
export function getAllWatchlistCodes(): string[] {
  const watchlist = getWatchlist()
  const codes: string[] = []
  watchlist.groups.forEach(group => {
    codes.push(...group.codes)
  })
  // 去重
  return Array.from(new Set(codes))
}

// 添加分组
export function addGroup(name: string): string {
  const watchlist = getWatchlist()
  const newGroup: WatchlistGroup = {
    id: `group_${Date.now()}`,
    name,
    codes: [],
  }
  watchlist.groups.push(newGroup)
  saveWatchlist(watchlist)
  return newGroup.id
}

// 删除分组
export function removeGroup(groupId: string): void {
  const watchlist = getWatchlist()
  watchlist.groups = watchlist.groups.filter(g => g.id !== groupId)
  saveWatchlist(watchlist)
}

// 重命名分组
export function renameGroup(groupId: string, newName: string): void {
  const watchlist = getWatchlist()
  const group = watchlist.groups.find(g => g.id === groupId)
  if (group) {
    group.name = newName
    saveWatchlist(watchlist)
  }
}

// ========== 剔除股票管理 ==========

// 获取剔除股票列表
export function getExcludedStocks(): ExcludedStock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXCLUDED_STOCKS)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('读取剔除股票列表失败:', error)
  }
  return []
}

// 保存剔除股票列表
export function saveExcludedStocks(excludedStocks: ExcludedStock[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXCLUDED_STOCKS, JSON.stringify(excludedStocks))
  } catch (error) {
    console.error('保存剔除股票列表失败:', error)
  }
}

// 剔除股票
export function excludeStock(code: string, name: string, reason: string): void {
  const excludedStocks = getExcludedStocks()
  // 检查是否已存在
  if (!excludedStocks.find(s => s.code === code)) {
    excludedStocks.push({
      code,
      name,
      reason,
      excludedAt: Date.now(),
    })
    saveExcludedStocks(excludedStocks)
  }
}

// 恢复股票（从剔除列表中移除）
export function restoreStock(code: string): void {
  const excludedStocks = getExcludedStocks()
  const filtered = excludedStocks.filter(s => s.code !== code)
  saveExcludedStocks(filtered)
}

// 检查股票是否被剔除
export function isExcluded(code: string): boolean {
  const excludedStocks = getExcludedStocks()
  return excludedStocks.some(s => s.code === code)
}

// 获取剔除原因
export function getExcludeReason(code: string): string | null {
  const excludedStocks = getExcludedStocks()
  const stock = excludedStocks.find(s => s.code === code)
  return stock?.reason || null
}
