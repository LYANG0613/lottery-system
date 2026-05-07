import { watch, ref, reactive } from 'vue'
import type { LotteryDrawOrder, Participant, Prize, Winner } from '../types'
import {
  setStateData,
  getStateData,
  clearStateData
} from '../composables/useLargeStorage'
import {
  DEFAULT_DRAW_ORDER,
  normalizeDrawOrder,
  sortPrizesByDrawOrder
} from '../composables/useConstants'

const STORAGE_KEY = 'lottery-system-data'
const BACKUP_KEY = 'lottery-system-backup'
const IDB_METADATA_KEY = 'idb-saved'

export interface LotteryState {
  eventName: string
  companyLogo: string
  drawOrder: LotteryDrawOrder
  participants: Participant[]
  prizes: Prize[]
  winners: Winner[]
}

export interface BackupData {
  state: Partial<LotteryState>
  timestamp: number
  description: string
}

function defaultState(): LotteryState {
  return {
    eventName: '',
    companyLogo: import.meta.env.BASE_URL + 'logo.svg',
    drawOrder: DEFAULT_DRAW_ORDER,
    participants: [],
    prizes: [],
    winners: []
  }
}

function normalizeLotteryState(data?: Partial<LotteryState>): LotteryState {
  const normalized: LotteryState = {
    ...defaultState(),
    ...data,
    participants: data?.participants ?? [],
    prizes: data?.prizes ?? [],
    winners: data?.winners ?? []
  }
  normalized.drawOrder = normalizeDrawOrder(normalized.drawOrder)
  normalized.prizes = sortPrizesByDrawOrder(normalized.prizes, normalized.drawOrder)
  normalized.winners = normalized.winners.map((w: Winner) => ({
    ...w,
    winTime: new Date(w.winTime)
  }))
  return normalized
}

// 同步加载：优先从 localStorage 读取（同步，保证初始化时就拿到数据）
function loadFromStorageSync(): LotteryState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved) as Partial<LotteryState>
      return normalizeLotteryState(data)
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e)
  }
  return defaultState()
}

// 同步保存到 localStorage
function saveToLocalStorage(state: LotteryState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (e: unknown) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      return false
    }
    console.warn('Failed to save to localStorage:', e)
    return false
  }
}

// 异步加载：从 IndexedDB 恢复（仅在 localStorage 为空时使用）
async function loadFromIndexedDB(): Promise<void> {
  if (localStorage.getItem(IDB_METADATA_KEY) !== 'true') return
  try {
    const idbData = await getStateData()
    if (idbData) {
      const data = JSON.parse(idbData) as Partial<LotteryState>
      Object.assign(state, normalizeLotteryState(data))
    }
  } catch (e) {
    console.warn('Failed to load from IndexedDB:', e)
  }
}

// 异步保存到 IndexedDB（大数据溢出时降级）
async function saveToIndexedDB(stateData: LotteryState): Promise<void> {
  try {
    const serialized = JSON.stringify(stateData)
    await setStateData(serialized)
    localStorage.setItem(IDB_METADATA_KEY, 'true')
  } catch (e) {
    console.warn('Failed to save to IndexedDB:', e)
  }
}

function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved) as T
  } catch {
    // ignore
  }
  return null
}

function saveToLocalStorageRaw(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

// 全局状态：同步初始化，确保组件挂载时已有数据
const state = reactive<LotteryState>(loadFromStorageSync())

// 离开页面警告标记
const hasUnsavedChanges = ref(false)

// 存储就绪状态（等待 IndexedDB 数据恢复）
const storageReady = ref(false)

// 备份相关（不存储 base64 图片，避免 localStorage 溢出）
function createBackup(description: string = '手动备份'): BackupData | null {
  const stateWithoutBase64: Partial<LotteryState> = {}
  const entries = Object.entries(state) as [keyof LotteryState, unknown][]
  for (const [key, value] of entries) {
    if (key === 'companyLogo') {
      stateWithoutBase64[key] = '' as never
    } else if (Array.isArray(value)) {
      stateWithoutBase64[key] = [...value] as never
    } else {
      stateWithoutBase64[key] = value as never
    }
  }
  const backup: BackupData = {
    state: stateWithoutBase64,
    timestamp: Date.now(),
    description
  }
  const ok = saveToLocalStorageRaw(BACKUP_KEY, backup)
  return ok ? backup : null
}

function getBackup(): BackupData | null {
  const backup = loadFromLocalStorage<BackupData>(BACKUP_KEY)
  if (backup && backup.state.winners) {
    backup.state.winners = backup.state.winners.map((w: Winner) => ({
      ...w,
      winTime: new Date(w.winTime)
    }))
  }
  return backup
}

function clearBackup() {
  try {
    localStorage.removeItem(BACKUP_KEY)
  } catch {
    // ignore
  }
}

function restoreFromBackup(): boolean {
  const backup = getBackup()
  if (backup) {
    Object.assign(state, normalizeLotteryState(backup.state))
    hasUnsavedChanges.value = false
    return true
  }
  return false
}

// 初始化：从 IndexedDB 恢复大数据（异步，不阻塞初始化）
loadFromIndexedDB().then(() => {
  storageReady.value = true
})

// 自动保存（带防抖）
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => state,
  async () => {
    hasUnsavedChanges.value = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      // 先尝试同步保存到 localStorage
      const saved = saveToLocalStorage(state)
      if (!saved) {
        // localStorage 满了，降级到 IndexedDB
        await saveToIndexedDB(state)
      } else {
        // 同步保存成功，同时异步备份到 IndexedDB
        saveToIndexedDB(state)
      }
      hasUnsavedChanges.value = false
    }, 500)
  },
  { deep: true }
)

