import { test, expect } from '@playwright/test'

test.describe('入口页面 (EntryPage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('页面正常加载，无控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(1000)
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404'))).toHaveLength(0)
  })

  test('标题显示"企业抽奖系统"', async ({ page }) => {
    await expect(page.locator('.site-title')).toContainText('企业抽奖系统')
  })

  test('显示三个入口卡片', async ({ page }) => {
    const cards = page.locator('.entry-card')
    await expect(cards).toHaveCount(3)
  })

  test('用户端卡片显示正确', async ({ page }) => {
    const userCard = page.locator('.entry-card.user-card')
    await expect(userCard.locator('.card-title')).toContainText('用户端')
    await expect(userCard.locator('.card-desc')).toContainText('抽奖展示页面')
  })

  test('中奖公示卡片显示正确', async ({ page }) => {
    const winnersCard = page.locator('.entry-card.winners-card')
    await expect(winnersCard.locator('.card-title')).toContainText('中奖公示')
  })

  test('管理端卡片显示正确', async ({ page }) => {
    const adminCard = page.locator('.entry-card.admin-card')
    await expect(adminCard.locator('.card-title')).toContainText('管理端')
  })

  test('点击用户端卡片跳转到抽奖页面', async ({ page }) => {
    await page.click('.entry-card.user-card')
    await expect(page).toHaveURL(/\/lottery/)
  })

  test('点击中奖公示卡片跳转到公示页面', async ({ page }) => {
    await page.click('.entry-card.winners-card')
    await expect(page).toHaveURL(/\/winners/)
  })

  test('点击管理端卡片跳转到管理后台', async ({ page }) => {
    await page.click('.entry-card.admin-card')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('粒子背景动画存在', async ({ page }) => {
    const particles = page.locator('.particle')
    const count = await particles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Logo SVG 正常渲染', async ({ page }) => {
    const logo = page.locator('.logo-icon svg')
    await expect(logo).toBeVisible()
  })
})
