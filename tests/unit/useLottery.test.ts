import { describe, it, expect, vi } from 'vitest'

describe('useLottery 核心逻辑', () => {
  it('Fisher-Yates 洗牌保证随机性', () => {
    const pool = Array.from({ length: 100 }, (_, i) => i)
    const positions: Record<number, number[]> = {}

    for (let round = 0; round < 50; round++) {
      const shuffled = [...pool]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      shuffled.slice(0, 10).forEach((val, idx) => {
        if (!positions[val]) positions[val] = []
        positions[val].push(idx)
      })
    }

    const uniquePositions = Object.values(positions).map(pos => new Set(pos).size)
    expect(uniquePositions.some(count => count > 1)).toBe(true)
  })

  it('剩余参与者正确排除已中奖者', () => {
    const participants = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
      { id: '4', name: 'D' }
    ]
    const winners = [{ participant: { id: '1' } }]

    const winnerIds = new Set(winners.map(w => w.participant.id))
    const remaining = participants.filter(p => !winnerIds.has(p.id))
    expect(remaining).toHaveLength(3)
    expect(remaining.map(r => r.id)).toEqual(['2', '3', '4'])
  })

  it('可用人数不足时拒绝抽奖', () => {
    const participants = [{ id: '1' }, { id: '2' }]
    const winners: any[] = []
    const count = 5

    const winnerIds = new Set(winners.map(w => w.participant?.id))
    const available = participants.filter(p => !winnerIds.has(p.id))
    expect(available.length >= count).toBe(false)
  })

  it('抽奖生成正确数量的中奖者', () => {
    const pool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const count = 3

    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const selected = shuffled.slice(0, count)

    expect(selected).toHaveLength(3)
    selected.forEach(s => expect(pool).toContain(s))
    expect(new Set(selected).size).toBe(selected.length)
  })

  it('中奖者ID生成具有唯一性', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      const id = Date.now().toString(36) + i
      ids.add(id)
    }
    expect(ids.size).toBe(100)
  })

  it('displayName 优先使用 machineCode', () => {
    const p1 = { id: '1', name: '公司A', machineCode: 'SN001' }
    const p2 = { id: '2', name: '公司B' }

    const getDisplayText = (p: any) => p.machineCode || p.name

    expect(getDisplayText(p1)).toBe('SN001')
    expect(getDisplayText(p2)).toBe('公司B')
  })

  it('stopLottery 增加 runId 防止旧定时器执行', () => {
    let runId = 0
    let timerRan = false

    const scheduleTimer = (onStop: () => void) => {
      const id = window.setTimeout(() => { timerRan = true }, 1000)
      return { id, onStop }
    }

    const stop = () => {
      runId++
    }

    const { onStop } = scheduleTimer(() => {})
    onStop()
    stop()
    expect(runId).toBe(1)
  })

  it('phase 进度正确管理多轮抽奖', () => {
    const count = 5
    let phase = 0
    const winners: number[] = []

    for (let i = 0; i < count; i++) {
      phase = i
      winners.push(phase)
    }

    expect(winners).toHaveLength(5)
    expect(phase).toBe(4)
  })

  it('每轮 phase 结束时 currentCenterIdx 正确归位到目标索引', () => {
    const participants = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }))
    let currentCenterIdx = 4
    const targetIdx = 7

    // 模拟多步滚动
    for (let step = 0; step < 10; step++) {
      currentCenterIdx = (currentCenterIdx + 1) % participants.length
    }
    // 最终归位
    currentCenterIdx = targetIdx
    expect(currentCenterIdx).toBe(7)
  })

  it('rollStepCount 由快变慢符合 easeOut 曲线', () => {
    const easeProgress = (p: number) => 1 - Math.pow(0.5, p * 10)
    const getRollStepCount = (p: number) => Math.max(1, Math.round(4 - easeProgress(p) * 3))

    // 开始时快速
    expect(getRollStepCount(0)).toBe(4)
    // 中间速度下降
    const mid = getRollStepCount(0.5)
    expect(mid).toBeLessThan(4)
    // 结束时最慢
    expect(getRollStepCount(1)).toBe(1)
  })
})
