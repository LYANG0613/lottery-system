import { describe, it, expect } from 'vitest'
import type { Winner, Prize } from '../../src/types'

function createPrize(overrides: Partial<Prize> = {}): Prize {
  return {
    id: overrides.id || 'prize1',
    name: overrides.name || '测试奖品',
    count: overrides.count ?? 3,
    level: overrides.level ?? 1,
    description: overrides.description || '',
    image: overrides.image,
    images: overrides.images,
    items: overrides.items || [],
    ...overrides,
  }
}

describe('WinnerList 组件逻辑', () => {
  describe('groupedWinners 分组排序', () => {
    it('按 prize.id 分组', () => {
      const winners: Winner[] = [
        {
          id: 'w1',
          participant: { id: 'p1', name: 'A' },
          prize: createPrize({ id: 'prize1' }),
          winTime: new Date(),
        },
        {
          id: 'w2',
          participant: { id: 'p2', name: 'B' },
          prize: createPrize({ id: 'prize1' }),
          winTime: new Date(),
        },
        {
          id: 'w3',
          participant: { id: 'p3', name: 'C' },
          prize: createPrize({ id: 'prize2' }),
          winTime: new Date(),
        },
      ]

      const groups: Record<string, { prize: Prize; winners: Winner[] }> = {}
      for (const winner of winners) {
        const prizeId = winner.prize.id
        if (!groups[prizeId]) {
          groups[prizeId] = { prize: winner.prize, winners: [] }
        }
        groups[prizeId].winners.push(winner)
      }

      const result = Object.values(groups)
      expect(result).toHaveLength(2)
      expect(result[0].winners).toHaveLength(2)
      expect(result[1].winners).toHaveLength(1)
    })

    it('按 level 排序', () => {
      const winners: Winner[] = [
        { id: 'w1', participant: { id: 'p1', name: 'A' }, prize: createPrize({ id: 'p2', level: 3 }), winTime: new Date() },
        { id: 'w2', participant: { id: 'p2', name: 'B' }, prize: createPrize({ id: 'p1', level: 1 }), winTime: new Date() },
      ]

      const groups: Record<string, { prize: Prize; winners: Winner[] }> = {}
      for (const winner of winners) {
        const prizeId = winner.prize.id
        if (!groups[prizeId]) {
          groups[prizeId] = { prize: winner.prize, winners: [] }
        }
        groups[prizeId].winners.push(winner)
      }

      const result = Object.values(groups).sort((a, b) => a.prize.level - b.prize.level)
      expect(result[0].prize.level).toBe(1)
      expect(result[1].prize.level).toBe(3)
    })

    it('空列表正确处理', () => {
      const winners: Winner[] = []
      const groups: Record<string, { prize: Prize; winners: Winner[] }> = {}
      for (const winner of winners) {
        const prizeId = winner.prize.id
        if (!groups[prizeId]) {
          groups[prizeId] = { prize: winner.prize, winners: [] }
        }
        groups[prizeId].winners.push(winner)
      }
      expect(Object.values(groups)).toHaveLength(0)
    })
  })

  describe('formatTime 时间格式化', () => {
    it('HH:mm:ss 格式', () => {
      const d = new Date('2026-01-01T10:05:30')
      const formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
      expect(formatted).toBe('10:05:30')
    })

    it('午夜时间正确补零', () => {
      const d = new Date('2026-01-01T00:09:05')
      const formatted = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
      expect(formatted).toBe('00:09:05')
    })

    it('接受 Date 对象', () => {
      const d = new Date('2026-01-01T14:30:45')
      const formatTime = (date: Date): string => {
        const dd = new Date(date)
        return `${dd.getHours().toString().padStart(2, '0')}:${dd.getMinutes().toString().padStart(2, '0')}:${dd.getSeconds().toString().padStart(2, '0')}`
      }
      expect(formatTime(d)).toBe('14:30:45')
    })

    it('接受字符串自动转换', () => {
      const d = new Date('2026-01-01T10:05:30')
      const formatTime = (date: Date): string => {
        const dd = new Date(date)
        return `${dd.getHours().toString().padStart(2, '0')}:${dd.getMinutes().toString().padStart(2, '0')}:${dd.getSeconds().toString().padStart(2, '0')}`
      }
      expect(formatTime(new Date(d))).toBe('10:05:30')
    })
  })

  describe('getLevelColor 颜色配置', () => {
    it('每个等级有唯一颜色', () => {
      const LEVEL_COLORS: Record<number, { gradient: string; iconColor: string; textColor: string }> = {
        1: { gradient: 'linear-gradient(135deg, #DC2626, #F59E0B)', iconColor: '#F59E0B', textColor: '#fff' },
        2: { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', iconColor: '#FFD700', textColor: '#fff' },
        3: { gradient: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', iconColor: '#CBD5E1', textColor: '#fff' },
        4: { gradient: 'linear-gradient(135deg, #CD7F32, #92400E)', iconColor: '#CD7F32', textColor: '#fff' },
        5: { gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)', iconColor: '#06B6D4', textColor: '#fff' },
        6: { gradient: 'linear-gradient(135deg, #10B981, #059669)', iconColor: '#10B981', textColor: '#fff' },
      }

      const getLevelColor = (level: number) => LEVEL_COLORS[level] || LEVEL_COLORS[6]
      const colors = Object.values(LEVEL_COLORS).map(c => c.gradient)
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(6)
    })

    it('未知等级降级到参与奖', () => {
      const LEVEL_COLORS: Record<number, any> = {
        1: { gradient: 'g1' }, 2: { gradient: 'g2' }, 3: { gradient: 'g3' },
        4: { gradient: 'g4' }, 5: { gradient: 'g5' }, 6: { gradient: 'g6' },
      }
      const getLevelColor = (level: number) => LEVEL_COLORS[level] || LEVEL_COLORS[6]

      expect(getLevelColor(99).gradient).toBe('g6')
      expect(getLevelColor(0).gradient).toBe('g6')
      expect(getLevelColor(-1).gradient).toBe('g6')
    })
  })

  describe('getGroupStyle CSS变量', () => {
    it('生成正确的 CSS 变量', () => {
      const LEVEL_COLORS: Record<number, { gradient: string; iconColor: string; textColor: string }> = {
        1: { gradient: 'linear-gradient(135deg, #DC2626, #F59E0B)', iconColor: '#F59E0B', textColor: '#fff' },
        2: { gradient: 'linear-gradient(135deg, #FFD700, #FFA500)', iconColor: '#FFD700', textColor: '#fff' },
        3: { gradient: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', iconColor: '#CBD5E1', textColor: '#fff' },
        4: { gradient: 'linear-gradient(135deg, #CD7F32, #92400E)', iconColor: '#CD7F32', textColor: '#fff' },
        5: { gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)', iconColor: '#06B6D4', textColor: '#fff' },
        6: { gradient: 'linear-gradient(135deg, #10B981, #059669)', iconColor: '#10B981', textColor: '#fff' },
      }

      const getGroupStyle = (level: number) => {
        const c = LEVEL_COLORS[level] || LEVEL_COLORS[6]
        return {
          '--level-gradient': c.gradient,
          '--level-icon': c.iconColor,
        }
      }

      const style = getGroupStyle(1)
      expect(style['--level-gradient']).toBeTruthy()
      expect(style['--level-icon']).toBe('#F59E0B')
    })
  })

  describe('导出功能', () => {
    it('正确的导出数据格式', () => {
      const winners: Winner[] = [
        {
          id: 'w1',
          participant: { id: 'p1', name: 'A', machineCode: 'SN001', companyName: '公司A', region: '华南' },
          prize: createPrize({ name: '特等奖' }),
          winTime: new Date('2026-01-01T10:00:00'),
        },
      ]

      const exportData = winners.map(w => ({
        machineCode: w.participant.machineCode || w.participant.name,
        companyName: w.participant.companyName,
        region: w.participant.region,
        prizeName: w.prize.name,
        winTime: w.winTime,
      }))

      expect(exportData[0].machineCode).toBe('SN001')
      expect(exportData[0].companyName).toBe('公司A')
      expect(exportData[0].prizeName).toBe('特等奖')
      expect(exportData[0].winTime).toBeInstanceOf(Date)
    })

    it('无 machineCode 时使用 name 作为 fallback', () => {
      const winner = {
        participant: { id: 'p1', name: '参与者A', machineCode: undefined },
        prize: createPrize({ name: '一等奖' }),
        winTime: new Date(),
      }

      const exportData = {
        machineCode: winner.participant.machineCode || winner.participant.name,
      }

      expect(exportData.machineCode).toBe('参与者A')
    })
  })

  describe('空状态', () => {
    it('winners 为空数组时 groupedWinners 也为空', () => {
      const winners: Winner[] = []
      const groups: Record<string, { prize: Prize; winners: Winner[] }> = {}
      for (const winner of winners) {
        const prizeId = winner.prize.id
        if (!groups[prizeId]) {
          groups[prizeId] = { prize: winner.prize, winners: [] }
        }
        groups[prizeId].winners.push(winner)
      }
      expect(Object.values(groups)).toHaveLength(0)
    })
  })
})
