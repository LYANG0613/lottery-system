<template>
  <div class="lottery-page">
    <!-- 粒子背景 -->
    <div class="particle-bg">
      <span v-for="i in 50" :key="i" class="particle" :style="particleStyle(i)"></span>
    </div>

    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <!-- Logo区域 - 更醒目 -->
        <div class="logo-section">
          <div class="company-logo">
            <img
              v-if="store.state.companyLogo"
              :src="store.state.companyLogo"
              alt="logo"
              class="logo-img"
            />
            <img
              v-else
              :src="defaultLogo"
              alt="logo"
              class="logo-img"
              @error="handleLogoError"
            />
            <span v-if="!store.state.companyLogo && logoError" class="logo-placeholder">L</span>
          </div>
          <div class="title-area">
            <h1 class="site-title">{{ store.state.eventName || '企业年度盛典' }}</h1>
          </div>
        </div>

        <div class="header-actions">
          <el-button type="primary" link @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏模式'">
            <el-icon v-if="isFullscreen"><Close /></el-icon>
            <el-icon v-else><FullScreen /></el-icon>
          </el-button>
          <el-button type="primary" link @click="toggleSound">
            <el-icon>
              <component :is="soundEnabled ? 'Speaker' : 'Mute'" />
            </el-icon>
          </el-button>
          <el-button type="primary" link @click="goToAdmin">
            <el-icon><Setting /></el-icon>
            管理后台
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="page-main">
      <div class="lottery-container">
        <!-- 左侧：当前奖品 -->
        <div class="prize-panel">
          <div class="panel-card current-prize-card">
            <div class="panel-header">
              <el-icon class="panel-icon"><Trophy /></el-icon>
              <span>当前奖项</span>
            </div>
            <div v-if="currentPrize" class="prize-display">
              <div
                v-if="getPrizeImageList(currentPrize).length > 0"
                class="prize-image"
                @click="nextPrizeImage(currentPrize.id, currentPrize)"
              >
                <img
                  :src="getPrizeImageList(currentPrize)[getPrizeImageIndex(currentPrize.id, currentPrize)]"
                  alt=""
                  @error="e => (e.target as HTMLImageElement).style.display = 'none'"
                />
                <div v-if="getPrizeImageList(currentPrize).length > 1" class="img-dots">
                  <span
                    v-for="(_, i) in getPrizeImageList(currentPrize)"
                    :key="i"
                    class="dot"
                    :class="{ active: i === getPrizeImageIndex(currentPrize.id, currentPrize) }"
                  ></span>
                </div>
              </div>
              <div class="prize-level-badge">{{ getLevelLabel(currentPrize.level) }}</div>
              <div class="prize-name">{{ currentPrize.name }}</div>
              <div class="prize-info">
                <el-tag type="warning" size="large">
                  {{ currentPrize.count }} 名
                </el-tag>
                <span class="remaining">剩余 {{ remainingCount }} 个名额</span>
              </div>
              <div class="prize-progress">
                <div
                  class="progress-bar"
                  :style="{ width: `${(1 - remainingCount / currentPrize.count) * 100}%` }"
                ></div>
              </div>
            </div>
            <div v-else class="no-prize">
              <div class="no-prize-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" stroke="rgba(255,215,0,0.3)" stroke-width="2" stroke-dasharray="6 3"/>
                  <path d="M40 20L45 32L58 33L49 42L51 55L40 49L29 55L31 42L22 33L35 32L40 20Z" fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.4)" stroke-width="2"/>
                </svg>
              </div>
              <p>暂无可抽奖项</p>
              <span class="hint">请到管理后台配置奖品</span>
            </div>
          </div>

          <!-- 奖品列表 -->
          <div class="panel-card prize-list-card">
            <div class="panel-header">
              <el-icon class="panel-icon"><Medal /></el-icon>
              <span>奖项一览</span>
              <el-tag type="info" size="small">{{ store.state.prizes.length }} 个</el-tag>
            </div>
            <div class="prize-list">
              <div
                v-for="prize in store.state.prizes"
                :key="prize.id"
                class="prize-item"
                :class="{
                  'is-active': currentPrize?.id === prize.id,
                  'is-done': getRemainingPrizeCount(prize.id) === 0
                }"
              >
                <div class="item-thumb" @click="nextPrizeImage(prize.id, prize)">
                  <img
                    v-if="getPrizeImageList(prize).length > 0"
                    :src="getPrizeImageList(prize)[getPrizeImageIndex(prize.id, prize)]"
                    alt=""
                    @error="e => (e.target as HTMLImageElement).style.display = 'none'"
                  />
                  <el-icon v-else class="thumb-placeholder"><Present /></el-icon>
                  <div v-if="getPrizeImageList(prize).length > 1" class="thumb-dots">
                    <span
                      v-for="(_, i) in getPrizeImageList(prize)"
                      :key="i"
                      class="dot-sm"
                      :class="{ active: i === getPrizeImageIndex(prize.id, prize) }"
                    ></span>
                  </div>
                </div>
                <div class="item-left">
                  <span class="item-rank">{{ getLevelLabel(prize.level) }}</span>
                  <span class="item-name">{{ prize.name }}</span>
                </div>
                <div class="item-right">
                  <span class="item-count">
                    {{ prize.count - getRemainingPrizeCount(prize.id) }}/{{ prize.count }}
                  </span>
                  <el-icon v-if="getRemainingPrizeCount(prize.id) === 0" class="done-icon"><CircleCheck /></el-icon>
                </div>
              </div>
              <div v-if="store.state.prizes.length === 0" class="empty-list">
                <p>暂无奖品配置</p>
              </div>
            </div>
          </div>

          <!-- 参与台数 -->
          <div class="panel-card stats-card">
            <div class="stat-item">
              <el-icon class="stat-icon"><User /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ store.state.participants.length }}</span>
                <span class="stat-label">参与者</span>
              </div>
            </div>
            <div class="stat-item">
              <el-icon class="stat-icon"><Trophy /></el-icon>
              <div class="stat-info">
                <span class="stat-value">{{ store.state.winners.length }}</span>
                <span class="stat-label">已中奖</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：抽奖区域 -->
        <div class="center-area">
          <LotteryMachine
            :participants="store.state.participants"
            :current-prize="currentPrize"
            :draw-index="currentDrawIndex"
            :is-running="isRunning"
            :display-name="displayName"
            :winner-ids="winnerIds"
            :visible-codes="visibleCodes"
            :is-animating="isAnimating"
            :roll-offset="rollOffset"
            @start="handleStartLottery"
          />
        </div>

        <!-- 右侧：中奖名单 -->
        <div class="winners-panel">
          <div class="panel-card winners-card">
            <div class="panel-header">
              <el-icon class="panel-icon trophy"><Trophy /></el-icon>
              <span>中奖名单</span>
              <el-tag type="success" size="small">
                {{ store.state.winners.length }} 人
              </el-tag>
            </div>
            <div class="winners-content">
              <div v-if="store.state.winners.length === 0" class="empty-winners">
                <div class="empty-icon-wrapper">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-dasharray="6 3"/>
                    <path d="M40 15L46 29L62 31L51 43L54 59L40 51L26 59L29 43L18 31L34 29L40 15Z" fill="rgba(245,166,35,0.15)" stroke="rgba(245,166,35,0.3)" stroke-width="2"/>
                  </svg>
                </div>
                <p>暂无中奖名单</p>
                <span class="hint">准备好你的运气了吗?</span>
              </div>
              <div v-else class="winners-list">
                <div
                  v-for="group in groupedWinners"
                  :key="group.prize.id"
                  class="winner-group"
                >
                  <div class="group-title">
                    <span class="group-level">{{ getLevelLabel(group.prize.level) }}</span>
                    <span class="group-name">{{ group.prize.name }}</span>
                  </div>
                  <div class="group-members">
                    <div
                      v-for="winner in group.winners"
                      :key="winner.id"
                      class="member-card"
                    >
                      <div class="member-sn">
                        <span class="sn-label">机器SN</span>
                        <span class="sn-value">{{ winner.participant.machineCode }}</span>
                      </div>
                      <div class="member-company">{{ winner.participant.companyName }}</div>
                      <div class="member-region">
                        <el-icon><Location /></el-icon>
                        {{ winner.participant.region }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 每轮抽完后全屏展示中奖名单 -->
    <transition name="celebration-fade">
      <div v-if="roundOverlayVisible && !isLastRound" class="round-overlay">
        <div class="celebration-bg"></div>
        <div class="celebration-particles">
          <span v-for="i in 40" :key="i" class="cp" :style="celebrationParticleStyle(i)"></span>
        </div>
        <div class="round-content">
          <div class="round-header">
            <div class="round-trophy">
              <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="rgba(255,215,0,0.4)" stroke-width="2"/>
                <path d="M40 10L46 26L64 29L51 42L54 60L40 51L26 60L29 42L16 29L34 26L40 10Z" fill="rgba(255,215,0,0.3)" stroke="rgba(255,215,0,0.8)" stroke-width="2"/>
              </svg>
            </div>
            <h1 class="round-title">{{ roundWinners[0] ? getLevelLabel(roundWinners[0].prize.level) : '恭喜' }}</h1>
            <p class="round-subtitle">{{ (roundWinners[0]?.prize?.name || '奖品') }} · {{ roundWinners.length }} 位幸运儿</p>
          </div>

          <div class="round-winners-scroll">
            <div class="round-winners-grid">
              <div
                v-for="(winner, idx) in roundWinners"
                :key="winner.id"
                class="round-winner-card"
                :style="{ animationDelay: `${idx * 0.06}s` }"
              >
                <div
                  v-if="getPrizeImageList(roundWinners[0]?.prize).length > 0"
                  class="rwc-thumb"
                  @click="nextPrizeImage(roundWinners[0]?.prize?.id || '', roundWinners[0]?.prize)"
                >
                  <img
                    :src="getPrizeImageList(roundWinners[0]?.prize)[getPrizeImageIndex(roundWinners[0]?.prize?.id || '', roundWinners[0]?.prize)]"
                    alt=""
                    @error="e => (e.target as HTMLImageElement).style.display = 'none'"
                  />
                  <div v-if="getPrizeImageList(roundWinners[0]?.prize).length > 1" class="img-dots">
                    <span
                      v-for="(_, i) in getPrizeImageList(roundWinners[0]?.prize)"
                      :key="i"
                      class="dot"
                      :class="{ active: i === getPrizeImageIndex(roundWinners[0]?.prize?.id || '', roundWinners[0]?.prize) }"
                    ></span>
                  </div>
                </div>
                <div class="rwc-sn">{{ winner.participant.machineCode }}</div>
                <div class="rwc-company">{{ winner.participant.companyName }}</div>
                <div class="rwc-region">
                  <el-icon><Location /></el-icon>
                  {{ winner.participant.region }}
                </div>
              </div>
            </div>
          </div>

          <div class="round-actions">
            <el-button type="primary" size="large" @click="handleContinueToNextRound">
              继续下一轮
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全部抽完全屏展示 -->
    <transition name="celebration-fade">
      <div v-if="showCelebration" class="celebration-overlay">
        <div class="celebration-bg"></div>
        <div class="celebration-particles">
          <span v-for="i in 60" :key="i" class="cp" :style="celebrationParticleStyle(i)"></span>
        </div>
        <div class="celebration-content">
          <div class="celebration-header">
            <div class="celebration-trophy">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="rgba(255,215,0,0.4)" stroke-width="2"/>
                <path d="M40 10L46 26L64 29L51 42L54 60L40 51L26 60L29 42L16 29L34 26L40 10Z" fill="rgba(255,215,0,0.3)" stroke="rgba(255,215,0,0.8)" stroke-width="2"/>
              </svg>
            </div>
            <h1 class="celebration-title">恭喜所有中奖者</h1>
            <p class="celebration-subtitle">全部 {{ store.state.winners.length }} 位幸运儿</p>
          </div>

          <div class="celebration-winners">
            <div
              v-for="group in groupedWinners"
              :key="group.prize.id"
              class="celebration-group"
            >
              <div class="cg-header">
                <span class="cg-level">{{ getLevelLabel(group.prize.level) }}</span>
                <span class="cg-name">{{ group.prize.name }}</span>
              </div>
              <div class="cg-members">
                <div
                  v-for="winner in group.winners"
                  :key="winner.id"
                  class="cg-card"
                >
                  <div
                    v-if="getPrizeImageList(group.prize).length > 0"
                    class="cg-thumb"
                    @click="nextPrizeImage(group.prize.id, group.prize)"
                  >
                    <img
                      :src="getPrizeImageList(group.prize)[getPrizeImageIndex(group.prize.id, group.prize)]"
                      alt=""
                      @error="e => (e.target as HTMLImageElement).style.display = 'none'"
                    />
                    <div v-if="getPrizeImageList(group.prize).length > 1" class="img-dots">
                      <span
                        v-for="(_, i) in getPrizeImageList(group.prize)"
                        :key="i"
                        class="dot"
                        :class="{ active: i === getPrizeImageIndex(group.prize.id, group.prize) }"
                      ></span>
                    </div>
                  </div>
                  <div class="cg-info">
                    <div class="cg-sn">{{ winner.participant.machineCode }}</div>
                    <div class="cg-company">{{ winner.participant.companyName }}</div>
                    <div class="cg-region">{{ winner.participant.region }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="celebration-actions">
            <el-button type="primary" size="large" @click="router.push('/winners')">
              <el-icon><Trophy /></el-icon>
              查看公示大屏
            </el-button>
            <el-button size="large" @click="handleCloseAllOverlays">
              <el-icon><ArrowRight /></el-icon>
              返回抽奖
            </el-button>
            <el-button type="primary" size="large" @click="exportWinners">
              <el-icon><Download /></el-icon>
              导出中奖名单
            </el-button>
            <el-button size="large" @click="router.push('/admin')">
              <el-icon><Setting /></el-icon>
              管理后台
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Trophy, Medal, CircleCheck, User, Location, Present, Download, FullScreen, Close, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LotteryMachine from '../components/LotteryMachine.vue'
import { useLotteryStore } from '../stores/lottery'
import { useLottery } from '../composables/useLottery'
import { exportToExcel } from '../composables/useExcel'
import type { Prize, Winner } from '../types'

const router = useRouter()
const store = useLotteryStore()
const logoError = ref(false)
const defaultLogo = import.meta.env.BASE_URL + 'logo.svg'

// 每轮结束后全屏展示
const roundOverlayVisible = ref(false)
const roundWinners = ref<Winner[]>([])
const isLastRound = ref(false)

// 全屏状态
const isFullscreen = ref(false)

// 多图轮播状态
const prizeImageIndices = ref<Record<string, number>>({})

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function handleContinueToNextRound() {
  roundOverlayVisible.value = false
  roundWinners.value = []
  isLastRound.value = false
}

function handleCloseAllOverlays() {
  roundOverlayVisible.value = false
  showCelebration.value = false
  isLastRound.value = false
  roundWinners.value = []
}

// 全屏状态同步
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

// 抽奖逻辑
const {
  isRunning,
  displayName,
  startLottery,
  isAnimating,
  visibleCodes,
  rollOffset,
  soundEnabled,
  setSoundEnabled,
  setOnWinnerCallback
} = useLottery()

// 实时中奖通知：每个中奖者揭晓时立即更新 store
setOnWinnerCallback((winner: Winner) => {
  store.addWinners([winner])
})

const winnerIds = computed(() => store.state.winners.map(w => w.participant.id))

// 当前奖品
const currentPrize = computed(() => {
  return store.getNextAvailablePrize()
})

const currentDrawIndex = computed(() => {
  if (!currentPrize.value) return 1
  const wonCount = store.state.winners.filter(w => w.prize.id === currentPrize.value!.id).length
  return wonCount + 1
})

const remainingCount = computed(() => {
  if (!currentPrize.value) return 0
  return store.getRemainingPrizeCount(currentPrize.value.id)
})

// 分组中奖名单
interface WinnerGroup {
  prize: Prize
  winners: Winner[]
}

const groupedWinners = computed<WinnerGroup[]>(() => {
  const groups: Record<string, WinnerGroup> = {}
  for (const winner of store.state.winners) {
    const prizeId = winner.prize.id
    if (!groups[prizeId]) {
      groups[prizeId] = { prize: winner.prize, winners: [] }
    }
    groups[prizeId].winners.push(winner)
  }
  return Object.values(groups).sort((a, b) => a.prize.level - b.prize.level)
})

function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '特等奖',
    2: '一等奖',
    3: '二等奖',
    4: '三等奖',
    5: '四等奖',
    6: '参与奖'
  }
  return labels[level] || `等级${level}`
}

