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
  const winnerList = ref<Winner[]>([...store.state.winners])
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
  // 每个 roll step 的开始时间
  let stepStartTime = 0

  const remainingParticipants = computed(() => {
    const winnerIds = new Set(winnerList.value.map(w => w.participant.id))
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

    const available = remainingParticipants.value(participants)
    if (available.length < count) {
      console.warn(`可用人数不足，需要 ${count} 人，当前 ${available.length} 人`)
      return
    }

    isRunning.value = true
    isAnimating.value = true
    const winners: Winner[] = []

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * available.length)
      const winner = available.splice(idx, 1)[0]
      winners.push({
        id: Date.now().toString(36) + i,
        participant: winner,
        prize,
        winTime: new Date()
      })
    }

    phase = 0
    currentCenterIdx = Math.floor(Math.random() * participants.length)
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

            setTimeout(() => {
              audio.playWinFanfare()
              notifyWinner(currentTarget)
            }, 200)

            phase++

            if (phase < count) {
              setTimeout(startPhase, 2000)
            } else {
              finishLottery(participants, winners, onWinners, onComplete)
            }
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
    audio.stopRollingSound()
    winnerList.value.push(...winners)
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
    winnerList.value = winnerList.value.filter(w => w.id !== winnerId)
    store.removeWinner(winnerId)
  }

  function clearAllWinners() {
    winnerList.value = []
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
