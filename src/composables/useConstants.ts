/** 奖品等级标签映射 */
const LEVEL_LABELS: Record<number, string> = {
  1: '特等奖',
  2: '一等奖',
  3: '二等奖',
  4: '三等奖',
  5: '四等奖',
  6: '参与奖'
}

export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] || `等级${level}`
}

/** 动态更新页面标题 */
export function updatePageTitle(title: string) {
  document.title = title ? `${title} - 抽奖系统` : '抽奖系统'
}
