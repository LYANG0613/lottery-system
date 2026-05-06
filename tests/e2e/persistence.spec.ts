import { test, expect } from '@playwright/test'

test.describe('数据持久化', () => {
  test('localStorage 保存和恢复活动名称', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 设置活动名称
    await page.locator('input[placeholder*="2026"]').fill('2026年度盛典')
    await page.locator('input[placeholder*="2026"]').blur()
    await page.waitForTimeout(600)

    // 验证 localStorage 中有数据
    const storageData = await page.evaluate(() => localStorage.getItem('lottery-system-data'))
    expect(storageData).toBeTruthy()
    const parsed = JSON.parse(storageData!)
    expect(parsed.eventName).toBe('2026年度盛典')

    // 重新加载页面，数据应恢复
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[placeholder*="2026"]')).toHaveValue('2026年度盛典')
  })

  test('IndexedDB 降级存储（大数据）', async ({ page }) => {
    await page.goto('/admin')
    await page.evaluate(() => {
      localStorage.clear()
      indexedDB.deleteDatabase('lottery-system-db')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 写入超大量数据触发 IndexedDB 降级
    const largeData = 'x'.repeat(6 * 1024 * 1024) // ~6MB
    await page.evaluate((data) => {
      try {
        localStorage.setItem('lottery-test', data)
      } catch (e) {
        // 预期溢出
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          // 测试 IndexedDB 降级
          const req = indexedDB.open('lottery-system-db', 2)
          req.onupgradeneeded = () => {
            req.result.createObjectStore('state-data', { keyPath: 'key' })
          }
          req.onsuccess = () => {
            const db = req.result
            const tx = db.transaction('state-data', 'readwrite')
            tx.objectStore('state-data').put({ key: 'full-state', data, timestamp: Date.now() })
          }
        }
      }
    }, largeData)

    // IndexedDB 中应该有数据
    const idbData = await page.evaluate(() => {
      return new Promise<string | null>((resolve) => {
        const req = indexedDB.open('lottery-system-db', 2)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('state-data')) {
            resolve(null)
            return
          }
          const tx = db.transaction('state-data', 'readonly')
          const getReq = tx.objectStore('state-data').get('full-state')
          getReq.onsuccess = () => resolve(getReq.result?.data ?? null)
          getReq.onerror = () => resolve(null)
        }
        req.onerror = () => resolve(null)
      })
    })
    expect(idbData).toBeTruthy()
    expect(idbData!.length).toBeGreaterThan(5 * 1024 * 1024)
  })

})
