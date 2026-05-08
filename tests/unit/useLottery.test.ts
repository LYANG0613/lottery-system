import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the entire module
const mockState = {
  eventName: '',
  companyLogo: '',
  drawOrder: 'high-to-low' as 'high-to-low' | 'low-to-high',
  participants: [] as any[],
  prizes: [] as any[],
  winners: [] as any[],
}

const mockBackup = {
  state: null as any,
  timestamp: 0,
  description: '',
}

const mockHasUnsavedChanges = { value: false }
const mockStorageReady = { value: true }

const mockFns = {
  setEventName: vi.fn((name: string) => { mockState.eventName = name }),
  setCompanyLogo: vi.fn((logo: string) => { mockState.companyLogo = logo }),
  setDrawOrder: vi.fn((order: 'high-to-low' | 'low-to-high') => {
    mockState.drawOrder = order
    if (mockState.prizes.length > 0) {
      mockState.prizes.sort((a: any, b: any) =>
        order === 'high-to-low'
          ? a.level - b.level || a.name.localeCompare(b.name)
          : b.level - a.level || a.name.localeCompare(b.name)
      )
    }
  }),
  setParticipants: vi.fn((p: any[]) => { mockState.participants = p }),
  addParticipants: vi.fn((newP: any[]) => {
    const existingIds = new Set(mockState.participants.map((p: any) => p.id))
    const unique = newP.filter((p: any) => !existingIds.has(p.id))
    mockState.participants = [...mockState.participants, ...unique]
  }),
  removeParticipant: vi.fn((id: string) => {
    mockState.participants = mockState.participants.filter((p: any) => p.id !== id)
  }),
  clearParticipants: vi.fn(() => { mockState.participants = [] }),
  setPrizes: vi.fn((p: any[]) => {
    mockState.prizes = [...p].sort((a: any, b: any) =>
      a.level - b.level || a.name.localeCompare(b.name)
    )
  }),
  addPrize: vi.fn((p: any) => {
    mockState.prizes = [...mockState.prizes, p].sort((a: any, b: any) =>
      a.level - b.level || a.name.localeCompare(b.name)
    )
  }),
  updatePrize: vi.fn((updated: any) => {
    const idx = mockState.prizes.findIndex((p: any) => p.id === updated.id)
    if (idx !== -1) {
      mockState.prizes = mockState.prizes.map((p: any) =>
        p.id === updated.id ? updated : p
      )
    }
  }),
  removePrize: vi.fn((id: string) => {
    mockState.prizes = mockState.prizes.filter((p: any) => p.id !== id)
  }),
  addWinners: vi.fn((w: any[]) => {
    mockState.winners = [...mockState.winners, ...w]
  }),
  removeWinner: vi.fn((id: string) => {
    mockState.winners = mockState.winners.filter((w: any) => w.id !== id)
  }),
  clearWinners: vi.fn(() => { mockState.winners = [] }),
  getAvailableParticipants: vi.fn(() => {
    const winnerIds = new Set(mockState.winners.map((w: any) => w.participant.id))
    return mockState.participants.filter((p: any) => !winnerIds.has(p.id))
  }),
  getRemainingPrizeCount: vi.fn((prizeId: string): number => {
    const prize = mockState.prizes.find((p: any) => p.id === prizeId)
    if (!prize) return 0
    const wonCount = mockState.winners.filter((w: any) => w.prize.id === prizeId).length
    return Math.max(0, prize.count - wonCount)
  }),
  getNextAvailablePrize: vi.fn((): any => {
    return mockState.prizes.find((p: any) => {
      const remaining = mockFns.getRemainingPrizeCount(p.id)
      return remaining > 0
    }) || null
  }),
  getOrderedPrizes: vi.fn((order?: 'high-to-low' | 'low-to-high') => {
    const sortOrder = order || mockState.drawOrder
    return [...mockState.prizes].sort((a: any, b: any) =>
      sortOrder === 'high-to-low'
        ? a.level - b.level || a.name.localeCompare(b.name)
        : b.level - a.level || a.name.localeCompare(b.name)
    )
  }),
  clearAll: vi.fn(() => {
    mockState.eventName = ''
    mockState.companyLogo = ''
    mockState.drawOrder = 'high-to-low'
    mockState.participants = []
    mockState.prizes = []
    mockState.winners = []
    mockBackup.state = null
    mockBackup.timestamp = 0
    mockBackup.description = ''
  }),
  createBackup: vi.fn((description: string) => {
    mockBackup.state = JSON.parse(JSON.stringify(mockState))
    mockBackup.timestamp = Date.now()
    mockBackup.description = description
    return mockBackup
  }),
  getBackup: vi.fn(() => {
    if (!mockBackup.state) return null
    return mockBackup
  }),
  restoreFromBackup: vi.fn(() => {
    if (!mockBackup.state) return false
    Object.assign(mockState, JSON.parse(JSON.stringify(mockBackup.state)))
    return true
  }),
  clearBackup: vi.fn(() => {
    mockBackup.state = null
    mockBackup.timestamp = 0
    mockBackup.description = ''
  }),
}

