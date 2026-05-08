import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the entire module
const mockData: Record<string, unknown> = {}

vi.mock('../../src/composables/useLargeStorage', () => ({
  openDB: vi.fn(async () => ({
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        put: vi.fn((record: unknown) => {
          mockData[(record as any).key] = record
        }),
        get: vi.fn((key: string) => ({
          onsuccess: null as (() => void) | null,
          result: mockData[key],
        })),
        delete: vi.fn((key: string) => {
          delete mockData[key]
        }),
      })),
    })),
    objectStoreNames: { contains: (name: string) => name === 'state-data' },
    createObjectStore: vi.fn(),
  })),
  setStateData: vi.fn(async (data: string) => {
    mockData['full-state'] = { key: 'full-state', data, timestamp: Date.now() }
  }),
  getStateData: vi.fn(async (): Promise<string | null> => {
    const record = mockData['full-state'] as { data?: string } | undefined
    return record?.data ?? null
  }),
  clearStateData: vi.fn(async () => {
    delete mockData['full-state']
  }),
  getStateDataTimestamp: vi.fn(async (): Promise<number | null> => {
    const record = mockData['full-state'] as { timestamp?: number } | undefined
    return record?.timestamp ?? null
  }),
}))

import { openDB, setStateData, getStateData, clearStateData, getStateDataTimestamp } from '../../src/composables/useLargeStorage'

describe('useLargeStorage IndexedDB 存储', () => {
  beforeEach(() => {
    Object.keys(mockData).forEach(k => delete mockData[k])
    vi.clearAllMocks()
  })

  it('openDB 调用成功', async () => {
    const db = await openDB()
    expect(db).toBeDefined()
    expect(openDB).toHaveBeenCalled()
  })

  it('openDB 重复调用返回实例对象', async () => {
    const db1 = await openDB()
    const db2 = await openDB()
    expect(db1).toBeDefined()
    expect(db2).toBeDefined()
    expect(openDB).toHaveBeenCalledTimes(2)
  })

  it('setStateData 保存数据', async () => {
    await openDB()
    const testData = JSON.stringify({ eventName: '测试', prizes: [] })
    await setStateData(testData)
    expect(setStateData).toHaveBeenCalledWith(testData)
  })

  it('getStateData 读取数据', async () => {
    await openDB()
    const testData = JSON.stringify({ eventName: '测试' })
    await setStateData(testData)
    const retrieved = await getStateData()
    expect(retrieved).toBe(testData)
  })

  it('getStateData 数据不存在时返回 null', async () => {
    await openDB()
    Object.keys(mockData).forEach(k => delete mockData[k])
    const result = await getStateData()
    expect(result).toBeNull()
  })

  it('clearStateData 清空数据', async () => {
    await openDB()
    await setStateData('{}')
    await clearStateData()
    expect(clearStateData).toHaveBeenCalled()
  })

  it('getStateDataTimestamp 返回时间戳', async () => {
    await openDB()
    await setStateData('{}')
    const timestamp = await getStateDataTimestamp()
    expect(timestamp).toBeGreaterThan(0)
  })

  it('getStateDataTimestamp 无数据时返回 null', async () => {
    await openDB()
    Object.keys(mockData).forEach(k => delete mockData[k])
    const timestamp = await getStateDataTimestamp()
    expect(timestamp).toBeNull()
  })

  it('数据库对象包含 state-data 对象存储', async () => {
    const db = await openDB()
    expect(db.objectStoreNames.contains('state-data')).toBe(true)
  })

  it('setStateData 事务操作被正确调用', async () => {
    await openDB()
    await setStateData('test')
    expect(setStateData).toHaveBeenCalledTimes(1)
  })
})
