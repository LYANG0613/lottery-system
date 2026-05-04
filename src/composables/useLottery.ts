import { ref, computed } from 'vue'
import type { Participant, Prize, Winner } from '../types'
import { useAudio } from './useAudio'
import { useLotteryStore } from '../stores/lottery'

export function useLottery() {
  const audio = useAudio()
  const store = useLotteryStore()
  const isRunning = ref(false)
  const currentWinner = ref<Participant | null>(null)
  const displayName = ref<string>('')
  const winnerList = computed(() => store.state.winners)
  const animationDuration = ref(0)
  const currentTargetCode = ref<string>('')
  const visibleCodes = ref<string[]>([])
  const isAnimating = ref(false)

  // 滚动动画相关
  const rollOffset = ref(0)        // 0-1, 驱动 CSS translateY 产生平滑滚动感
  const targetCodeVisible = ref(false)  // 目标SN已进入中心

  let animationFrameId: number | null = null
  let onWinnerCallback: ((winner: Winner) => void) | null = null

  // 每次滚动的间隔(ms)
  const ROLL_STEP_DURATION = 80
  // 每一步滚动多少个SN
  let rollStepCount = 1
  // 当前中心索引
  let currentCenterIdx = 0
  // 当前目标SN的索引
  let targetIdx = 0
  // 当前轮次 (0 ~ count-1)
  let phase = 0
  // 每个 phase 的滚动时长(ms)，至少5s以完整覆盖鼓点滚奏(~4.9s)
  const PHASE_DURATION = 5000
  /** notifyWinner 相对 phase 结束的延迟，须先于 finishLottery 执行以写入 store */
  const NOTIFY_DELAY_MS = 200
  /** phase 结束到下一轮 phase 开始的总间隔（与原先 setTimeout(startPhase, 2000) 一致） */
  const INTER_PHASE_GAP_MS = 2000
  const NEXT_PHASE_AFTER_NOTIFY_MS = INTER_PHASE_GAP_MS - NOTIFY_DELAY_MS
  // 每个 roll step 的开始时间
  let stepStartTime = 0
  let runId = 0
  const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

  function scheduleTimer(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer)
      callback()
    }, delay)
    pendingTimers.add(timer)
    return timer
  }

  function clearPendingTimers() {
    pendingTimers.forEach(timer => clearTimeout(timer))
    pendingTimers.clear()
  }

  const remainingParticipants = computed(() => {
    const winnerIds = new Set(store.state.winners.map(w => w.participant.id))
    return (participants: Participant[]) =>
      participants.filter(p => !winnerIds.has(p.id))
  })

  function getDisplayText(participant: Participant): string {
    return participant.machineCode || participant.name
  }

  function startLottery(
    participants: Participant[],
    prize: Prize,
    count: number,
    onWinners: (winners: Winner[]) => void,
    onComplete: () => void
  ) {
    if (isRunning.value) return
    const activeRunId = ++runId
    clearPendingTimers()

    const available = remainingParticipants.value(participants)
    if (available.length < count) {
      console.warn(`可用人数不足，需要 ${count} 人，当前 ${available.length} 人`)
      return
    }

    isRunning.value = true
    isAnimating.value = true
    const winners: Winner[] = []

    // Fisher-Yates 洗牌，从全部可用参与者中均匀抽取
    const pool = [...available]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const selected = pool.slice(0, count)
    for (let i = 0; i < selected.length; i++) {
      winners.push({
        id: Date.now().toString(36) + i,
        participant: selected[i],
        prize,
        winTime: new Date()
      })
    }

    phase = 0
    // 从洗牌后的池中随机选一个作为起始位置，避免偏向列表某端
    currentCenterIdx = Math.floor(Math.random() * pool.length)
    targetIdx = 0
    rollOffset.value = 0
    targetCodeVisible.value = false

    // 目标索引列表
    const targetIndices: number[] = winners.map(w => {
      const idx = participants.findIndex(p => p.id === w.participant.id)
      return idx !== -1 ? idx : 0
    })

    function updateVisibleCodes(centerIdx: number) {
      const codes: string[] = []
      const len = participants.length
      for (let i = -3; i <= 3; i++) {
        const idx = (centerIdx + i + len) % len
        codes.push(getDisplayText(participants[idx]))
      }
      visibleCodes.value = codes
    }

    function notifyWinner(winner: Winner) {
      if (onWinnerCallback) {
        onWinnerCallback(winner)
      }
    }

    function startPhase() {
      if (activeRunId !== runId) return
      rollOffset.value = 0
      targetCodeVisible.value = false
      audio.startRollingSound()

      const currentTarget = winners[phase]
      currentTargetCode.value = getDisplayText(currentTarget.participant)
      targetIdx = targetIndices[phase]

      const phaseDuration = PHASE_DURATION
      const phaseStartTime = performance.now()
      stepStartTime = performance.now()

      function doRollStep() {
        if (activeRunId !== runId) return

        const phaseElapsed = performance.now() - phaseStartTime
        const phaseProgress = Math.min(phaseElapsed / phaseDuration, 1)
        const easeProgress = 1 - Math.pow(0.5, phaseProgress * 10)
        // 速度由快变慢：rollStepCount 从 4 降到 1
        rollStepCount = Math.max(1, Math.round(4 - easeProgress * 3))

        const now = performance.now()
        const elapsed = now - stepStartTime

        if (elapsed >= ROLL_STEP_DURATION) {
          // 时间到了，更新位置并重置偏移
          currentCenterIdx = (currentCenterIdx + rollStepCount) % participants.length
          updateVisibleCodes(currentCenterIdx)
          displayName.value = getDisplayText(participants[currentCenterIdx])
          audio.playRollTick()
          rollOffset.value = 0
          stepStartTime = now

          // 检查目标是否进入中心
          if (!targetCodeVisible.value && currentCenterIdx === targetIdx) {
            targetCodeVisible.value = true
          }

          // 检查本轮是否结束
          if (phaseProgress >= 1) {
            currentCenterIdx = targetIdx
            updateVisibleCodes(currentCenterIdx)
            displayName.value = getDisplayText(participants[targetIdx])
            currentWinner.value = currentTarget.participant

            cancelAnimationFrame(animationFrameId!)
            animationFrameId = null

            scheduleTimer(() => {
              if (activeRunId !== runId) return
              audio.playWinFanfare()
              notifyWinner(currentTarget)
              phase++
              if (phase < count) {
                scheduleTimer(() => {
                  if (activeRunId !== runId) return
                  startPhase()
                }, NEXT_PHASE_AFTER_NOTIFY_MS)
              } else {
                finishLottery(participants, winners, onWinners, onComplete)
              }
            }, NOTIFY_DELAY_MS)

            return
          }
        } else {
          // 平滑过渡：在两个位置之间插值，产生向上滚动的感觉
          // rollOffset 0→1 表示从当前位置过渡到下一个位置
          rollOffset.value = elapsed / ROLL_STEP_DURATION
        }

        animationFrameId = window.requestAnimationFrame(doRollStep)
      }

      animationFrameId = window.requestAnimationFrame(doRollStep)
    }

    updateVisibleCodes(currentCenterIdx)
    startPhase()
  }

  function finishLottery(
    _participants: Participant[],
    winners: Winner[],
    onWinners: (winners: Winner[]) => void,
    onComplete: () => void
  ) {
    if (!isRunning.value) return
    clearPendingTimers()
    audio.stopRollingSound()
    onWinners(winners)
    currentTargetCode.value = ''
    visibleCodes.value = []
    isRunning.value = false
    isAnimating.value = false
    rollOffset.value = 0
    targetCodeVisible.value = false
    onComplete()
  }

  function setOnWinnerCallback(callback: (winner: Winner) => void) {
    onWinnerCallback = callback
  }

  function stopLottery() {
    runId++
    clearPendingTimers()
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    audio.stopRollingSound()
    isRunning.value = false
    isAnimating.value = false
    rollOffset.value = 0
    targetCodeVisible.value = false
  }

  function reset() {
    stopLottery()
    currentWinner.value = null
    displayName.value = ''
    currentTargetCode.value = ''
    visibleCodes.value = []
  }

  function removeWinner(winnerId: string) {
    store.removeWinner(winnerId)
  }

  function clearAllWinners() {
    store.clearWinners()
  }

  return {
    isRunning,
    currentWinner,
    displayName,
    winnerList,
    animationDuration,
    currentTargetCode,
    visibleCodes,
    isAnimating,
    rollOffset,
    startLottery,
    stopLottery,
    reset,
    removeWinner,
    clearAllWinners,
    setOnWinnerCallback,
    soundEnabled: audio.soundEnabled,
    setSoundEnabled: audio.setSoundEnabled
  }
}