function getRemainingPrizeCount(prizeId: string): number {
  return store.getRemainingPrizeCount(prizeId)
}

// 多图轮播工具
function getPrizeImageList(prize: Prize | undefined): string[] {
  if (!prize) return []
  return prize.images?.length ? prize.images : prize.image ? [prize.image] : []
}

function getPrizeImageIndex(prizeId: string, prize: Prize | undefined): number {
  const list = getPrizeImageList(prize)
  const current = prizeImageIndices.value[prizeId] ?? 0
  return list.length > 0 ? current % list.length : 0
}

function nextPrizeImage(prizeId: string, prize: Prize | undefined) {
  const list = getPrizeImageList(prize)
  if (list.length <= 1) return
  const current = prizeImageIndices.value[prizeId] ?? 0
  prizeImageIndices.value[prizeId] = (current + 1) % list.length
}

const isAllComplete = computed(() => {
  if (store.state.prizes.length === 0) return false
  return store.state.prizes.every(p => store.getRemainingPrizeCount(p.id) === 0)
})

const showCelebration = ref(false)

// watch isAllComplete to auto-show celebration
watch(isAllComplete, (val) => {
  if (val && store.state.winners.length > 0) {
    showCelebration.value = true
  }
})

function handleLogoError() {
  logoError.value = true
}

