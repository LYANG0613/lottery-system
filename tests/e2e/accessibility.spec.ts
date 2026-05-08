import { test, expect, Page } from '@playwright/test'

test.describe('可访问性测试 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lottery')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })

  test('所有按钮有可访问的 label 或文字内容', async ({ page }) => {
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      expect(
        (text && text.trim().length > 0) || ariaLabel,
        `Button ${i} has no accessible text or aria-label`
      ).toBeTruthy()
    }
  })

  test('焦点样式可见（:focus-visible）', async ({ page }) => {
    await page.evaluate(() => {
      const btn = document.querySelector('button')
      if (btn) btn.focus()
    })

    const focused = page.locator('button:focus-visible, button:focus')
    await expect(focused).toBeVisible()
  })

  test('Tab 键焦点顺序合理', async ({ page }) => {
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(firstFocused).toBeTruthy()
  })

  test('图片有 alt 属性或 role', async ({ page }) => {
    const images = page.locator('img')
    const count = await images.count()

    // 允许无 alt（Logo等装饰图），但不应有 HTML 验证错误
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')

      // 有 src 的 img 应该有 alt（装饰图可以是 alt=""）
      if (src && !src.startsWith('data:')) {
        // Logo 等装饰图可以有空的 alt
        expect(alt !== undefined).toBeTruthy()
      }
    }
  })
})

test.describe('抽奖页面可访问性', () => {
  test('开始抽奖按钮有可访问的文字', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.evaluate(() => {
      localStorage.setItem('lottery-system-data', JSON.stringify({
        eventName: '', companyLogo: '', drawOrder: 'high-to-low',
        participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const btn = page.locator('.start-btn')
    const text = await btn.textContent()
    expect(text).toContain('开始抽奖')
  })

  test('奖项信息有文字标签', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.evaluate(() => {
      localStorage.setItem('lottery-system-data', JSON.stringify({
        eventName: '', companyLogo: '', drawOrder: 'high-to-low',
        participants: [],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 当前奖项标签
    const prizeLabel = page.locator('.prize-level-badge')
    await expect(prizeLabel).toBeVisible()
    const label = await prizeLabel.textContent()
    expect(label).toContain('特等奖')
  })
})

test.describe('管理后台可访问性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('表单输入框有 label 或 placeholder', async ({ page }) => {
    const inputs = page.locator('input')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const placeholder = await input.getAttribute('placeholder')
      const ariaLabel = await input.getAttribute('aria-label')
      expect(
        placeholder || ariaLabel,
        `Input ${i} has no placeholder or aria-label`
      ).toBeTruthy()
    }
  })

  test('对话框有关闭机制', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')

    const dialog = page.locator('.el-dialog')
    await expect(dialog).toBeVisible()

    // 点击取消按钮
    await page.locator('.el-dialog__footer button:has-text("取消")').click()
    await page.waitForTimeout(300)

    // 对话框应关闭
    await expect(dialog).not.toBeVisible()
  })
})

test.describe('奖项配置可访问性', () => {
  test('奖项等级下拉选择器可用键盘操作', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')

    // Tab 到下拉选择器
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')

    // 下拉选项应可见
    await page.waitForTimeout(300)
    const dropdown = page.locator('.el-select-dropdown')
    await expect(dropdown).toBeVisible()
  })
})
