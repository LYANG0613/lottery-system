import { test, expect, Page } from '@playwright/test'

// 辅助函数：在 localStorage 中预置测试数据
async function seedTestData(page: Page, data: {
  eventName?: string
  participants?: Array<{ id: string; name: string; machineCode: string }>
  prizes?: Array<{ id: string; name: string; level: number; count: number }>
  winners?: Array<{ id: string; participantId: string; prizeId: string; winTime: string }>
}) {
  const prizes = data.prizes?.map(p => ({
    id: p.id,
    name: p.name,
    level: p.level,
    count: p.count,
    description: '',
    image: '',
    images: [],
    items: [],
  })) || []

  const participants = data.participants || []
  const winners = (data.winners || []).map(w => {
    const participant = participants.find(p => p.id === w.participantId)
    const prize = prizes.find(p => p.id === w.prizeId)
    return {
      id: w.id,
      participant: participant || { id: 'p1', name: '默认' },
      prize: prize || prizes[0],
      winTime: w.winTime,
    }
  })

  await page.evaluate((d) => {
    const state = {
      eventName: d.eventName || '',
      companyLogo: '',
      drawOrder: 'high-to-low',
      participants: d.participants || [],
      prizes: d.prizes || [],
      winners: d.winners || [],
    }
    localStorage.setItem('lottery-system-data', JSON.stringify(state))
  }, { eventName: data.eventName, participants, prizes, winners })
}

test.describe('抽奖页面完整流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('无参与者时点击抽奖显示警告', async ({ page }) => {
    // 无参与者
    await seedTestData(page, {
      prizes: [{ id: 'p1', name: '特等奖', level: 1, count: 1 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.click('.start-btn')
    await page.waitForTimeout(500)

    const message = page.locator('.el-message')
    await expect(message).toContainText(/暂无参与人员|参与人员/)
  })

  test('无奖品时点击抽奖显示警告', async ({ page }) => {
    // 有参与者但无奖品
    await seedTestData(page, {
      participants: [{ id: 'p1', name: '参与者A', machineCode: 'SN001' }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.click('.start-btn')
    await page.waitForTimeout(500)

    const message = page.locator('.el-message')
    await expect(message).toContainText(/暂无可抽奖项/)
  })

  test('参与人数不足时显示警告', async ({ page }) => {
    // 奖品名额多于参与者
    await seedTestData(page, {
      participants: [
        { id: 'p1', name: '参与者A', machineCode: 'SN001' },
        { id: 'p2', name: '参与者B', machineCode: 'SN002' },
      ],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 10 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.click('.start-btn')
    await page.waitForTimeout(500)

    const message = page.locator('.el-message')
    await expect(message).toContainText(/可用参与者不足/)
  })

  test('配置完整时开始抽奖按钮可用', async ({ page }) => {
    await seedTestData(page, {
      participants: [
        { id: 'p1', name: '参与者A', machineCode: 'SN001' },
        { id: 'p2', name: '参与者B', machineCode: 'SN002' },
        { id: 'p3', name: '参与者C', machineCode: 'SN003' },
      ],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const btn = page.locator('.start-btn')
    await expect(btn).toBeEnabled()
    await expect(btn).toContainText('开始抽奖')
  })

  test('点击开始抽奖后按钮变为抽奖中状态', async ({ page }) => {
    await seedTestData(page, {
      participants: Array.from({ length: 5 }, (_, i) => ({
        id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(3, '0')}`,
      })),
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.click('.start-btn')

    const btn = page.locator('.start-btn')
    await expect(btn).toBeDisabled()
    await expect(btn).toContainText(/抽奖中/)
  })

  test('抽奖过程中快速点击不会多次启动', async ({ page }) => {
    await seedTestData(page, {
      participants: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(3, '0')}`,
      })),
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 快速连续点击
    await page.click('.start-btn')
    await page.click('.start-btn')
    await page.click('.start-btn')

    const btn = page.locator('.start-btn')
    await expect(btn).toBeDisabled()
  })

  test('全部奖品抽完后按钮显示等待配置', async ({ page }) => {
    await seedTestData(page, {
      participants: [
        { id: 'p1', name: '参与者A', machineCode: 'SN001' },
      ],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
      winners: [{
        id: 'w1',
        participantId: 'p1',
        prizeId: 'prize1',
        winTime: new Date().toISOString(),
      }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const btn = page.locator('.start-btn')
    await expect(btn).toBeDisabled()
    await expect(btn).toContainText(/等待配置/)
  })

  test('全屏模式切换', async ({ page }) => {
    await seedTestData(page, {
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const fullscreenBtn = page.locator('button[title="全屏模式"]')
    await expect(fullscreenBtn).toBeVisible()

    // 退出全屏（如果已在全屏）
    if (await page.evaluate(() => !!document.fullscreenElement)) {
      await page.keyboard.press('Escape')
    }
  })

  test('导入抽奖页后数据正确恢复', async ({ page }) => {
    await seedTestData(page, {
      eventName: '2026年度盛典',
      participants: [
        { id: 'p1', name: '参与者A', machineCode: 'SN001' },
        { id: 'p2', name: '参与者B', machineCode: 'SN002' },
      ],
      prizes: [
        { id: 'prize1', name: '特等奖', level: 1, count: 1 },
        { id: 'prize2', name: '一等奖', level: 2, count: 3 },
      ],
    })

    await page.goto('/lottery')
    await page.waitForLoadState('networkidle')

    // 验证页面标题
    await expect(page.locator('.site-title')).toContainText('2026年度盛典')

    // 验证当前奖项显示
    await expect(page.locator('.prize-name')).toContainText('特等奖')

    // 验证参与者数量
    await expect(page.locator('.stat-value').first()).toContainText('2')
  })

  test('多批次抽奖进度正确显示', async ({ page }) => {
    await seedTestData(page, {
      participants: Array.from({ length: 15 }, (_, i) => ({
        id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(3, '0')}`,
      })),
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 25 }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 验证显示"第1轮 第1/3批"
    await expect(page.locator('.prize-round-badge')).toContainText('第 1 轮')
    await expect(page.locator('.prize-round-badge')).toContainText('第 1/3 批')
  })

  test('奖项列表正确显示完成状态', async ({ page }) => {
    await seedTestData(page, {
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [
        { id: 'p1', name: '特等奖', level: 1, count: 1 },
        { id: 'p2', name: '一等奖', level: 2, count: 1 },
      ],
      winners: [{
        id: 'w1', participantId: 'p1', prizeId: 'p1', winTime: new Date().toISOString(),
      }],
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const prizeItems = page.locator('.prize-item')
    await expect(prizeItems).toHaveCount(2)

    const doneItem = page.locator('.prize-item.is-done')
    await expect(doneItem).toHaveCount(1)
  })
})
