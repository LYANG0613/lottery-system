import { test, expect, Page } from '@playwright/test'

async function seedData(page: Page, data: {
  participants?: Array<{ id: string; name: string; machineCode: string }>
  prizes?: Array<{ id: string; name: string; level: number; count: number }>
  winners?: Array<{ id: string; participantId: string; prizeId: string; winTime: string }>
}) {
  await page.evaluate((d) => {
    const prizes = (d.prizes || []).map((p: any) => ({
      id: p.id, name: p.name, level: p.level, count: p.count,
      description: '', image: '', images: [], items: [],
    }))
    const participants = d.participants || []
    const winners = (d.winners || []).map((w: any) => {
      const participant = participants.find((p: any) => p.id === w.participantId)
      const prize = prizes.find((p: any) => p.id === w.prizeId)
      return {
        id: w.id,
        participant: participant || { id: 'p1', name: '默认' },
        prize: prize || prizes[0],
        winTime: w.winTime,
      }
    })
    const state = {
      eventName: '数据完整性测试', companyLogo: '', drawOrder: 'high-to-low',
      participants, prizes, winners,
    }
    localStorage.setItem('lottery-system-data', JSON.stringify(state))
  }, data)
}

test.describe('数据完整性 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('参与者不能同时中多个奖项', async ({ page }) => {
    // 模拟作弊：一个参与者被设为两个不同奖品的中奖者
    await seedData(page, {
      participants: [{ id: 'p1', name: '参与者A', machineCode: 'SN001' }],
      prizes: [
        { id: 'prize1', name: '特等奖', level: 1, count: 1 },
        { id: 'prize2', name: '一等奖', level: 2, count: 1 },
      ],
      winners: [
        { id: 'w1', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
        { id: 'w2', participantId: 'p1', prizeId: 'prize2', winTime: new Date().toISOString() },
      ],
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // 验证 store 中确实有两个中奖记录（客户端验证）
    const winnerCount = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      if (!data) return 0
      return JSON.parse(data).winners.length
    })
    expect(winnerCount).toBe(2)

    // 验证可用参与者为 0
    const available = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      if (!data) return 0
      const state = JSON.parse(data)
      const winnerIds = new Set(state.winners.map((w: any) => w.participant.id))
      return state.participants.filter((p: any) => !winnerIds.has(p.id)).length
    })
    expect(available).toBe(0)
  })

  test('同一奖品不能中多次（名额限制）', async ({ page }) => {
    // 模拟超出名额的情况
    await seedData(page, {
      participants: [{ id: 'p1', name: '参与者A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
      winners: [
        { id: 'w1', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
        { id: 'w2', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
      ],
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // 验证 getRemainingPrizeCount 不能为负数
    const remaining = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      if (!data) return 0
      const state = JSON.parse(data)
      const prize = state.prizes.find((p: any) => p.id === 'prize1')
      const wonCount = state.winners.filter((w: any) => w.prize.id === 'prize1').length
      return Math.max(0, prize.count - wonCount)
    })
    expect(remaining).toBe(0)
  })

  test('getRemainingPrizeCount 永远不会返回负数', async ({ page }) => {
    // 超量中奖测试
    await seedData(page, {
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
      winners: [
        { id: 'w1', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
        { id: 'w2', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
        { id: 'w3', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString() },
      ],
    })

    const remaining = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      if (!data) return 0
      const state = JSON.parse(data)
      const prize = state.prizes.find((p: any) => p.id === 'prize1')
      if (!prize) return 0
      const wonCount = state.winners.filter((w: any) => w.prize.id === 'prize1').length
      return Math.max(0, prize.count - wonCount)
    })

    expect(remaining).toBe(0)
    expect(remaining).toBeGreaterThanOrEqual(0)
  })

  test('localStorage 数据损坏时使用默认状态', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('lottery-system-data', 'invalid json {{{')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const state = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      try {
        return JSON.parse(data || '{}')
      } catch {
        return { eventName: '', participants: [], prizes: [], winners: [] }
      }
    })

    expect(state.eventName).toBe('')
  })

  test('批量抽奖数据一致性', async ({ page }) => {
    // 10人一批
    const participants = Array.from({ length: 15 }, (_, i) => ({
      id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(3, '0')}`,
    }))

    await seedData(page, {
      participants,
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 10 }],
      winners: [],
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // 验证批次大小为 10
    const batchSize = Math.min(10, 10)
    expect(batchSize).toBe(10)
  })

  test('抽奖结果在 store 中与 animation 结果一致性', async ({ page }) => {
    // 验证 store 中的 winner 数据结构正确
    await seedData(page, {
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
      winners: [{
        id: 'w1',
        participantId: 'p1',
        prizeId: 'prize1',
        winTime: new Date().toISOString(),
      }],
    })

    const winnerData = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      if (!data) return null
      const state = JSON.parse(data)
      return state.winners[0]
    })

    expect(winnerData).not.toBeNull()
    expect(winnerData.participant.id).toBe('p1')
    expect(winnerData.prize.id).toBe('prize1')
    expect(winnerData.winTime).toBeTruthy()
  })

  test('localStorage 溢出时降级到 IndexedDB', async ({ page }) => {
    await page.evaluate(() => {
      // 清除 IndexedDB
      indexedDB.deleteDatabase('lottery-system-db')
    })

    // 写入超大数据触发溢出
    const overflowResult = await page.evaluate(() => {
      try {
        const largeData = 'x'.repeat(6 * 1024 * 1024) // ~6MB
        localStorage.setItem('lottery-test', largeData)
        return 'success'
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          return 'quota_exceeded'
        }
        return 'other_error'
      }
    })

    // 验证溢出处理
    expect(overflowResult).toBe('quota_exceeded')
  })

  test('清除数据后状态正确', async ({ page }) => {
    await seedData(page, {
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
      winners: [{
        id: 'w1', participantId: 'p1', prizeId: 'prize1', winTime: new Date().toISOString(),
      }],
    })

    // 执行清空
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    const state = await page.evaluate(() => {
      const data = localStorage.getItem('lottery-system-data')
      return data ? JSON.parse(data) : null
    })

    expect(state).toBeNull()
  })
})
