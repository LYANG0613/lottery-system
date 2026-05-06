import { test, expect } from '@playwright/test'

test.describe('抽奖页面 (LotteryPage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('页面正常加载，无控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(1000)
    const realErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('image.png') && !e.includes('404')
    )
    expect(realErrors).toHaveLength(0)
  })

  test('页面标题存在', async ({ page }) => {
    await expect(page.locator('.site-title')).toBeVisible()
  })

  test('默认显示"企业年度盛典"标题', async ({ page }) => {
    await expect(page.locator('.site-title')).toContainText('企业年度盛典')
  })

  test('当前奖项卡片存在', async ({ page }) => {
    await expect(page.locator('.current-prize-card')).toBeVisible()
  })

  test('无奖品时显示提示', async ({ page }) => {
    await expect(page.locator('.no-prize')).toBeVisible()
  })

  test('抽奖机器组件存在', async ({ page }) => {
    await expect(page.locator('.lottery-machine')).toBeVisible()
  })

  test('开始抽奖按钮存在', async ({ page }) => {
    await expect(page.locator('.start-btn')).toBeVisible()
  })

  test('中奖名单卡片存在', async ({ page }) => {
    await expect(page.locator('.winners-card')).toBeVisible()
  })

  test('无中奖名单时显示空状态', async ({ page }) => {
    await expect(page.locator('.empty-winners')).toBeVisible()
  })

  test('点击管理后台跳转', async ({ page }) => {
    await page.click('button:has-text("管理后台")')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('粒子背景动画存在', async ({ page }) => {
    const particles = page.locator('.particle')
    const count = await particles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('外圈光环存在', async ({ page }) => {
    await expect(page.locator('.outer-ring')).toBeAttached()
  })

  test('滚动区域存在', async ({ page }) => {
    await expect(page.locator('.rolling-container')).toBeVisible()
  })
})