function goToAdmin() {
  router.push('/admin')
}

function handleStartLottery() {
  if (store.state.participants.length === 0) {
    ElMessage.warning('暂无参与人员，请到管理端导入')
    return
  }

  if (!currentPrize.value) {
    ElMessage.warning('暂无可抽奖项，请到管理端配置奖品')
    return
  }

  // 记录本轮奖品信息（闭包中引用，避免抽奖后 currentPrize 切换到下一轮）
  const thisPrize = currentPrize.value
  let capturedWinners: Winner[] = []

  startLottery(
    store.state.participants,
    currentPrize.value,
    remainingCount.value,
    (winners: Winner[]) => {
      // onWinners 在最后一个 notifyWinner 之后才调用，此时 store 已完整
      capturedWinners = winners
    },
    () => {
      // 延迟 300ms 展示，等待最后一个 notifyWinner（200ms 延迟）完成
      setTimeout(() => {
        roundWinners.value = capturedWinners.length > 0 ? capturedWinners : store.state.winners.filter(w => w.prize.id === thisPrize.id)
        const isAllPrizesComplete = store.state.prizes.every(p => store.getRemainingPrizeCount(p.id) === 0)
        isLastRound.value = isAllPrizesComplete
        roundOverlayVisible.value = true
      }, 300)
    }
  )
}

