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
      eventName: '', companyLogo: '', drawOrder: 'high-to-low',
      participants, prizes, winners,
    }
    localStorage.setItem('lottery-system-data', JSON.stringify(state))
  }, data)
}

test.describe('边界情况 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('零参与者时显示空状态', async ({ page }) => {
    await expect(page.locator('.stat-value').first()).toContainText('0')
    await expect(page.locator('.empty-winners')).toBeVisible()
  })

  test('零奖品时显示"暂无奖品配置"', async ({ page }) => {
    await expect(page.locator('.no-prize')).toBeVisible()
    await expect(page.locator('.no-prize p')).toContainText('暂无可抽奖项')
  })

  test('零奖品时按钮显示等待配置', async ({ page }) => {
    await expect(page.locator('.start-btn')).toContainText('等待配置')
    await expect(page.locator('.start-btn')).toBeDisabled()
  })

  test('浏览器刷新后数据恢复', async ({ page }) => {
    await seedData(page, {
      eventName: '刷新测试',
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })

    await page.goto('/lottery')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.site-title')).toContainText('刷新测试')
    await expect(page.locator('.prize-name')).toContainText('特等奖')
  })

  test('切换到管理页面后返回抽奖页数据保持', async ({ page }) => {
    await seedData(page, {
      eventName: '跨页面测试',
      participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
      prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1 }],
    })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.goto('/lottery')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.site-title')).toContainText('跨页面测试')
  })
})

test.describe('入口页面边界情况 E2E', () => {
  test('三个入口卡片都存在', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('.entry-card')
    await expect(cards).toHaveCount(3)
  })

  test('点击各卡片跳转到正确页面', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.locator('.entry-card.user-card').click()
    await expect(page).toHaveURL(/\/lottery/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('.entry-card.winners-card').click()
    await expect(page).toHaveURL(/\/winners/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('.entry-card.admin-card').click()
    await expect(page).toHaveURL(/\/admin/)
  })
})

test.describe('管理后台边界情况 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('无奖品时奖品列表显示空提示', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.empty-hint')).toContainText('暂无奖品')
  })

  test('无参与者时参与人员列表为空', async ({ page }) => {
    await page.locator('.card-header:has-text("参与人员")').click()
    await page.waitForTimeout(300)
    const tag = page.locator('.count-badge--info')
    await expect(tag).toContainText('0')
  })

  test('无中奖名单时显示空状态', async ({ page }) => {
    await expect(page.locator('.winners-body')).toContainText('暂无')
  })

  test('无备份时恢复按钮禁用', async ({ page }) => {
    await expect(page.locator('button:has-text("恢复备份")')).toBeDisabled()
  })

  test('无中奖名单时导出按钮禁用', async ({ page }) => {
    await expect(page.locator('button:has-text("导出Excel")').first()).toBeDisabled()
  })

  test('添加多个奖品后按等级排序', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)

    // 添加特等奖
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')
    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('特等奖')
    await page.locator('.el-dialog .el-select').click()
    await page.waitForTimeout(200)
    await page.locator('.el-select-dropdown__item:has-text("特等奖")').click()
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)

    // 添加参与奖
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')
    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('参与奖')
    await page.locator('.el-dialog .el-select').click()
    await page.waitForTimeout(200)
    await page.locator('.el-select-dropdown__item:has-text("参与奖")').click()
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)

    const prizeItems = page.locator('.prize-item .prize-level')
    const levels = await prizeItems.allTextContents()
    expect(levels[0]).toContain('特等奖')
    expect(levels[1]).toContain('参与奖')
  })
})
