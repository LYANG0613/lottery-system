import { test, expect, Page } from '@playwright/test'

async function seedWinners(page: Page, winners: Array<{
  id: string
  participantId: string
  prizeId: string
  machineCode: string
  winTime: string
}>) {
  await page.evaluate((w) => {
    const prizes = [
      { id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] },
      { id: 'prize2', name: '一等奖', level: 2, count: 3, description: '', image: '', images: [], items: [] },
    ]
    const winnersData = w.map(entry => ({
      id: entry.id,
      participant: { id: entry.participantId, name: entry.machineCode, machineCode: entry.machineCode },
      prize: prizes.find(p => p.id === entry.prizeId),
      winTime: entry.winTime,
    }))
    const state = {
      eventName: '2026年度盛典',
      companyLogo: '',
      drawOrder: 'high-to-low',
      participants: w.map(e => ({ id: e.participantId, name: e.machineCode, machineCode: e.machineCode })),
      prizes,
      winners: winnersData,
    }
    localStorage.setItem('lottery-system-data', JSON.stringify(state))
  }, winners)
}

test.describe('中奖公示页面 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/winners')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('无中奖名单时显示空状态', async ({ page }) => {
    await expect(page.locator('.empty-state')).toBeVisible()
    await expect(page.locator('.empty-title')).toContainText('暂无中奖名单')
  })

  test('空状态显示"进入抽奖"按钮', async ({ page }) => {
    const btn = page.locator('.empty-state button:has-text("进入抽奖")')
    await expect(btn).toBeVisible()
  })

  test('点击"进入抽奖"跳转', async ({ page }) => {
    await page.click('.empty-state button:has-text("进入抽奖")')
    await expect(page).toHaveURL(/\/lottery/)
  })

  test('返回入口按钮存在', async ({ page }) => {
    const btn = page.locator('button:has-text("返回入口")')
    await expect(btn).toBeVisible()
  })

  test('点击"返回入口"跳转', async ({ page }) => {
    await page.click('button:has-text("返回入口")')
    await expect(page).toHaveURL('/')
  })

  test('有中奖数据时显示分组列表', async ({ page }) => {
    await seedWinners(page, [
      { id: 'w1', participantId: 'p1', prizeId: 'prize1', machineCode: 'SN001', winTime: new Date().toISOString() },
      { id: 'w2', participantId: 'p2', prizeId: 'prize2', machineCode: 'SN002', winTime: new Date().toISOString() },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')

    const groups = page.locator('.prize-group')
    await expect(groups).toHaveCount(2)
  })

  test('分组按等级排序', async ({ page }) => {
    await seedWinners(page, [
      { id: 'w1', participantId: 'p1', prizeId: 'prize1', machineCode: 'SN001', winTime: new Date().toISOString() },
      { id: 'w2', participantId: 'p2', prizeId: 'prize2', machineCode: 'SN002', winTime: new Date().toISOString() },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')

    const groupHeaders = page.locator('.prize-group .group-badge')
    const texts = await groupHeaders.allTextContents()
    expect(texts[0]).toContain('特等奖')
    expect(texts[1]).toContain('一等奖')
  })

  test('中奖者 SN 正确显示', async ({ page }) => {
    await seedWinners(page, [
      { id: 'w1', participantId: 'p1', prizeId: 'prize1', machineCode: 'SN001', winTime: new Date().toISOString() },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')

    const winnerSN = page.locator('.winner-sn')
    await expect(winnerSN.first()).toContainText('SN001')
  })

  test('页面标题随活动名称更新', async ({ page }) => {
    await seedWinners(page, [])
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.page-title')).toContainText('2026年度盛典')
  })

  test('总人数显示正确', async ({ page }) => {
    await seedWinners(page, [
      { id: 'w1', participantId: 'p1', prizeId: 'prize1', machineCode: 'SN001', winTime: new Date().toISOString() },
      { id: 'w2', participantId: 'p2', prizeId: 'prize2', machineCode: 'SN002', winTime: new Date().toISOString() },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.total-badge')).toContainText('共 2 位')
  })

  test('全屏模式切换按钮存在', async ({ page }) => {
    const fullscreenBtn = page.locator('button[title="全屏模式"]')
    await expect(fullscreenBtn).toBeVisible()
  })

  test('多个中奖组正确分组展示', async ({ page }) => {
    await seedWinners(page, [
      { id: 'w1', participantId: 'p1', prizeId: 'prize1', machineCode: 'SN001', winTime: new Date().toISOString() },
      { id: 'w2', participantId: 'p2', prizeId: 'prize2', machineCode: 'SN002', winTime: new Date().toISOString() },
      { id: 'w3', participantId: 'p3', prizeId: 'prize2', machineCode: 'SN003', winTime: new Date().toISOString() },
    ])
    await page.reload()
    await page.waitForLoadState('networkidle')

    const groups = page.locator('.prize-group')
    await expect(groups).toHaveCount(2)

    const group1Count = page.locator('.prize-group').first().locator('.winner-card')
    const group2Count = page.locator('.prize-group').last().locator('.winner-card')
    await expect(group1Count).toHaveCount(1)
    await expect(group2Count).toHaveCount(2)
  })
})
