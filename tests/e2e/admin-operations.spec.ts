import { test, expect, Page } from '@playwright/test'

async function clearAllStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear()
    indexedDB.deleteDatabase('lottery-system-db')
  })
}

async function seedParticipants(page: Page, count: number) {
  const participants = Array.from({ length: count }, (_, i) => ({
    id: `p${i}`, name: `参与者${i}`, machineCode: `SN${String(i).padStart(3, '0')}`,
  }))
  await page.evaluate((p) => {
    const state = {
      eventName: '',
      companyLogo: '',
      drawOrder: 'high-to-low',
      participants: p,
      prizes: [],
      winners: [],
    }
    localStorage.setItem('lottery-system-data', JSON.stringify(state))
  }, participants)
}

test.describe('管理后台操作流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await clearAllStorage(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async ({ page }) => {
    await clearAllStorage(page)
  })

  test('设置活动名称并持久化', async ({ page }) => {
    const input = page.locator('input[placeholder*="2026"]')
    await input.fill('2026年度盛典')
    await input.blur()
    await page.waitForTimeout(700)

    const storage = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    expect(storage).toBeTruthy()
    const parsed = JSON.parse(storage!)
    expect(parsed.eventName).toBe('2026年度盛典')
  })

  test('设置Logo URL', async ({ page }) => {
    const inputs = page.locator('input[placeholder*="URL"]')
    await inputs.fill('https://example.com/logo.png')
    await inputs.blur()
    await page.waitForTimeout(700)

    const storage = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    expect(JSON.parse(storage!).companyLogo).toBe('https://example.com/logo.png')
  })

  test('切换抽奖顺序', async ({ page }) => {
    const radioBtn = page.locator('.el-radio-button__inner:has-text("从低到高")')
    await radioBtn.click()
    await page.waitForTimeout(700)

    const storage = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    expect(JSON.parse(storage!).drawOrder).toBe('low-to-high')
  })

  test('添加奖品', async ({ page }) => {
    // 展开奖品配置
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)

    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')

    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('特等奖-iPhone')
    await page.locator('.el-dialog .el-select').click()
    await page.waitForTimeout(200)
    await page.locator('.el-select-dropdown__item:has-text("特等奖")').click()
    await page.locator('.el-dialog .el-input-number input').fill('2')
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)

    await expect(page.locator('.prize-list')).toContainText('特等奖-iPhone')
  })

  test('删除奖品前弹出确认对话框', async ({ page }) => {
    // 先添加一个奖品
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')
    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('测试奖品')
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)

    // 点击删除
    await page.locator('.prize-item .el-button--danger').first().click()
    await page.waitForTimeout(300)

    // 验证确认对话框出现
    const dialog = page.locator('.el-message-box')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/确定要删除/)

    // 取消
    await page.locator('.el-message-box__btns button:has-text("取消")').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.prize-list')).toContainText('测试奖品')
  })

  test('确认删除奖品', async ({ page }) => {
    await page.locator('.card-header:has-text("奖品配置")').click()
    await page.waitForTimeout(200)
    await page.click('button:has-text("添加奖品")')
    await page.waitForSelector('.el-dialog')
    await page.locator('.el-dialog input[placeholder*="iPhone"]').fill('待删除奖品')
    await page.locator('.el-dialog__footer button:has-text("保存")').click()
    await page.waitForTimeout(500)

    await page.locator('.prize-item .el-button--danger').first().click()
    await page.waitForTimeout(200)
    await page.locator('.el-message-box__btns button:has-text("确定")').click()
    await page.waitForTimeout(300)

    await expect(page.locator('.prize-list')).not.toContainText('待删除奖品')
  })

  test('清空中奖名单前弹出确认对话框', async ({ page }) => {
    // 预置中奖数据
    await page.evaluate(() => {
      const state = {
        eventName: '', companyLogo: '', drawOrder: 'high-to-low',
        participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [{
          id: 'w1',
          participant: { id: 'p1', name: 'A', machineCode: 'SN001' },
          prize: { id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] },
          winTime: new Date().toISOString(),
        }],
      }
      localStorage.setItem('lottery-system-data', JSON.stringify(state))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const clearBtn = page.locator('button:has-text("清空中奖")')
    await expect(clearBtn).toBeEnabled()

    await clearBtn.click()
    await page.waitForTimeout(300)

    const dialog = page.locator('.el-message-box')
    await expect(dialog).toBeVisible()

    await page.locator('.el-message-box__btns button:has-text("取消")').click()
    await page.waitForTimeout(300)
  })

  test('确认清空中奖名单', async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        eventName: '', companyLogo: '', drawOrder: 'high-to-low',
        participants: [],
        prizes: [],
        winners: [{
          id: 'w1',
          participant: { id: 'p1', name: 'A', machineCode: 'SN001' },
          prize: { id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] },
          winTime: new Date().toISOString(),
        }],
      }
      localStorage.setItem('lottery-system-data', JSON.stringify(state))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const clearBtn = page.locator('button:has-text("清空中奖")')
    await clearBtn.click()
    await page.waitForTimeout(200)
    await page.locator('.el-message-box__btns button:has-text("确定清空")').click()
    await page.waitForTimeout(500)

    await expect(page.locator('.winners-body')).toContainText('暂无')
  })

  test('重置所有数据前弹出危险警告', async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        eventName: '盛典', companyLogo: '', drawOrder: 'high-to-low',
        participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }
      localStorage.setItem('lottery-system-data', JSON.stringify(state))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const resetBtn = page.locator('button:has-text("重置所有数据")')
    await resetBtn.click()
    await page.waitForTimeout(300)

    const dialog = page.locator('.el-message-box')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/危险操作|重置/)

    await page.locator('.el-message-box__btns button:has-text("取消")').click()
  })

  test('确认重置所有数据', async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        eventName: '盛典', companyLogo: '', drawOrder: 'low-to-high',
        participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }
      localStorage.setItem('lottery-system-data', JSON.stringify(state))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    const resetBtn = page.locator('button:has-text("重置所有数据")')
    await resetBtn.click()
    await page.waitForTimeout(200)
    await page.locator('.el-message-box__btns button:has-text("确定重置")').click()
    await page.waitForTimeout(700)

    const storage = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    const parsed = JSON.parse(storage!)
    expect(parsed.eventName).toBe('')
    expect(parsed.participants).toHaveLength(0)
    expect(parsed.prizes).toHaveLength(0)
  })

  test('备份数据成功', async ({ page }) => {
    await page.evaluate(() => {
      const state = {
        eventName: '盛典', companyLogo: '', drawOrder: 'high-to-low',
        participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
        prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
        winners: [],
      }
      localStorage.setItem('lottery-system-data', JSON.stringify(state))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.click('button:has-text("备份当前数据")')
    await page.waitForTimeout(500)

    const toast = page.locator('.el-message')
    await expect(toast).toContainText(/备份/)

    const backupStorage = await page.evaluate(() => localStorage.getItem('lottery-system-backup'))
    expect(backupStorage).toBeTruthy()
    const backup = JSON.parse(backupStorage!)
    expect(backup.description).toBe('管理后台手动备份')
    expect(backup.state.eventName).toBe('盛典')
  })

  test('恢复备份后数据还原', async ({ page }) => {
    // 先创建备份
    await page.evaluate(() => {
      const backup = {
        state: {
          eventName: '备份盛典',
          companyLogo: '',
          drawOrder: 'high-to-low',
          participants: [{ id: 'p1', name: 'A', machineCode: 'SN001' }],
          prizes: [{ id: 'prize1', name: '特等奖', level: 1, count: 1, description: '', image: '', images: [], items: [] }],
          winners: [],
        },
        timestamp: Date.now(),
        description: '手动备份',
      }
      localStorage.setItem('lottery-system-backup', JSON.stringify(backup))
      localStorage.setItem('lottery-system-data', JSON.stringify({ eventName: '当前盛典', companyLogo: '', drawOrder: 'high-to-low', participants: [], prizes: [], winners: [] }))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 恢复备份按钮应可用
    const restoreBtn = page.locator('button:has-text("恢复备份")')
    await expect(restoreBtn).toBeEnabled()

    await restoreBtn.click()
    await page.waitForTimeout(200)
    await page.locator('.el-message-box__btns button:has-text("确定恢复")').click()
    await page.waitForTimeout(700)

    const storage = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    const parsed = JSON.parse(storage!)
    expect(parsed.eventName).toBe('备份盛典')
  })

  test('导航到抽奖页面', async ({ page }) => {
    await page.click('button:has-text("进入抽奖页面")')
    await expect(page).toHaveURL(/\/lottery/)
  })

  test('返回首页', async ({ page }) => {
    await page.click('button:has-text("返回首页")')
    await expect(page).toHaveURL('/')
  })
})
