import { test, expect } from '@playwright/test'

test.describe('中奖公示页面 (WinnersPage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/winners')
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

  test('默认显示"2026开工大促"标题', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('2026开工大促')
  })

  test('页面副标题显示"中奖名单公示"', async ({ page }) => {
    await expect(page.locator('.header-subtitle')).toContainText('中奖名单公示')
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

  test('粒子背景存在', async ({ page }) => {
    const particles = page.locator('.particle')
    const count = await particles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('中央光效存在', async ({ page }) => {
    await expect(page.locator('.glow-center')).toBeAttached()
  })
})