// 离开页面警告
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
    return ''
  }
}

// 在组件中使用时注册/注销事件
export function setupBeforeUnloadHandler() {
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    if (saveTimer) clearTimeout(saveTimer)
  }
}

export function useLotteryStore() {
  function setEventName(name: string) {
    state.eventName = name
  }

  function setCompanyLogo(logo: string) {
    state.companyLogo = logo
  }

  function setDrawOrder(order: LotteryDrawOrder) {
    state.drawOrder = normalizeDrawOrder(order)
    state.prizes = sortPrizesByDrawOrder(state.prizes, state.drawOrder)
  }

  function getOrderedPrizes(order: LotteryDrawOrder = state.drawOrder): Prize[] {
    return sortPrizesByDrawOrder(state.prizes, normalizeDrawOrder(order))
  }

  function setParticipants(participants: Participant[]) {
    state.participants = participants
  }

  function addParticipants(participants: Participant[]) {
    const existingIds = new Set(state.participants.map(p => p.id))
    const newParticipants = participants.filter(p => !existingIds.has(p.id))
    state.participants = [...state.participants, ...newParticipants]
  }

  function removeParticipant(id: string) {
    state.participants = state.participants.filter(p => p.id !== id)
  }

  function clearParticipants() {
    state.participants = []
  }

  function setPrizes(prizes: Prize[]) {
    state.prizes = sortPrizesByDrawOrder(prizes, state.drawOrder)
  }

  function addPrize(prize: Prize) {
    state.prizes = sortPrizesByDrawOrder([...state.prizes, prize], state.drawOrder)
  }

  function updatePrize(prize: Prize) {
    const index = state.prizes.findIndex(p => p.id === prize.id)
    if (index !== -1) {
      const updated = [...state.prizes]
      updated[index] = prize
      state.prizes = sortPrizesByDrawOrder(updated, state.drawOrder)
    }
  }

  function removePrize(id: string) {
    state.prizes = state.prizes.filter(p => p.id !== id)
  }

  function addWinners(winners: Winner[]) {
    state.winners = [...state.winners, ...winners]
  }

  function removeWinner(id: string) {
    state.winners = state.winners.filter(w => w.id !== id)
  }

  function clearWinners() {
    state.winners = []
  }

  async function clearAll() {
    state.participants = []
    state.prizes = []
    state.winners = []
    state.companyLogo = import.meta.env.BASE_URL + 'logo.svg'
    state.drawOrder = DEFAULT_DRAW_ORDER
    clearBackup()
    localStorage.removeItem(IDB_METADATA_KEY)
    await clearStateData()
  }

  function getAvailableParticipants(): Participant[] {
    const winnerIds = new Set(state.winners.map(w => w.participant.id))
    return state.participants.filter(p => !winnerIds.has(p.id))
  }

  function getRemainingPrizeCount(prizeId: string): number {
    const prize = state.prizes.find(p => p.id === prizeId)
    if (!prize) return 0
    const wonCount = state.winners.filter(w => w.prize.id === prizeId).length
    return Math.max(0, prize.count - wonCount)
  }

  function getNextAvailablePrize(): Prize | null {
    return getOrderedPrizes().find(p => getRemainingPrizeCount(p.id) > 0) || null
  }

  return {
    state,
    hasUnsavedChanges,
    storageReady,
    createBackup,
    getBackup,
    restoreFromBackup,
    clearBackup,
    setEventName,
    setCompanyLogo,
    setDrawOrder,
    getOrderedPrizes,
    setParticipants,
    addParticipants,
    removeParticipant,
    clearParticipants,
    setPrizes,
    addPrize,
    updatePrize,
    removePrize,
    addWinners,
    removeWinner,
    clearWinners,
    clearAll,
    getAvailableParticipants,
    getRemainingPrizeCount,
    getNextAvailablePrize
  }
}
