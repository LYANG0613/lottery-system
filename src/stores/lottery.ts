import { reactive, watch, ref } from 'vue'
import type { Participant, Prize, Winner } from '../types'

const STORAGE_KEY = 'lottery-system-data'
const BACKUP_KEY = 'lottery-system-backup'

export interface LotteryState {
  eventName: string
  companyLogo: string
  participants: Participant[]
  prizes: Prize[]
  winners: Winner[]
}

export interface BackupData {
  state: LotteryState
  timestamp: number
  description: string
}

function loadFromStorage(): LotteryState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (data.winners) {
        data.winners = data.winners.map((w: Winner) => ({
          ...w,
          winTime: new Date(w.winTime)
        }))
      }
      return data
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e)
  }
  return {
    eventName: '',
    companyLogo: import.meta.env.BASE_URL + 'logo.svg',
    participants: [],
    prizes: [],
    winners: []
  }
}

function saveToStorage(state: LotteryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save to storage:', e)
  }
}

// 离开页面警告标记
const hasUnsavedChanges = ref(false)

// 备份相关
function createBackup(description: string = '手动备份'): BackupData | null {
  try {
    const backup: BackupData = {
      state: JSON.parse(JSON.stringify(state)),
      timestamp: Date.now(),
      description
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
    return backup
  } catch (e) {
    console.warn('Failed to create backup:', e)
    return null
  }
}

function getBackup(): BackupData | null {
  try {
    const saved = localStorage.getItem(BACKUP_KEY)
    if (saved) {
      const backup = JSON.parse(saved)
      backup.state.winners = backup.state.winners.map((w: Winner) => ({
        ...w,
        winTime: new Date(w.winTime)
      }))
      return backup
    }
  } catch (e) {
    console.warn('Failed to get backup:', e)
  }
  return null
}

function clearBackup() {
  try {
    localStorage.removeItem(BACKUP_KEY)
  } catch (e) {
    console.warn('Failed to clear backup:', e)
  }
}

function restoreFromBackup(): boolean {
  const backup = getBackup()
  if (backup) {
    Object.assign(state, backup.state)
    hasUnsavedChanges.value = false
    return true
  }
  return false
}

const state = reactive<LotteryState>(loadFromStorage())

// 自动保存（带防抖）
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => state,
  () => {
    hasUnsavedChanges.value = true
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveToStorage(state)
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
    state.prizes = prizes
  }

  function addPrize(prize: Prize) {
    state.prizes = [...state.prizes, prize].sort((a, b) => a.level - b.level)
  }

  function updatePrize(prize: Prize) {
    const index = state.prizes.findIndex(p => p.id === prize.id)
    if (index !== -1) {
      const updated = [...state.prizes]
      updated[index] = prize
      state.prizes = updated.sort((a, b) => a.level - b.level)
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

  function clearAll() {
    state.participants = []
    state.prizes = []
    state.winners = []
    clearBackup()
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
    return state.prizes.find(p => getRemainingPrizeCount(p.id) > 0) || null
  }

  return {
    state,
    hasUnsavedChanges,
    createBackup,
    getBackup,
    restoreFromBackup,
    clearBackup,
    setEventName,
    setCompanyLogo,
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
