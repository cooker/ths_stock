// 本地存储服务，用于保存自选股等配置

const STORAGE_KEYS = {
  WATCHLIST: 'stock_watchlist',
  SETTINGS: 'stock_settings',
} as const

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