function particleStyle(index: number) {
  const colors = ['#FFD700', '#FFA500', '#1E90FF', '#FF69B4', '#00CED1', '#7CFC00']
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 15}s`,
    animationDuration: `${12 + Math.random() * 15}s`,
    width: `${2 + Math.random() * 5}px`,
    height: `${2 + Math.random() * 5}px`,
    opacity: 0.1 + Math.random() * 0.25,
    background: colors[index % colors.length]
  }
}

function celebrationParticleStyle(index: number) {
  const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#FF6347', '#7CFC00']
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${6 + Math.random() * 8}s`,
    width: `${3 + Math.random() * 8}px`,
    height: `${3 + Math.random() * 8}px`,
    opacity: 0.2 + Math.random() * 0.5,
    background: colors[index % colors.length]
  }
}

function toggleSound() {
  setSoundEnabled(!soundEnabled.value)
}

function exportWinners() {
  if (store.state.winners.length === 0) {
    ElMessage.warning('暂无中奖记录可导出')
    return
  }
  exportToExcel(store.state.winners.map(w => ({
    machineCode: w.participant.machineCode || w.participant.name || '未知',
    companyName: w.participant.companyName,
    region: w.participant.region,
    prizeName: w.prize.name,
    winTime: new Date(w.winTime)
  })), `${store.state.eventName || '抽奖'}-中奖名单.xlsx`)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
.lottery-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.particle-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: float-particle 20s ease-in-out infinite;
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0.1;
  }
  25% {
    transform: translateY(-100px) translateX(50px) scale(1.2);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-60px) translateX(-30px) scale(0.8);
    opacity: 0.2;
  }
  75% {
    transform: translateY(-120px) translateX(20px) scale(1.1);
    opacity: 0.25;
  }
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(15, 15, 35, 0.98) 0%, rgba(15, 15, 35, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 80px;
  display: flex;
  justify-content: center;
  position: relative;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.company-logo {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05));
  border: 2px solid rgba(255, 215, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 30px rgba(255, 215, 0, 0.3);
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }

  .logo-placeholder {
    font-size: 32px;
    font-weight: 700;
    color: #FFD700;
  }
}

