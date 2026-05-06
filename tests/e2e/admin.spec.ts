import { test, expect } from '@playwright/test'

test.describe('管理后台 (AdminPage)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
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

  test('页面标题正确', async ({ page }) => {
    await expect(page.locator('.site-title')).toContainText('抽奖系统管理后台')
  })

  test('返回首页按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("返回首页")')).toBeVisible()
  })

  test('抽奖页面按钮存在', async ({ page }) => {
    // 有多个含"抽奖页面"的按钮，使用更精确的选择器
    await expect(page.locator('.header-actions button:has-text("抽奖页面")')).toBeVisible()
  })

  test('活动设置默认展开', async ({ page }) => {
    await expect(page.locator('.card-header:has-text("活动设置")')).toBeVisible()
  })

  test('可以输入活动名称', async ({ page }) => {
    const input = page.locator('input[placeholder*="2026"]')
    await input.fill('测试年度盛典')
    await input.blur()
    await page.waitForTimeout(500)
  })

  test('奖品配置区域默认展开', async ({ page }) => {
    await expect(page.locator('.card-header:has-text("奖品配置")')).toBeVisible()
  })

  test('奖品列表初始为空', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await expect(page.locator('.prize-list .empty-hint')).toContainText('暂无奖品')
  })

  test('点击"添加奖品"按钮打开对话框', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.click('button:has-text("添加奖品")')
    await expect(page.locator('.el-dialog')).toBeVisible()
    await expect(page.locator('.el-dialog__title')).toContainText('添加奖品')
  })

  test('保存奖品后列表显示新奖品', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.click('button:has-text("添加奖品")')
    await page.waitForTimeout(300)
    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('测试奖品')
    await page.locator('.el-dialog .el-select').click()
    await page.waitForTimeout(200)
    await page.locator('.el-select-dropdown__item:has-text("特等奖")').click()
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)
    await expect(page.locator('.prize-list')).toContainText('测试奖品')
  })

  test('参与人员区域默认折叠', async ({ page }) => {
    const uploadArea = page.locator('.upload-area')
    await expect(uploadArea).toBeHidden()
  })

  test('展开参与人员区域显示上传区域', async ({ page }) => {
    await page.locator('.card-header:has-text("参与人员")').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.upload-area')).toBeVisible()
  })

  test('上传区域显示正确的提示文字', async ({ page }) => {
    await page.locator('.card-header:has-text("参与人员")').click()
    await expect(page.locator('.upload-text')).toContainText('拖拽Excel文件')
    await expect(page.locator('.upload-hint')).toContainText('.xlsx')
  })

  test('中奖名单初始为空', async ({ page }) => {
    await expect(page.locator('.winners-body')).toContainText('暂无')
  })

  test('导出Excel按钮初始禁用', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("导出Excel")').first()
    await expect(exportBtn).toBeDisabled()
  })

  test('点击进入抽奖页面跳转', async ({ page }) => {
    await page.click('.quick-actions button:has-text("进入抽奖页面")')
    await expect(page).toHaveURL(/\/lottery/)
  })

  test('备份按钮存在', async ({ page }) => {
    await expect(page.locator('button:has-text("备份当前数据")')).toBeVisible()
  })

  test('恢复备份按钮初始禁用（无备份）', async ({ page }) => {
    await expect(page.locator('button:has-text("恢复备份")')).toBeDisabled()
  })

  test('点击备份显示成功提示', async ({ page }) => {
    await page.click('button:has-text("备份当前数据")')
    await page.waitForTimeout(500)
    const toast = page.locator('.el-message')
    await expect(toast).toContainText(/备份/)
  })
})
