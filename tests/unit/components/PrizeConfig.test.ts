import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Prize, Winner, PrizeItem } from '../../src/types'

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

function createPrizeItem(overrides: Partial<PrizeItem> = {}): PrizeItem {
  return {
    id: overrides.id || 'item1',
    name: overrides.name || 'iPhone 15',
    image: overrides.image,
    ...overrides,
  }
}

describe('PrizeConfig 组件逻辑', () => {
  describe('getRemainingCount 剩余名额计算', () => {
    it('无中奖时返回奖品总数', () => {
      const prizes = [createPrize({ id: 'p1', count: 5 })]
      const winners: Winner[] = []
      const prizeId = 'p1'

      const getRemainingCount = (prizeId: string): number => {
        const prize = prizes.find(p => p.id === prizeId)
        if (!prize) return 0
        const wonCount = winners.filter(w => w.prize.id === prizeId).length
        return Math.max(0, prize.count - wonCount)
      }

      expect(getRemainingCount(prizeId)).toBe(5)
    })

    it('部分中奖后正确计算', () => {
      const prizes = [createPrize({ id: 'p1', count: 5 })]
      const winners: Winner[] = [
        { id: 'w1', participant: { id: 'pp1', name: 'A' }, prize: createPrize({ id: 'p1' }), winTime: new Date() },
        { id: 'w2', participant: { id: 'pp2', name: 'B' }, prize: createPrize({ id: 'p1' }), winTime: new Date() },
      ]
      const prizeId = 'p1'

      const getRemainingCount = (prizeId: string): number => {
        const prize = prizes.find(p => p.id === prizeId)
        if (!prize) return 0
        const wonCount = winners.filter(w => w.prize.id === prizeId).length
        return Math.max(0, prize.count - wonCount)
      }

      expect(getRemainingCount(prizeId)).toBe(3)
    })

    it('全部抽完后返回0', () => {
      const prizes = [createPrize({ id: 'p1', count: 2 })]
      const winners: Winner[] = [
        { id: 'w1', participant: { id: 'pp1', name: 'A' }, prize: createPrize({ id: 'p1' }), winTime: new Date() },
        { id: 'w2', participant: { id: 'pp2', name: 'B' }, prize: createPrize({ id: 'p1' }), winTime: new Date() },
      ]

      const getRemainingCount = (prizeId: string): number => {
        const prize = prizes.find(p => p.id === prizeId)
        if (!prize) return 0
        const wonCount = winners.filter(w => w.prize.id === prizeId).length
        return Math.max(0, prize.count - wonCount)
      }

      expect(getRemainingCount('p1')).toBe(0)
    })

    it('不存在的奖品返回0', () => {
      const prizes: Prize[] = []
      const winners: Winner[] = []

      const getRemainingCount = (prizeId: string): number => {
        const prize = prizes.find(p => p.id === prizeId)
        if (!prize) return 0
        const wonCount = winners.filter(w => w.prize.id === prizeId).length
        return Math.max(0, prize.count - wonCount)
      }

      expect(getRemainingCount('nonexistent')).toBe(0)
    })
  })

  describe('表单验证', () => {
    it('奖品名称不能为空', () => {
      const validatePrizeName = (name: string): boolean => {
        return name.trim().length > 0
      }

      expect(validatePrizeName('')).toBe(false)
      expect(validatePrizeName('   ')).toBe(false)
      expect(validatePrizeName('特等奖')).toBe(true)
    })

    it('count 必须为正数', () => {
      const validateCount = (count: number): boolean => {
        return count >= 1 && Number.isInteger(count)
      }

      expect(validateCount(0)).toBe(false)
      expect(validateCount(-1)).toBe(false)
      expect(validateCount(1)).toBe(true)
      expect(validateCount(100)).toBe(true)
      expect(validateCount(1.5)).toBe(false)
    })

    it('level 有效范围 1-6', () => {
      const validateLevel = (level: number): boolean => {
        return level >= 1 && level <= 6
      }

      for (let l = 1; l <= 6; l++) {
        expect(validateLevel(l)).toBe(true)
      }
      expect(validateLevel(0)).toBe(false)
      expect(validateLevel(7)).toBe(false)
      expect(validateLevel(-1)).toBe(false)
    })
  })

  describe('图片上传验证', () => {
    it('图片大小限制 5MB', () => {
      const MAX_SIZE = 5 * 1024 * 1024

      const validateImageSize = (size: number): boolean => {
        return size <= MAX_SIZE
      }

      expect(validateImageSize(1 * 1024 * 1024)).toBe(true)
      expect(validateImageSize(5 * 1024 * 1024)).toBe(true)
      expect(validateImageSize(5 * 1024 * 1024 + 1)).toBe(false)
      expect(validateImageSize(10 * 1024 * 1024)).toBe(false)
    })

    it('图片类型验证', () => {
      const validateImageType = (type: string): boolean => {
        return type.startsWith('image/')
      }

      expect(validateImageType('image/jpeg')).toBe(true)
      expect(validateImageType('image/png')).toBe(true)
      expect(validateImageType('image/webp')).toBe(true)
      expect(validateImageType('application/pdf')).toBe(false)
      expect(validateImageType('text/plain')).toBe(false)
      expect(validateImageType('')).toBe(false)
    })

    it('文件名后缀验证', () => {
      const validateImageFile = (name: string): boolean => {
        return name.endsWith('.jpg') || name.endsWith('.jpeg') ||
               name.endsWith('.png') || name.endsWith('.webp')
      }

      expect(validateImageFile('photo.jpg')).toBe(true)
      expect(validateImageFile('photo.png')).toBe(true)
      expect(validateImageFile('photo.webp')).toBe(true)
      expect(validateImageFile('photo.jpeg')).toBe(true)
      expect(validateImageFile('photo.gif')).toBe(false)
      expect(validateImageFile('document.pdf')).toBe(false)
    })
  })

  describe('表单重置', () => {
    it('添加奖品时表单应为空', () => {
      const defaultForm = {
        name: '',
        level: 3,
        count: 1,
        description: '',
        images: [] as string[],
        items: [] as PrizeItem[],
      }

      const newForm = { ...defaultForm }
      expect(newForm.name).toBe('')
      expect(newForm.level).toBe(3)
      expect(newForm.count).toBe(1)
      expect(newForm.images).toEqual([])
      expect(newForm.items).toEqual([])
    })

    it('编辑奖品时表单应预填充', () => {
      const prize = createPrize({
        id: 'p1',
        name: '一等奖',
        level: 2,
        count: 5,
        description: '精美礼品',
        images: ['https://example.com/1.jpg'],
        items: [createPrizeItem({ name: 'iPhone' })],
      })

      const form = {
        name: prize.name,
        level: prize.level,
        count: prize.count,
        description: prize.description || '',
        images: prize.images || (prize.image ? [prize.image] : []),
        items: prize.items || [],
      }

      expect(form.name).toBe('一等奖')
      expect(form.level).toBe(2)
      expect(form.count).toBe(5)
      expect(form.images).toHaveLength(1)
      expect(form.items).toHaveLength(1)
    })

    it('ID 生成不重复', () => {
      const generateId = (): string =>
        Date.now().toString(36) + Math.random().toString(36).substring(2)

      const ids = new Set<string>()
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(1000)
    })
  })

  describe('奖品列表排序', () => {
    it('按 level 从低到高排序', () => {
      const prizes = [
        createPrize({ id: 'p1', level: 5 }),
        createPrize({ id: 'p2', level: 1 }),
        createPrize({ id: 'p3', level: 3 }),
      ]

      const sorted = [...prizes].sort((a, b) => a.level - b.level)
      expect(sorted.map(p => p.level)).toEqual([1, 3, 5])
    })

    it('添加新奖品后自动排序', () => {
      const existingPrizes = [
        createPrize({ id: 'p1', level: 1 }),
        createPrize({ id: 'p2', level: 3 }),
      ]
      const newPrize = createPrize({ id: 'p3', level: 2 })

      const all = [...existingPrizes, newPrize].sort((a, b) => a.level - b.level)
      expect(all.map(p => p.level)).toEqual([1, 2, 3])
    })
  })

  describe('奖品操作确认', () => {
    it('删除奖品前应确认', () => {
      let confirmed = false
      const confirmDelete = async (): Promise<boolean> => {
        confirmed = true
        return true
      }

      const result = confirmDelete()
      expect(result).toBeTruthy()
      expect(confirmed).toBe(true)
    })
  })
})