.title-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.site-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: title-shine 3s linear infinite;
  letter-spacing: 2px;
}

@keyframes title-shine {
  to { background-position: 200% center; }
}

.header-actions {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-main {
  position: relative;
  z-index: 1;
  padding: 32px;
}

.lottery-container {
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 380px 1fr 380px;
  gap: 28px;
  align-items: start;

  @media (max-width: 1400px) {
    grid-template-columns: 340px 1fr 340px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.prize-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.center-area {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.winners-panel {
  @media (max-width: 1200px) {
    order: 3;
  }
}

.panel-card {
  background: rgba(15, 25, 50, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  padding: 18px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);

  .panel-icon {
    font-size: 18px;
    color: var(--primary-color);

    &.trophy {
      color: #FFD700;
    }
  }
}

.current-prize-card {
  border-color: rgba(255, 215, 0, 0.2);
  background: linear-gradient(135deg, rgba(30, 40, 70, 0.8) 0%, rgba(15, 25, 50, 0.8) 100%);
}

.prize-display {
  text-align: center;

  .prize-image {
    width: 100px;
    height: 100px;
    margin: 0 auto 14px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 215, 0, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .prize-level-badge {
    display: inline-block;
    padding: 4px 18px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 10px;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }

  .prize-name {
    font-size: 26px;
    font-weight: 800;
    color: #FFD700;
    margin-bottom: 12px;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }

  .prize-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 12px;

    .remaining {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .prize-progress {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FFD700, #FFA500);
      border-radius: 2px;
      transition: width 0.5s ease;
    }
  }
}

.no-prize {
  text-align: center;
  padding: 20px 0;

  .no-prize-icon {
    margin-bottom: 16px;
    animation: float 3s ease-in-out infinite;
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }

  .hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.prize-list-card {
  max-height: 380px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.prize-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 280px;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 2px;
  }
}

.prize-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateX(4px);
  }

  &.is-active {
    background: rgba(255, 215, 0, 0.12);
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
  }

  &.is-done {
    opacity: 0.5;

    .item-name {
      text-decoration: line-through;
    }
  }

  .item-thumb {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-placeholder {
      font-size: 16px;
      color: rgba(255, 215, 0, 0.3);
    }
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .item-rank {
      font-size: 10px;
      font-weight: 700;
      color: #FFD700;
      padding: 2px 8px;
      background: rgba(255, 215, 0, 0.15);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 13px;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    .item-count {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }

    .done-icon {
      color: #67c23a;
      font-size: 16px;
    }
  }
}

.empty-list {
  text-align: center;
  padding: 30px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.stats-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;

  .stat-icon {
    font-size: 24px;
    color: #FFD700;
  }

  .stat-info {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #FFD700;
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 4px;
    }
  }
}

.winners-card {
  max-height: calc(100vh - 180px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 2px;
  }
}

.winners-content {
  min-height: 200px;
}

.empty-winners {
  text-align: center;
  padding: 40px 20px;

  .empty-icon-wrapper {
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }

  .hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
  }
}

.winners-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.winner-group {
  .group-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .group-level {
      padding: 4px 14px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .group-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .group-members {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.member-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(26, 92, 170, 0.2), rgba(26, 92, 170, 0.08));
  border: 1px solid rgba(26, 92, 170, 0.3);
  border-radius: 10px;
  transition: all 0.3s ease;
  animation: fadeIn 0.4s ease;

  &:hover {
    transform: translateX(4px);
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .member-sn {
    display: flex;
    align-items: center;
    gap: 8px;

    .sn-label {
      font-size: 10px;
      color: rgba(255, 215, 0, 0.7);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .sn-value {
      font-size: 15px;
      font-weight: 700;
      font-family: 'Consolas', 'Monaco', monospace;
      color: #FFD700;
      letter-spacing: 1px;
    }
  }

  .member-company {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .member-region {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);

    .el-icon {
      font-size: 12px;
      color: rgba(255, 215, 0, 0.7);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 每轮中奖展示
.round-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: hidden;
}

.round-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: center;
  animation: roundSlideIn 0.5s ease;
}

@keyframes roundSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.round-header {
  padding: 28px 20px 16px;
  flex-shrink: 0;

  .round-trophy {
    margin-bottom: 10px;
    animation: float 3s ease-in-out infinite;

    svg {
      width: 96px;
      height: 96px;
    }
  }

  .round-title {
    font-size: 52px;
    font-weight: 800;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  .round-subtitle {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.round-winners-scroll {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 12px 48px 28px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 3px;
  }
}

.round-winners-grid {
  display: inline-grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  justify-content: center;
}

.round-winner-card {
  background: rgba(15, 25, 50, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 32px 24px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(12px);
  animation: roundCardIn 0.4s ease both;

  .rwc-rank {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255, 215, 0, 0.5);
  }

  .rwc-thumb {
    width: 140px;
    height: 140px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(255, 215, 0, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .rwc-sn {
    font-size: 36px;
    font-weight: 700;
    font-family: 'Consolas', 'Monaco', monospace;
    color: #FFD700;
  }

  .rwc-company {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
    line-height: 1.3;
    word-break: break-all;
  }

  .rwc-region {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);

    .el-icon {
      color: rgba(255, 215, 0, 0.5);
    }
  }
  .rwc-company {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
    line-height: 1.3;
    word-break: break-all;
  }

  .rwc-region {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);

    .el-icon {
      color: rgba(255, 215, 0, 0.5);
    }
  }
}

@keyframes roundCardIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.round-actions {
  padding: 16px 20px 24px;
  flex-shrink: 0;

  .el-button {
    padding: 12px 36px;
    font-size: 15px;
    border-radius: 24px;
  }
}

// 全部抽完全屏展示
.celebration-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 20px;
}

.celebration-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center top, rgba(30, 40, 80, 0.97) 0%, rgba(10, 10, 30, 0.99) 100%);
  backdrop-filter: blur(8px);
}

.celebration-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .cp {
    position: absolute;
    border-radius: 50%;
    animation: cp-float 8s ease-in-out infinite;
  }
}

@keyframes cp-float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-60px) rotate(180deg); opacity: 0.8; }
}

.celebration-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  text-align: center;
}

.celebration-header {
  margin-bottom: 40px;

  .celebration-trophy {
    margin-bottom: 20px;
    animation: trophy-glow 2s ease-in-out infinite;
  }

  .celebration-title {
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: title-shine 3s linear infinite;
    margin: 0 0 12px;
  }

  .celebration-subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
}

@keyframes trophy-glow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.9)); }
}

.celebration-winners {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 40px;
}

.celebration-group {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  text-align: left;

  .cg-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .cg-level {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a2e;
      padding: 4px 14px;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      border-radius: 12px;
    }

    .cg-name {
      font-size: 18px;
      font-weight: 700;
      color: #FFD700;
    }
  }

  .cg-members {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}

.cg-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  min-width: 200px;
  flex: 1;

  .cg-thumb {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .cg-info {
    flex: 1;
    min-width: 0;

    .cg-sn {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .cg-company {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cg-region {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.celebration-actions {
  display: flex;
  justify-content: center;
  gap: 16px;

  .el-button {
    padding: 12px 32px;
    font-size: 16px;
  }
}

.celebration-fade-enter-active {
  animation: celebration-in 0.5s ease-out;
}

.celebration-fade-leave-active {
  animation: celebration-out 0.3s ease-in;
}

@keyframes celebration-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes celebration-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