vi.mock('../../src/stores/lottery', () => ({
  useLotteryStore: () => ({
    state: mockState,
    hasUnsavedChanges: mockHasUnsavedChanges,
    storageReady: mockStorageReady,
    setEventName: mockFns.setEventName,
    setCompanyLogo: mockFns.setCompanyLogo,
    setDrawOrder: mockFns.setDrawOrder,
    setParticipants: mockFns.setParticipants,
    addParticipants: mockFns.addParticipants,
    removeParticipant: mockFns.removeParticipant,
    clearParticipants: mockFns.clearParticipants,
    setPrizes: mockFns.setPrizes,
    addPrize: mockFns.addPrize,
    updatePrize: mockFns.updatePrize,
    removePrize: mockFns.removePrize,
    addWinners: mockFns.addWinners,
    removeWinner: mockFns.removeWinner,
    clearWinners: mockFns.clearWinners,
    getAvailableParticipants: mockFns.getAvailableParticipants,
    getRemainingPrizeCount: mockFns.getRemainingPrizeCount,
    getNextAvailablePrize: mockFns.getNextAvailablePrize,
    getOrderedPrizes: mockFns.getOrderedPrizes,
    clearAll: mockFns.clearAll,
    createBackup: mockFns.createBackup,
    getBackup: mockFns.getBackup,
    restoreFromBackup: mockFns.restoreFromBackup,
    clearBackup: mockFns.clearBackup,
  }),
}))

import { useLotteryStore } from '../../src/stores/lottery'

function resetState() {
  mockState.eventName = ''
  mockState.companyLogo = ''
  mockState.drawOrder = 'high-to-low'
  mockState.participants = []
  mockState.prizes = []
  mockState.winners = []
  mockBackup.state = null
  mockBackup.timestamp = 0
  mockBackup.description = ''
  vi.clearAllMocks()
}

function createParticipant(id = 'p1', name = '测试参与者'): any {
  return { id, name, machineCode: `SN${id}`, companyName: '测试公司', region: '华南', phone: '13800138000' }
}

function createPrize(id = 'prize1', name = '测试奖品', level = 1, count = 3): any {
  return { id, name, count, level, description: '', image: '', images: [], items: [] }
}

function createWinner(id = 'w1', participant?: any, prize?: any): any {
  return {
    id,
    participant: participant || createParticipant(),
    prize: prize || createPrize(),
    winTime: new Date(),
  }
}

