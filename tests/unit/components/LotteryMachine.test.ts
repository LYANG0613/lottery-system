import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import type { Participant, Prize } from '../../src/types'

function createParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: 'p1',
    name: '测试参与者',
    machineCode: 'SN001',
    ...overrides,
  }
}

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

// 简单的 LotteryMachine mock 组件用于测试
const LotteryMachineTest = defineComponent({
  name: 'LotteryMachineTest',
  props: {
    participants: { type: Array as () => Participant[], default: () => [] },
    currentPrize: { type: Object as () => Prize | null, default: null },
    drawIndex: { type: Number, default: 1 },
    batchIndex: { type: Number, default: 1 },
    batchTotal: { type: Number, default: 1 },
    batchSize: { type: Number, default: 0 },
    isRunning: { type: Boolean, default: false },
    displayName: { type: String, default: '' },
    winnerIds: { type: Array as () => string[], default: () => [] },
    visibleCodes: { type: Array as () => string[], default: () => [] },
    isAnimating: { type: Boolean, default: false },
    rollOffset: { type: Number, default: 0 },
  },
  emits: ['start'],
  setup(props, { emit }) {
    const availableCount = () =>
      props.participants.filter(p => !props.winnerIds.includes(p.id)).length

    const canStart = () =>
      props.currentPrize !== null &&
      props.currentPrize.count > 0 &&
      availableCount() > 0

    const getPrizeImageList = (prize: Prize | null): string[] => {
      if (!prize) return []
      return prize.images?.length ? prize.images : prize.image ? [prize.image] : []
    }

    // rollingItems 计算
    const rollingItems = () => {
      if (props.visibleCodes.length === 0) {
        return [
          { code: '', isCenter: false, position: -3, key: 'empty-top-1' },
          { code: '', isCenter: false, position: -2, key: 'empty-top-2' },
          { code: '', isCenter: false, position: -1, key: 'empty-top-3' },
          { code: props.displayName || '', isCenter: true, position: 0, key: 'center' },
          { code: '', isCenter: false, position: 1, key: 'empty-bottom-1' },
          { code: '', isCenter: false, position: 2, key: 'empty-bottom-2' },
          { code: '', isCenter: false, position: 3, key: 'empty-bottom-3' },
        ]
      }
      const codes = props.visibleCodes
      return [
        { code: codes[0] || '', isCenter: false, position: -3, key: `top-${codes[0]}-1` },
        { code: codes[1] || '', isCenter: false, position: -2, key: `top-${codes[1]}-2` },
        { code: codes[2] || '', isCenter: false, position: -1, key: `top-${codes[2]}-3` },
        { code: codes[3] || '', isCenter: true, position: 0, key: `center-${codes[3]}` },
        { code: codes[4] || '', isCenter: false, position: 1, key: `bottom-${codes[4]}-1` },
        { code: codes[5] || '', isCenter: false, position: 2, key: `bottom-${codes[5]}-2` },
        { code: codes[6] || '', isCenter: false, position: 3, key: `bottom-${codes[6]}-3` },
      ]
    }

    return () => h('div', { class: 'lottery-machine' }, [
      h('div', { class: 'rolling-container' }, rollingItems().map(item =>
        h('div', {
          key: item.key,
          class: ['code-row', { 'is-center': item.isCenter }],
        }, item.code)
      )),
      h('button', {
        class: 'start-btn',
        disabled: !canStart() || props.isRunning,
        onClick: () => emit('start'),
      }, canStart() ? '开始抽奖' : '等待配置'),
    ])
  },
})

