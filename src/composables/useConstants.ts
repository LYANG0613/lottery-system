/** 奖品等级标签映射 */
const LEVEL_LABELS: Record<number, string> = {
  1: '特等奖',
  2: '一等奖',
  3: '二等奖',
  4: '三等奖',
  5: '四等奖',
  6: '参与奖'
}

/** 奖品等级配色映射（渐变背景，iconColor, textColor） */
const LEVEL_COLORS: Record<number, { gradient: string; iconColor: string; textColor: string }> = {
  1: { gradient: 'linear-gradient(135deg, #DC2626, #F59E0B)', iconColor: '#F59E0B', textColor: '#fff' },
  2: { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', iconColor: '#FFD700', textColor: '#fff' },
  3: { gradient: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', iconColor: '#CBD5E1', textColor: '#fff' },
  4: { gradient: 'linear-gradient(135deg, #CD7F32, #92400E)', iconColor: '#CD7F32', textColor: '#fff' },
  5: { gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)', iconColor: '#06B6D4', textColor: '#fff' },
  6: { gradient: 'linear-gradient(135deg, #10B981, #059669)', iconColor: '#10B981', textColor: '#fff' },
}

export function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] || `等级${level}`
}

export function getLevelColor(level: number) {
  return LEVEL_COLORS[level] || LEVEL_COLORS[6]
}

/** 动态更新页面标题 */
export function updatePageTitle(title: string) {
  document.title = title ? `${title} - 抽奖系统` : '抽奖系统'
}