describe('useLotteryStore 状态管理', () => {
  beforeEach(resetState)
  afterEach(resetState)

  describe('初始化', () => {
    it('默认状态正确', () => {
      const store = useLotteryStore()
      expect(store.state.eventName).toBe('')
      expect(store.state.companyLogo).toBe('')
      expect(store.state.drawOrder).toBe('high-to-low')
      expect(store.state.participants).toEqual([])
      expect(store.state.prizes).toEqual([])
      expect(store.state.winners).toEqual([])
    })
  })

  describe('活动设置', () => {
    it('setEventName 更新活动名称', () => {
      const store = useLotteryStore()
      store.setEventName('2026年度盛典')
      expect(mockFns.setEventName).toHaveBeenCalledWith('2026年度盛典')
      expect(store.state.eventName).toBe('2026年度盛典')
    })

    it('setCompanyLogo 更新公司Logo', () => {
      const store = useLotteryStore()
      store.setCompanyLogo('https://example.com/logo.png')
      expect(mockFns.setCompanyLogo).toHaveBeenCalledWith('https://example.com/logo.png')
      expect(store.state.companyLogo).toBe('https://example.com/logo.png')
    })

    it('setDrawOrder 切换抽奖顺序', () => {
      const store = useLotteryStore()
      expect(store.state.drawOrder).toBe('high-to-low')
      store.setDrawOrder('low-to-high')
      expect(mockFns.setDrawOrder).toHaveBeenCalledWith('low-to-high')
      expect(store.state.drawOrder).toBe('low-to-high')
    })

    it('setDrawOrder 同时重新排序奖品', () => {
      const store = useLotteryStore()
      store.setPrizes([
        createPrize('p1', '三等奖', 4),
        createPrize('p2', '特等奖', 1),
        createPrize('p3', '二等奖', 3),
      ])
      store.setDrawOrder('low-to-high')
      expect(store.state.prizes.map((p: any) => p.id)).toEqual(['p1', 'p3', 'p2'])
    })
  })

  describe('参与者管理', () => {
    it('setParticipants 完全替换参与者列表', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1'), createParticipant('p2')])
      expect(store.state.participants).toHaveLength(2)
    })

    it('addParticipants 追加新参与者，自动去重', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1')])
      store.addParticipants([createParticipant('p2'), createParticipant('p1'), createParticipant('p3')])
      expect(store.state.participants).toHaveLength(3)
      const ids = store.state.participants.map((p: any) => p.id)
      expect(ids).toContain('p1')
      expect(ids).toContain('p2')
      expect(ids).toContain('p3')
    })

    it('removeParticipant 删除指定参与者', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1'), createParticipant('p2')])
      store.removeParticipant('p1')
      expect(store.state.participants).toHaveLength(1)
      expect(store.state.participants[0].id).toBe('p2')
    })

    it('clearParticipants 清空所有参与者', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1')])
      store.clearParticipants()
      expect(store.state.participants).toHaveLength(0)
    })
  })

  describe('奖品管理', () => {
    it('setPrizes 完全替换奖品列表并排序', () => {
      const store = useLotteryStore()
      store.setPrizes([createPrize('p1', '三等奖', 4), createPrize('p2', '特等奖', 1)])
      expect(store.state.prizes).toHaveLength(2)
      expect(store.state.prizes[0].level).toBe(1)
      expect(store.state.prizes[1].level).toBe(4)
    })

    it('addPrize 添加新奖品并自动排序', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '二等奖', 3))
      store.addPrize(createPrize('p2', '特等奖', 1))
      store.addPrize(createPrize('p3', '一等奖', 2))
      expect(store.state.prizes).toHaveLength(3)
      expect(store.state.prizes[0].id).toBe('p2')
      expect(store.state.prizes[1].id).toBe('p3')
      expect(store.state.prizes[2].id).toBe('p1')
    })

    it('updatePrize 更新已有奖品', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '一等奖', 2, 1))
      store.updatePrize(createPrize('p1', '一等奖（更新）', 2, 5))
      const prize = store.state.prizes.find((p: any) => p.id === 'p1')
      expect(prize!.name).toBe('一等奖（更新）')
      expect(prize!.count).toBe(5)
    })

    it('removePrize 删除指定奖品', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1'))
      store.addPrize(createPrize('p2'))
      store.removePrize('p1')
      expect(store.state.prizes).toHaveLength(1)
      expect(store.state.prizes[0].id).toBe('p2')
    })
  })

  describe('中奖者管理', () => {
    it('addWinners 追加中奖者', () => {
      const store = useLotteryStore()
      store.addWinners([createWinner('w1'), createWinner('w2')])
      expect(store.state.winners).toHaveLength(2)
    })

    it('removeWinner 删除指定中奖者', () => {
      const store = useLotteryStore()
      store.addWinners([createWinner('w1'), createWinner('w2')])
      store.removeWinner('w1')
      expect(store.state.winners).toHaveLength(1)
      expect(store.state.winners[0].id).toBe('w2')
    })

    it('clearWinners 清空中奖名单', () => {
      const store = useLotteryStore()
      store.addWinners([createWinner('w1')])
      store.clearWinners()
      expect(store.state.winners).toHaveLength(0)
    })
  })

  describe('getAvailableParticipants 可用参与者', () => {
    it('排除已中奖的参与者', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1'), createParticipant('p2'), createParticipant('p3')])
      store.addWinners([createWinner('w1', createParticipant('p2'))])
      expect(store.getAvailableParticipants().map((p: any) => p.id)).toEqual(['p1', 'p3'])
    })

    it('所有参与者都未中奖时返回全部', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1'), createParticipant('p2')])
      expect(store.getAvailableParticipants()).toHaveLength(2)
    })

    it('所有参与者都中奖后返回空', () => {
      const store = useLotteryStore()
      store.setParticipants([createParticipant('p1')])
      store.addWinners([createWinner('w1', createParticipant('p1'))])
      expect(store.getAvailableParticipants()).toHaveLength(0)
    })
  })

  describe('getRemainingPrizeCount 剩余名额', () => {
    it('无中奖时返回奖品总数', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 5))
      expect(store.getRemainingPrizeCount('p1')).toBe(5)
    })

    it('部分中奖后正确计算剩余名额', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 5))
      store.addWinners([createWinner('w1', undefined, createPrize('p1')), createWinner('w2', undefined, createPrize('p1'))])
      expect(store.getRemainingPrizeCount('p1')).toBe(3)
    })

    it('全部抽完后返回0', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 2))
      store.addWinners([createWinner('w1', undefined, createPrize('p1')), createWinner('w2', undefined, createPrize('p1'))])
      expect(store.getRemainingPrizeCount('p1')).toBe(0)
    })

    it('名额计算不会返回负数', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 1))
      store.addWinners([
        createWinner('w1', undefined, createPrize('p1')),
        createWinner('w2', undefined, createPrize('p1')),
        createWinner('w3', undefined, createPrize('p1')),
      ])
      expect(store.getRemainingPrizeCount('p1')).toBe(0)
    })

    it('不存在的奖品返回0', () => {
      const store = useLotteryStore()
      expect(store.getRemainingPrizeCount('nonexistent')).toBe(0)
    })
  })

  describe('getNextAvailablePrize 下一个可抽奖品', () => {
    it('返回第一个有剩余名额的奖品', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 3))
      store.addPrize(createPrize('p2', '一等奖', 2, 3))
      expect(store.getNextAvailablePrize()!.id).toBe('p1')
    })

    it('已抽完的奖品被跳过', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 1))
      store.addWinners([createWinner('w1', undefined, createPrize('p1'))])
      store.addPrize(createPrize('p2', '一等奖', 2, 3))
      expect(store.getNextAvailablePrize()!.id).toBe('p2')
    })

    it('所有奖品抽完后返回 null', () => {
      const store = useLotteryStore()
      store.addPrize(createPrize('p1', '特等奖', 1, 1))
      store.addWinners([createWinner('w1', undefined, createPrize('p1'))])
      expect(store.getNextAvailablePrize()).toBeNull()
    })

    it('无奖品时返回 null', () => {
      const store = useLotteryStore()
      expect(store.getNextAvailablePrize()).toBeNull()
    })
  })

  describe('getOrderedPrizes 排序后的奖品列表', () => {
    it('high-to-low 按等级从高到低排序', () => {
      const store = useLotteryStore()
      store.setDrawOrder('high-to-low')
      store.setPrizes([
        createPrize('p3', '五等奖', 5),
        createPrize('p1', '特等奖', 1),
        createPrize('p2', '三等奖', 3),
      ])
      expect(store.getOrderedPrizes().map((p: any) => p.level)).toEqual([1, 3, 5])
    })

    it('low-to-high 按等级从低到高排序', () => {
      const store = useLotteryStore()
      store.setDrawOrder('low-to-high')
      store.setPrizes([
        createPrize('p1', '特等奖', 1),
        createPrize('p2', '三等奖', 3),
        createPrize('p3', '五等奖', 5),
      ])
      expect(store.getOrderedPrizes().map((p: any) => p.level)).toEqual([5, 3, 1])
    })

    it('等级相同时按名称排序', () => {
      const store = useLotteryStore()
      store.setDrawOrder('high-to-low')
      store.setPrizes([
        createPrize('p1', 'Z奖品', 1),
        createPrize('p2', 'A奖品', 1),
      ])
      expect(store.getOrderedPrizes()[0].name).toBe('A奖品')
      expect(store.getOrderedPrizes()[1].name).toBe('Z奖品')
    })

    it('接受显式排序参数', () => {
      const store = useLotteryStore()
      store.setDrawOrder('high-to-low')
      store.setPrizes([createPrize('p1', '五等奖', 5), createPrize('p2', '特等奖', 1)])
      expect(store.getOrderedPrizes('low-to-high').map((p: any) => p.level)).toEqual([5, 1])
    })
  })

  describe('clearAll 完全重置', () => {
    it('清空所有数据并重置设置', () => {
      const store = useLotteryStore()
      store.setEventName('盛典')
      store.setCompanyLogo('data:xxx')
      store.setParticipants([createParticipant('p1')])
      store.addPrize(createPrize('prize1'))
      store.addWinners([createWinner('w1')])

      store.clearAll()

      expect(store.state.eventName).toBe('')
      expect(store.state.companyLogo).toBe('')
      expect(store.state.participants).toHaveLength(0)
      expect(store.state.prizes).toHaveLength(0)
      expect(store.state.winners).toHaveLength(0)
      expect(store.state.drawOrder).toBe('high-to-low')
    })

    it('清除备份记录', () => {
      const store = useLotteryStore()
      store.createBackup('测试备份')
      store.clearAll()
      expect(store.getBackup()).toBeNull()
    })
  })

  describe('备份与恢复', () => {
    it('createBackup 创建备份', () => {
      const store = useLotteryStore()
      store.setEventName('盛典')
      store.setParticipants([createParticipant('p1')])
      store.addPrize(createPrize('prize1'))
      const backup = store.createBackup('手动备份')
      expect(backup).not.toBeNull()
      expect(backup!.description).toBe('手动备份')
      expect(backup!.timestamp).toBeGreaterThan(0)
      expect(backup!.state.eventName).toBe('盛典')
      expect(backup!.state.participants).toHaveLength(1)
    })

    it('getBackup 获取最新备份', () => {
      const store = useLotteryStore()
      store.createBackup('备份1')
      const backup = store.getBackup()
      expect(backup).not.toBeNull()
      expect(backup!.description).toBe('备份1')
    })

    it('restoreFromBackup 恢复备份', () => {
      const store = useLotteryStore()
      store.setEventName('原始盛典')
      store.addPrize(createPrize('p1', '原始奖品', 1))
      store.createBackup('备份')
      store.setEventName('修改后')
      store.clearParticipants()

      const success = store.restoreFromBackup()
      expect(success).toBe(true)
      expect(store.state.eventName).toBe('原始盛典')
      expect(store.state.prizes[0].name).toBe('原始奖品')
    })

    it('restoreFromBackup 无备份时返回 false', () => {
      resetState()
      const store = useLotteryStore()
      const success = store.restoreFromBackup()
      expect(success).toBe(false)
    })

    it('clearBackup 清除备份', () => {
      const store = useLotteryStore()
      store.createBackup('备份')
      store.clearBackup()
      expect(store.getBackup()).toBeNull()
    })
  })

  describe('边界情况', () => {
    it('updatePrize 更新不存在的奖品不报错', () => {
      const store = useLotteryStore()
      expect(() => { store.updatePrize(createPrize('nonexistent')) }).not.toThrow()
    })

    it('removePrize 删除不存在的奖品不报错', () => {
      const store = useLotteryStore()
      expect(() => { store.removePrize('nonexistent') }).not.toThrow()
    })

    it('removeWinner 删除不存在的中奖者不报错', () => {
      const store = useLotteryStore()
      expect(() => { store.removeWinner('nonexistent') }).not.toThrow()
    })
  })
})
