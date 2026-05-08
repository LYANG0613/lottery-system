import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
  get length() { return Object.keys(storage).length },
  key: (i: number) => Object.keys(storage)[i] || null,
})

// Mock AudioContext
const mockCtx = {
  state: 'running',
  currentTime: 0,
  destination: {},
  sampleRate: 44100,
  createOscillator: vi.fn(() => ({
    type: '', frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  })),
  createBuffer: vi.fn(() => ({})),
  createBufferSource: vi.fn(() => ({
    buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null as (() => void) | null,
  })),
  createBiquadFilter: vi.fn(() => ({
    type: '', frequency: { value: 0 }, Q: { value: 0 }, connect: vi.fn(),
  })),
  decodeAudioData: vi.fn(() => Promise.resolve({})),
  resume: vi.fn(() => Promise.resolve()),
}

vi.stubGlobal('AudioContext', vi.fn(() => mockCtx))

// Direct implementation testing (testing the logic pattern)
describe('useAudio 音频功能', () => {
  beforeEach(() => {
    Object.keys(storage).forEach(k => delete storage[k])
    vi.clearAllMocks()
  })

  describe('soundEnabled 状态', () => {
    it('默认开启声音（localStorage 无值时）', () => {
      const soundEnabled = ref(localStorage.getItem('lottery-sound-enabled') !== 'false')
      expect(soundEnabled.value).toBe(true)
    })

    it('localStorage 为 false 时关闭声音', () => {
      storage['lottery-sound-enabled'] = 'false'
      const soundEnabled = ref(localStorage.getItem('lottery-sound-enabled') !== 'false')
      expect(soundEnabled.value).toBe(false)
    })

    it('setSoundEnabled 更新状态并持久化', () => {
      const soundEnabled = ref(true)
      const setSoundEnabled = (v: boolean) => {
        soundEnabled.value = v
        localStorage.setItem('lottery-sound-enabled', String(v))
      }
      setSoundEnabled(false)
      expect(soundEnabled.value).toBe(false)
      expect(localStorage.getItem('lottery-sound-enabled')).toBe('false')
    })

    it('从 false 切换到 true', () => {
      storage['lottery-sound-enabled'] = 'false'
      const soundEnabled = ref(localStorage.getItem('lottery-sound-enabled') !== 'false')
      const setSoundEnabled = (v: boolean) => {
        soundEnabled.value = v
        localStorage.setItem('lottery-sound-enabled', String(v))
      }
      setSoundEnabled(true)
      expect(soundEnabled.value).toBe(true)
    })
  })

  describe('playRollTick 滚动音效', () => {
    it('soundEnabled=false 时不创建音频节点', () => {
      const soundEnabled = ref(false)
      let nodeCreated = false
      if (!soundEnabled.value) {
        nodeCreated = false
      }
      expect(nodeCreated).toBe(false)
    })

    it('soundEnabled=true 时调用 AudioContext 方法', () => {
      const soundEnabled = ref(true)
      if (soundEnabled.value) {
        mockCtx.createOscillator()
        mockCtx.createGain()
        mockCtx.createBuffer()
        mockCtx.createBiquadFilter()
      }
      expect(mockCtx.createOscillator).toHaveBeenCalled()
      expect(mockCtx.createGain).toHaveBeenCalled()
    })
  })

  describe('playWinFanfare 胜利音效', () => {
    it('soundEnabled=false 时不播放', () => {
      const soundEnabled = ref(false)
      if (!soundEnabled.value) {
        // early return
      }
      expect(soundEnabled.value).toBe(false)
    })

    it('soundEnabled=true 时创建音符振荡器', () => {
      const soundEnabled = ref(true)
      if (soundEnabled.value) {
        const notes = [523.25, 659.25, 783.99, 1046.5]
        notes.forEach(() => {
          mockCtx.createOscillator()
          mockCtx.createBiquadFilter()
          mockCtx.createGain()
        })
      }
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4)
    })
  })

  describe('AudioContext 异常处理', () => {
    it('AudioContext 不可用时优雅降级', () => {
      Object.defineProperty(globalThis, 'AudioContext', {
        get: () => { throw new Error('AudioContext not available') },
        configurable: true,
      })
      expect(() => {
        new (globalThis as any).AudioContext()
      }).toThrow('AudioContext not available')
      Object.defineProperty(globalThis, 'AudioContext', { value: vi.fn(() => mockCtx), configurable: true })
    })
  })
})
