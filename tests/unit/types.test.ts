import { describe, it, expect } from 'vitest'
import type { Participant, Prize, PrizeItem, Winner, ExcelRow, LotteryDrawOrder } from '../../src/types'

function createParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: overrides.id || 'p1',
    name: overrides.name || '测试参与者',
    machineCode: overrides.machineCode,
    companyName: overrides.companyName,
    region: overrides.region,
    phone: overrides.phone,
    address: overrides.address,
    department: overrides.department,
    email: overrides.email,
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

function createPrize(overrides: Partial<Prize> = {}): Prize {
  return {
    id: overrides.id || 'prize1',
    name: overrides.name || '测试奖品',
    count: overrides.count ?? 1,
    level: overrides.level ?? 1,
    description: overrides.description,
    image: overrides.image,
    images: overrides.images,
    items: overrides.items,
    ...overrides,
  }
}

describe('数据类型定义验证', () => {
  describe('Participant', () => {
    it('必填字段 id 和 name 存在', () => {
      const p = createParticipant({ id: 'test-id', name: '测试名称' })
      expect(p.id).toBe('test-id')
      expect(p.name).toBe('测试名称')
    })

    it('可选字段正确赋值', () => {
      const p = createParticipant({
        machineCode: 'SN001',
        companyName: '测试公司',
        region: '华南',
        phone: '13800138000',
        address: '测试地址',
        department: '研发部',
        email: 'test@example.com',
      })
      expect(p.machineCode).toBe('SN001')
      expect(p.companyName).toBe('测试公司')
      expect(p.region).toBe('华南')
      expect(p.phone).toBe('13800138000')
      expect(p.address).toBe('测试地址')
      expect(p.department).toBe('研发部')
      expect(p.email).toBe('test@example.com')
    })

    it('可选字段可以为 undefined', () => {
      const p = createParticipant({ machineCode: undefined, companyName: undefined })
      expect(p.machineCode).toBeUndefined()
      expect(p.companyName).toBeUndefined()
    })

    it('支持任意扩展字段', () => {
      const p = createParticipant({ customField: '自定义值' } as unknown as Partial<Participant>)
      expect((p as unknown as Record<string, unknown>)['customField']).toBe('自定义值')
    })
  })

  describe('PrizeItem', () => {
    it('必填字段 id 和 name 存在', () => {
      const item = createPrizeItem({ id: 'item1', name: 'iPhone' })
      expect(item.id).toBe('item1')
      expect(item.name).toBe('iPhone')
    })

    it('可选字段 image', () => {
      const item = createPrizeItem({ image: 'https://example.com/iphone.png' })
      expect(item.image).toBe('https://example.com/iphone.png')
    })
  })

  describe('Prize', () => {
    it('必填字段存在', () => {
      const prize = createPrize({ id: 'p1', name: '特等奖', count: 1, level: 1 })
      expect(prize.id).toBe('p1')
      expect(prize.name).toBe('特等奖')
      expect(prize.count).toBe(1)
      expect(prize.level).toBe(1)
    })

    it('count 必须为正数', () => {
      const prize = createPrize({ count: 5 })
      expect(prize.count).toBeGreaterThan(0)
    })

    it('level 有效范围 1-6', () => {
      for (let level = 1; level <= 6; level++) {
        const prize = createPrize({ level })
        expect(prize.level).toBe(level)
      }
    })

    it('可选字段 description', () => {
      const prize = createPrize({ description: '这是一份精美的奖品' })
      expect(prize.description).toBe('这是一份精美的奖品')
    })

    it('可选字段 image', () => {
      const prize = createPrize({ image: 'https://example.com/prize.jpg' })
      expect(prize.image).toBe('https://example.com/prize.jpg')
    })

    it('可选字段 images 支持多张图片', () => {
      const prize = createPrize({
        images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      })
      expect(prize.images).toHaveLength(2)
    })

    it('可选字段 items 支持多个物品', () => {
      const prize = createPrize({
        items: [
          createPrizeItem({ id: 'i1', name: 'iPhone' }),
          createPrizeItem({ id: 'i2', name: 'AirPods' }),
        ],
      })
      expect(prize.items).toHaveLength(2)
    })

    it('image 和 images 可以共存', () => {
      const prize = createPrize({
        image: 'https://example.com/main.jpg',
        images: ['https://example.com/1.jpg'],
      })
      expect(prize.image).toBe('https://example.com/main.jpg')
      expect(prize.images).toHaveLength(1)
    })
  })

  describe('Winner', () => {
    it('必填字段存在', () => {
      const participant = createParticipant({ id: 'p1' })
      const prize = createPrize({ id: 'prize1' })
      const winner: Winner = {
        id: 'w1',
        participant,
        prize,
        winTime: new Date(),
      }
      expect(winner.id).toBe('w1')
      expect(winner.participant.id).toBe('p1')
      expect(winner.prize.id).toBe('prize1')
      expect(winner.winTime).toBeInstanceOf(Date)
    })

    it('winTime 可以是 Date 类型', () => {
      const winTime = new Date('2026-01-01T10:00:00')
      const winner: Winner = {
        id: 'w1',
        participant: createParticipant(),
        prize: createPrize(),
        winTime,
      }
      expect(winner.winTime).toBe(winTime)
    })
  })

  describe('ExcelRow', () => {
    it('支持字符串值', () => {
      const row: ExcelRow = { '列1': '值1', '列2': '值2' }
      expect(row['列1']).toBe('值1')
    })

    it('支持数字值', () => {
      const row: ExcelRow = { '序号': 1, '数量': 100 }
      expect(row['序号']).toBe(1)
      expect(row['数量']).toBe(100)
    })

    it('支持 null 值', () => {
      const row: ExcelRow = { '可选列': null }
      expect(row['可选列']).toBeNull()
    })

    it('支持 undefined 值', () => {
      const row: ExcelRow = {}
      expect(row['不存在']).toBeUndefined()
    })
  })

  describe('LotteryDrawOrder', () => {
    it('合法枚举值：high-to-low', () => {
      const order: LotteryDrawOrder = 'high-to-low'
      expect(order).toBe('high-to-low')
    })

    it('合法枚举值：low-to-high', () => {
      const order: LotteryDrawOrder = 'low-to-high'
      expect(order).toBe('low-to-high')
    })

    it('不接受非法枚举值', () => {
      const isValid = (value: string): value is LotteryDrawOrder =>
        value === 'high-to-low' || value === 'low-to-high'

      expect(isValid('high-to-low')).toBe(true)
      expect(isValid('low-to-high')).toBe(true)
      expect(isValid('random')).toBe(false)
    })
  })
})
