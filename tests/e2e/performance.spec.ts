import { test, expect, Page } from '@playwright/test'

test.describe('性能测试 E2E', () => {
  test('大量参与者时页面加载时间可接受', async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())

    // 预置 500 个参与者
    const participants = Array.from({ length: 500 }, (_, i) => ({
      id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(4, '0')}`,
    }))
    await page.evaluate((p) => {
      localStorage.setItem('lottery-system-data', JSON.stringify({
        eventName: '性能测试', companyLogo: '', drawOrder: 'high-to-low',
        participants: p,
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }))
    }, participants)

    const start = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start

    // 页面应在 3 秒内加载完成
    expect(loadTime).toBeLessThan(3000)

    // 验证参与者数量
    await expect(page.locator('.stat-value').first()).toContainText('500')
  })

  test('大量中奖名单时渲染性能可接受', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())

    // 预置 100 个中奖者
    const participants = Array.from({ length: 100 }, (_, i) => ({
      id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(4, '0')}`,
    }))
    const winners = Array.from({ length: 100 }, (_, i) => ({
      id: `w${i}`,
      participant: participants[i],
      prize: { id: 'prize1', name: '特等奖', level: 1, count: 100, description: '', image: '', images: [], items: [] },
      winTime: new Date().toISOString(),
    }))

    await page.evaluate((w) => {
      localStorage.setItem('lottery-system-data', JSON.stringify({
        eventName: '性能测试', companyLogo: '', drawOrder: 'high-to-low',
        participants: w.participants, prizes: w.prizes, winners: w.winners,
      }))
    }, {
      participants,
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 100, description: '', image: '', images: [], items: [] }],
      winners,
    })

    const start = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start

    expect(loadTime).toBeLessThan(3000)
  })

  test('IndexedDB 大量数据读写性能', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => {
      indexedDB.deleteDatabase('lottery-system-db')
    })

    // 测试 IndexedDB 写入性能
    const writeTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const start = Date.now()
        const req = indexedDB.open('lottery-test-perf', 1)
        req.onupgradeneeded = () => {
          req.result.createObjectStore('perf-data', { keyPath: 'key' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('perf-data', 'readwrite')
          const store = tx.objectStore('perf-data')
          const data = 'x'.repeat(100 * 1024) // 100KB
          store.put({ key: 'test', data, timestamp: Date.now() })
          tx.oncomplete = () => resolve(Date.now() - start)
          tx.onerror = () => resolve(Date.now() - start)
        }
      })
    })

    // 写入应在 1 秒内完成
    expect(writeTime).toBeLessThan(1000)

    // 清理
    await page.evaluate(() => {
      indexedDB.deleteDatabase('lottery-test-perf')
    })
  })

  test('组件渲染性能（大量奖品列表）', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())

    // 预置 50 个奖品
    const prizes = Array.from({ length: 50 }, (_, i) => ({
      id: `prize${i}`,
      name: `奖品${i}`,
      level: (i % 6) + 1,
      count: 3,
      description: '',
      image: '',
      images: [],
      items: [],
    }))

    await page.evaluate((p) => {
      localStorage.setItem('lottery-system-data', JSON.stringify({
        eventName: '性能测试', companyLogo: '', drawOrder: 'high-to-low',
        participants: [], prizes: p, winners: [],
      }))
    }, prizes)

    const start = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const renderTime = Date.now() - start

    // 渲染应在 2 秒内完成
    expect(renderTime).toBeLessThan(2000)

    // 验证奖品数量
    const badge = page.locator('.count-badge--warning')
    await expect(badge).toContainText('50')
  })
})

test.describe('渲染与重绘性能', () => {
  test('页面切换时间可接受', async ({ page }) => {
    const switchTimes: number[] = []

    // Entry -> Lottery
    let start = Date.now()
    await page.goto('/lottery')
    await page.waitForLoadState('networkidle')
    switchTimes.push(Date.now() - start)

    // Lottery -> Admin
    start = Date.now()
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    switchTimes.push(Date.now() - start)

    // Admin -> Winners
    start = Date.now()
    await page.goto('/winners')
    await page.waitForLoadState('networkidle')
    switchTimes.push(Date.now() - start)

    // 所有页面切换应在 3 秒内完成
    for (const t of switchTimes) {
      expect(t).toBeLessThan(3000)
    }
  })
})
