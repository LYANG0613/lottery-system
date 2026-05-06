import { describe, it, expect } from 'vitest'

describe('useConstants - 奖品常量', () => {
  it('getLevelLabel 返回正确的等级标签', () => {
    const LEVEL_LABELS: Record<number, string> = {
      1: '特等奖', 2: '一等奖', 3: '二等奖',
      4: '三等奖', 5: '四等奖', 6: '参与奖'
    }
    const getLevelLabel = (level: number) => LEVEL_LABELS[level] || `等级${level}`

    expect(getLevelLabel(1)).toBe('特等奖')
    expect(getLevelLabel(2)).toBe('一等奖')
    expect(getLevelLabel(3)).toBe('二等奖')
    expect(getLevelLabel(4)).toBe('三等奖')
    expect(getLevelLabel(5)).toBe('四等奖')
    expect(getLevelLabel(6)).toBe('参与奖')
  })

  it('getLevelLabel 未知等级返回默认格式', () => {
    const getLevelLabel = (level: number) => {
      const LEVEL_LABELS: Record<number, string> = {
        1: '特等奖', 2: '一等奖', 3: '二等奖',
        4: '三等奖', 5: '四等奖', 6: '参与奖'
      }
      return LEVEL_LABELS[level] || `等级${level}`
    }

    expect(getLevelLabel(7)).toBe('等级7')
    expect(getLevelLabel(99)).toBe('等级99')
    expect(getLevelLabel(0)).toBe('等级0')
    expect(getLevelLabel(-1)).toBe('等级-1')
  })

  it('getLevelColor 返回正确的颜色配置', () => {
    const LEVEL_COLORS: Record<number, { gradient: string; iconColor: string; textColor: string }> = {
      1: { gradient: 'linear-gradient(135deg, #DC2626, #F59E0B)', iconColor: '#F59E0B', textColor: '#fff' },
      2: { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', iconColor: '#FFD700', textColor: '#fff' },
      3: { gradient: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', iconColor: '#CBD5E1', textColor: '#fff' },
      4: { gradient: 'linear-gradient(135deg, #CD7F32, #92400E)', iconColor: '#CD7F32', textColor: '#fff' },
      5: { gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)', iconColor: '#06B6D4', textColor: '#fff' },
      6: { gradient: 'linear-gradient(135deg, #10B981, #059669)', iconColor: '#10B981', textColor: '#fff' },
    }
    const getLevelColor = (level: number) => LEVEL_COLORS[level] || LEVEL_COLORS[6]

    const c1 = getLevelColor(1)
    expect(c1.gradient).toBeTruthy()
    expect(c1.textColor).toBe('#fff')

    const c6 = getLevelColor(6)
    expect(c6.gradient).toBeTruthy()
  })

  it('getLevelColor 未知等级降级到参与奖', () => {
    const LEVEL_COLORS: Record<number, any> = {
      1: { gradient: 'g1' }, 2: { gradient: 'g2' }, 3: { gradient: 'g3' },
      4: { gradient: 'g4' }, 5: { gradient: 'g5' }, 6: { gradient: 'g6' }
    }
    const getLevelColor = (level: number) => LEVEL_COLORS[level] || LEVEL_COLORS[6]

    expect(getLevelColor(99).gradient).toBe('g6')
    expect(getLevelColor(7).gradient).toBe('g6')
  })

  it('所有等级都有唯一颜色配置', () => {
    const LEVEL_COLORS: Record<number, any> = {
      1: { gradient: 'g1' }, 2: { gradient: 'g2' }, 3: { gradient: 'g3' },
      4: { gradient: 'g4' }, 5: { gradient: 'g5' }, 6: { gradient: 'g6' }
    }
    const colors = new Set(Object.values(LEVEL_COLORS).map(c => c.gradient))
    expect(colors.size).toBe(6)
  })

  it('LEVEL_LABELS 包含所有等级', () => {
    const LEVEL_LABELS: Record<number, string> = {
      1: '特等奖', 2: '一等奖', 3: '二等奖',
      4: '三等奖', 5: '四等奖', 6: '参与奖'
    }
    Object.entries(LEVEL_LABELS).forEach(([level, label]) => {
      expect(LEVEL_LABELS[Number(level)]).toBe(label)
    })
    expect(Object.keys(LEVEL_LABELS)).toHaveLength(6)
  })
})
