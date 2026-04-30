/**
 * 大数据存储模块 - 解决 localStorage 5MB 容量限制
 * 将完整 state（含 base64 图片）存储到 IndexedDB
 */

const DB_NAME = 'lottery-system-db'
const DB_VERSION = 2
const STORE_NAME = 'state-data'
const STATE_KEY = 'full-state'

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error('无法打开 IndexedDB'))

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

export interface StateRecord {
  key: string
  data: string
  timestamp: number
}

export async function setStateData(data: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ key: STATE_KEY, data, timestamp: Date.now() } as StateRecord)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('保存数据失败'))
  })
}

export async function getStateData(): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(STATE_KEY)
    request.onsuccess = () => resolve(request.result?.data ?? null)
    request.onerror = () => reject(new Error('读取数据失败'))
  })
}

export async function clearStateData(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(STATE_KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('清空数据失败'))
  })
}

export async function getStateDataTimestamp(): Promise<number | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(STATE_KEY)
    request.onsuccess = () => resolve(request.result?.timestamp ?? null)
    request.onerror = () => reject(new Error('读取时间戳失败'))
  })
}
