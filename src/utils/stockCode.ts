// 股票代码工具函数

/**
 * 格式化股票代码，确保包含市场前缀
 * @param code 股票代码（可能包含或不包含前缀）
 * @returns 格式化后的完整代码（如 sh600519, sz000001, bj430xxx）
 */
export function formatStockCode(code: string | undefined | null): string {
  if (!code) return '--'
  
  // 如果已经包含前缀，直接返回
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj')) {
    return code
  }
  
  // 根据代码规则添加前缀
  const codeNum = code.replace(/[^0-9]/g, '') // 提取数字部分
  
  if (codeNum.startsWith('60') || codeNum.startsWith('68')) {
    // 上海股票：60xxxx, 68xxxx
    return `sh${codeNum}`
  } else if (codeNum.startsWith('00') || codeNum.startsWith('30')) {
    // 深圳股票：00xxxx, 30xxxx
    return `sz${codeNum}`
  } else if (codeNum.startsWith('43') || codeNum.startsWith('83') || codeNum.startsWith('87')) {
    // 北京股票：43xxxx, 83xxxx, 87xxxx
    return `bj${codeNum}`
  }
  
  // 如果无法识别，返回原代码
  return code
}

/**
 * 获取股票代码的显示格式（带前缀）
 * @param code 股票代码
 * @returns 显示用的代码字符串
 */
export function getDisplayCode(code: string | undefined | null): string {
  return formatStockCode(code)
}