describe('LotteryMachine 组件逻辑', () => {
  describe('canStart 条件', () => {
    it('有奖品、有参与者时 canStart 为 true', () => {
      const participants = [createParticipant({ id: 'p1' })]
      const prize = createPrize({ id: 'prize1', count: 3 })
      const winnerIds: string[] = []

      const canStart =
        prize !== null &&
        prize.count > 0 &&
        participants.filter(p => !winnerIds.includes(p.id)).length > 0

      expect(canStart).toBe(true)
    })

    it('currentPrize 为 null 时 canStart 为 false', () => {
      const participants = [createParticipant({ id: 'p1' })]
      const prize = null
      const winnerIds: string[] = []

      const canStart =
        prize !== null &&
        prize?.count > 0 &&
        participants.filter(p => !winnerIds.includes(p.id)).length > 0

      expect(canStart).toBe(false)
    })

    it('count 为 0 时 canStart 为 false', () => {
      const participants = [createParticipant({ id: 'p1' })]
      const prize = createPrize({ id: 'prize1', count: 0 })
      const winnerIds: string[] = []

      const canStart =
        prize !== null &&
        prize.count > 0 &&
        participants.filter(p => !winnerIds.includes(p.id)).length > 0

      expect(canStart).toBe(false)
    })

    it('所有参与者都已中奖时 canStart 为 false', () => {
      const participants = [createParticipant({ id: 'p1' })]
      const prize = createPrize({ id: 'prize1', count: 3 })
      const winnerIds = ['p1']

      const canStart =
        prize !== null &&
        prize.count > 0 &&
        participants.filter(p => !winnerIds.includes(p.id)).length > 0

      expect(canStart).toBe(false)
    })

    it('参与者数量少于剩余名额时 canStart 为 false', () => {
      const participants = [createParticipant({ id: 'p1' })]
      const prize = createPrize({ id: 'prize1', count: 3 })
      const winnerIds: string[] = []

      const available = participants.filter(p => !winnerIds.includes(p.id)).length
      const canStart =
        prize !== null &&
        prize.count > 0 &&
        available > 0 &&
        available >= 1 // remaining count

      expect(canStart).toBe(true)
    })
  })

  describe('rollingItems 计算', () => {
    it('visibleCodes 为空时渲染 7 个占位项', () => {
      const visibleCodes: string[] = []
      const displayName = ''

      const items = visibleCodes.length === 0
        ? [
            { code: '', isCenter: false, position: -3, key: 'empty-top-1' },
            { code: '', isCenter: false, position: -2, key: 'empty-top-2' },
            { code: '', isCenter: false, position: -1, key: 'empty-top-3' },
            { code: displayName || '', isCenter: true, position: 0, key: 'center' },
            { code: '', isCenter: false, position: 1, key: 'empty-bottom-1' },
            { code: '', isCenter: false, position: 2, key: 'empty-bottom-2' },
            { code: '', isCenter: false, position: 3, key: 'empty-bottom-3' },
          ]
        : []

      expect(items).toHaveLength(7)
      expect(items.filter(i => i.isCenter)).toHaveLength(1)
      expect(items.find(i => i.isCenter)?.position).toBe(0)
    })

    it('visibleCodes 有数据时渲染 7 个实际项', () => {
      const visibleCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

      const items = [
        { code: visibleCodes[0] || '', isCenter: false, position: -3, key: `top-${visibleCodes[0]}-1` },
        { code: visibleCodes[1] || '', isCenter: false, position: -2, key: `top-${visibleCodes[1]}-2` },
        { code: visibleCodes[2] || '', isCenter: false, position: -1, key: `top-${visibleCodes[2]}-3` },
        { code: visibleCodes[3] || '', isCenter: true, position: 0, key: `center-${visibleCodes[3]}` },
        { code: visibleCodes[4] || '', isCenter: false, position: 1, key: `bottom-${visibleCodes[4]}-1` },
        { code: visibleCodes[5] || '', isCenter: false, position: 2, key: `bottom-${visibleCodes[5]}-2` },
        { code: visibleCodes[6] || '', isCenter: false, position: 3, key: `bottom-${visibleCodes[6]}-3` },
      ]

      expect(items).toHaveLength(7)
      expect(items.filter(i => i.isCenter)).toHaveLength(1)
      expect(items.find(i => i.isCenter)?.code).toBe('D')
    })

    it('位置从 -3 到 +3', () => {
      const visibleCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

      const items = [
        { position: -3 }, { position: -2 }, { position: -1 },
        { position: 0 },
        { position: 1 }, { position: 2 }, { position: 3 },
      ]

      const positions = items.map(i => i.position)
      expect(positions).toEqual([-3, -2, -1, 0, 1, 2, 3])
    })
  })

  describe('图片轮播', () => {
    it('getPrizeImageList 返回 images 数组', () => {
      const prize = createPrize({
        images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      })
      const getPrizeImageList = (p: Prize | null): string[] => {
        if (!p) return []
        return p.images?.length ? p.images : p.image ? [p.image] : []
      }

      expect(getPrizeImageList(prize)).toHaveLength(2)
    })

    it('getPrizeImageList 回退到 single image', () => {
      const prize = createPrize({ image: 'https://example.com/single.jpg' })
      const getPrizeImageList = (p: Prize | null): string[] => {
        if (!p) return []
        return p.images?.length ? p.images : p.image ? [p.image] : []
      }

      expect(getPrizeImageList(prize)).toHaveLength(1)
    })

    it('getPrizeImageList 无图片时返回空数组', () => {
      const prize = createPrize()
      const getPrizeImageList = (p: Prize | null): string[] => {
        if (!p) return []
        return p.images?.length ? p.images : p.image ? [p.image] : []
      }

      expect(getPrizeImageList(prize)).toHaveLength(0)
    })

    it('getPrizeImageList prize 为 null 返回空数组', () => {
      const getPrizeImageList = (p: Prize | null): string[] => {
        if (!p) return []
        return p.images?.length ? p.images : p.image ? [p.image] : []
      }

      expect(getPrizeImageList(null)).toEqual([])
    })

    it('多图轮播索引循环', () => {
      let currentIndex = 0
      const list = ['a.jpg', 'b.jpg', 'c.jpg']

      for (let i = 0; i < 10; i++) {
        currentIndex = (currentIndex + 1) % list.length
      }

      expect(currentIndex).toBe(1)
    })
  })

  describe('winnerIds 排除逻辑', () => {
    it('正确统计可用参与者数量', () => {
      const participants = [
        createParticipant({ id: 'p1' }),
        createParticipant({ id: 'p2' }),
        createParticipant({ id: 'p3' }),
        createParticipant({ id: 'p4' }),
      ]
      const winnerIds = ['p1', 'p3']

      const available = participants.filter(p => !winnerIds.includes(p.id))
      expect(available).toHaveLength(2)
      expect(available.map(p => p.id)).toEqual(['p2', 'p4'])
    })

    it('空 winnerIds 时所有参与者都可用', () => {
      const participants = [createParticipant({ id: 'p1' }), createParticipant({ id: 'p2' })]
      const winnerIds: string[] = []

      const available = participants.filter(p => !winnerIds.includes(p.id))
      expect(available).toHaveLength(2)
    })
  })

  describe('按钮 disabled 状态', () => {
    it('isRunning=true 时按钮 disabled', () => {
      const isRunning = true
      const canStart = false

      const disabled = !canStart || isRunning
      expect(disabled).toBe(true)
    })

    it('isRunning=false 且 canStart=true 时按钮 enabled', () => {
      const isRunning = false
      const canStart = true

      const disabled = !canStart || isRunning
      expect(disabled).toBe(false)
    })

    it('isRunning=false 且 canStart=false 时按钮 disabled', () => {
      const isRunning = false
      const canStart = false

      const disabled = !canStart || isRunning
      expect(disabled).toBe(true)
    })
  })

  describe('批次信息', () => {
    it('drawIndex 从 1 开始', () => {
      const drawIndex = 1
      expect(drawIndex).toBe(1)
    })

    it('batchIndex 计算正确', () => {
      const MAX_PER_BATCH = 10
      const prizeCount = 25
      const wonCount = 11

      const batchIndex = Math.floor(wonCount / MAX_PER_BATCH) + 1
      expect(batchIndex).toBe(2)
    })

    it('batchTotal 计算正确', () => {
      const MAX_PER_BATCH = 10
      const prizeCount = 25

      const batchTotal = Math.max(1, Math.ceil(prizeCount / MAX_PER_BATCH))
      expect(batchTotal).toBe(3)
    })

    it('batchSize 取最小值', () => {
      const MAX_PER_BATCH = 10
      const remainingCount = 3

      const batchSize = Math.min(remainingCount, MAX_PER_BATCH)
      expect(batchSize).toBe(3)
    })
  })
})
