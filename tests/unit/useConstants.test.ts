import { describe, it, expect } from 'vitest'
import {
  normalizeDrawOrder,
  comparePrizesByDrawOrder,
  updatePageTitle,
} from '../../src/composables/useConstants'
import type { Prize } from '../../src/types'

function createPrize(overrides: Partial<Prize> = {}): Prize {
  return {
    id: overrides.id || 'p1',
    name: overrides.name || '测试奖品',
    count: overrides.count ?? 1,
    level: overrides.level ?? 1,
    description: overrides.description || '',
    image: overrides.image,
    images: overrides.images,
    items: overrides.items || [],
    ...overrides,
  }
}

describe('useConstants 补充测试', () => {
  describe('normalizeDrawOrder', () => {
    it('high-to-low 返回原值', () => {
      expect(normalizeDrawOrder('high-to-low')).toBe('high-to-low')
    })

    it('low-to-high 返回原值', () => {
      expect(normalizeDrawOrder('low-to-high')).toBe('low-to-high')
    })

    it('undefined 返回默认值', () => {
      expect(normalizeDrawOrder(undefined)).toBe('high-to-low')
    })

    it('null 返回默认值', () => {
      expect(normalizeDrawOrder(null as unknown as string)).toBe('high-to-low')
    })

    it('任意非法字符串返回默认值', () => {
      expect(normalizeDrawOrder('invalid')).toBe('high-to-low')
      expect(normalizeDrawOrder('')).toBe('high-to-low')
    })

    it('数字输入返回默认值', () => {
      expect(normalizeDrawOrder(1 as unknown as string)).toBe('high-to-low')
    })
  })

  describe('comparePrizesByDrawOrder 次级排序', () => {
    it('等级相同时按名称排序', () => {
      const a = createPrize({ id: 'a', name: 'Z奖品', level: 1 })
      const b = createPrize({ id: 'b', name: 'A奖品', level: 1 })

      expect(comparePrizesByDrawOrder(a, b)).toBeGreaterThan(0)
      expect(comparePrizesByDrawOrder(b, a)).toBeLessThan(0)
    })

    it('等级和名称都相同时按 ID 排序', () => {
      const a = createPrize({ id: 'z-prize', name: 'AAA', level: 1 })
      const b = createPrize({ id: 'a-prize', name: 'AAA', level: 1 })

      expect(comparePrizesByDrawOrder(a, b)).toBeGreaterThan(0)
      expect(comparePrizesByDrawOrder(b, a)).toBeLessThan(0)
    })

    it('high-to-low 等级 1 排在等级 6 前面', () => {
      const high = createPrize({ level: 1 })
      const low = createPrize({ level: 6 })
      expect(comparePrizesByDrawOrder(high, low)).toBeLessThan(0)
    })

    it('low-to-high 等级 6 排在等级 1 前面', () => {
      const high = createPrize({ level: 1 })
      const low = createPrize({ level: 6 })
      expect(comparePrizesByDrawOrder(high, low, 'low-to-high')).toBeGreaterThan(0)
      expect(comparePrizesByDrawOrder(low, high, 'low-to-high')).toBeLessThan(0)
    })

    it('接受默认参数', () => {
      const high = createPrize({ level: 1 })
      const low = createPrize({ level: 6 })
      expect(comparePrizesByDrawOrder(high, low)).toBeLessThan(0)
    })
  })

  describe('updatePageTitle', () => {
    it('设置带活动名称的标题', () => {
      updatePageTitle('2026年度盛典')
      expect(document.title).toBe('2026年度盛典 - 抽奖系统')
    })

    it('空字符串设置默认标题', () => {
      updatePageTitle('')
      expect(document.title).toBe('抽奖系统')
    })

    it('undefined 设置默认标题', () => {
      updatePageTitle(undefined as unknown as string)
      expect(document.title).toBe('抽奖系统')
    })
  })
})
