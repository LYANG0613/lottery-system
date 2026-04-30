<template>
  <div class="winners-page">
    <!-- 粒子背景 -->
    <div class="particle-bg">
      <span v-for="i in 60" :key="i" class="particle" :style="particleStyle(i)"></span>
    </div>

    <!-- 光效 -->
    <div class="glow-center"></div>

    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">{{ store.state.eventName || '2026开工大促' }}</h1>
          <div class="header-divider">
            <span class="divider-line"></span>
            <span class="divider-star">&#10022;</span>
            <span class="divider-line"></span>
          </div>
          <p class="header-subtitle">
            <el-icon><Trophy /></el-icon>
            中奖名单公示
            <span class="total-badge">共 {{ store.state.winners.length }} 位幸运儿</span>
          </p>
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
          <el-button type="default" link @click="router.push('/')">
            <el-icon><HomeFilled /></el-icon>
            返回入口
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="page-main">
      <div v-if="store.state.winners.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="55" stroke="rgba(255,215,0,0.3)" stroke-width="2" stroke-dasharray="8 4"/>
            <path d="M60 30L68 50L90 52L74 68L78 90L60 79L42 90L46 68L30 52L52 50L60 30Z" fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.5)" stroke-width="2"/>
          </svg>
        </div>
        <h2 class="empty-title">暂无中奖名单</h2>
        <p class="empty-desc">请先完成抽奖环节</p>
        <el-button type="primary" size="large" @click="router.push('/lottery')">
          <el-icon><ArrowLeft /></el-icon>
          进入抽奖
        </el-button>
      </div>

      <div v-else class="winners-grid">
        <div
          v-for="group in groupedWinners"
          :key="group.prize.id"
          class="prize-group"
          :class="`level-${group.prize.level}`"
          :style="getGroupStyle(group.prize.level)"
        >
          <div class="group-header">
            <div class="group-badge">{{ getLevelLabel(group.prize.level) }}</div>
            <div class="group-info">
              <div
                v-if="getPrizeImageList(group.prize).length > 0"
                class="group-image"
                @mouseenter="startAutoPlay(group.prize.id, group.prize)"
                @mouseleave="stopAutoPlay(group.prize.id)"
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
              <div class="group-text">
                <span class="group-name">{{ group.prize.name }}</span>
                <div v-if="group.prize.items && group.prize.items.length > 0" class="group-items">
                  <span v-for="item in group.prize.items" :key="item.id" class="item-tag" :style="getItemTagStyle(group.prize.level)">{{ item.name }}</span>
                </div>
              </div>
              <span class="group-count">{{ group.winners.length }} 名</span>
            </div>
          </div>

          <div class="group-winners">
            <div
              v-for="winner in group.winners"
              :key="winner.id"
              class="winner-card"
            >
              <div class="winner-sn">{{ winner.participant.machineCode }}</div>
              <div class="winner-company">{{ winner.participant.companyName }}</div>
              <div class="winner-region">
                <el-icon><Location /></el-icon>
                {{ winner.participant.region }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, Location, FullScreen, Close, HomeFilled, ArrowLeft } from '@element-plus/icons-vue'
import { useLotteryStore } from '../stores/lottery'
import { getLevelLabel, getLevelColor, updatePageTitle } from '../composables/useConstants'
import type { Winner, Prize } from '../types'

const router = useRouter()
const store = useLotteryStore()

// 页面标题
updatePageTitle(store.state.eventName)
watch(() => store.state.eventName, (name) => {
  updatePageTitle(name)
})

// 全屏状态
const isFullscreen = ref(false)
const soundEnabled = ref(true)

// 多图轮播状态
const prizeImageIndices = ref<Record<string, number>>({})
const autoPlayTimers = ref<Record<string, ReturnType<typeof setInterval>>>({})
const AUTO_PLAY_INTERVAL = 3000

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  Object.keys(autoPlayTimers.value).forEach(id => stopAutoPlay(id))
})

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
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

function startAutoPlay(prizeId: string, prize: Prize | undefined) {
  const list = getPrizeImageList(prize)
  if (list.length <= 1) return
  if (autoPlayTimers.value[prizeId]) clearInterval(autoPlayTimers.value[prizeId])
  autoPlayTimers.value[prizeId] = setInterval(() => {
    const idx = prizeImageIndices.value[prizeId] ?? 0
    prizeImageIndices.value[prizeId] = (idx + 1) % list.length
  }, AUTO_PLAY_INTERVAL)
}

function stopAutoPlay(prizeId: string) {
  if (autoPlayTimers.value[prizeId]) {
    clearInterval(autoPlayTimers.value[prizeId])
    delete autoPlayTimers.value[prizeId]
  }
}

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

// Auto-start carousel for all groups on mount
watch(groupedWinners, (groups) => {
  groups.forEach(group => {
    if (getPrizeImageList(group.prize).length > 1) {
      startAutoPlay(group.prize.id, group.prize)
    }
  })
}, { immediate: true })

function particleStyle(_index: number) {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 20}s`,
    animationDuration: `${15 + Math.random() * 15}s`,
    width: `${2 + Math.random() * 6}px`,
    height: `${2 + Math.random() * 6}px`,
    opacity: 0.1 + Math.random() * 0.4
  }
}

function getGroupStyle(level: number) {
  const c = getLevelColor(level)
  return {
    '--level-gradient': c.gradient,
    '--level-icon': c.iconColor,
  }
}

function getItemTagStyle(level: number) {
  const c = getLevelColor(level)
  return {
    background: `${c.iconColor}20`,
    borderColor: `${c.iconColor}40`,
    color: c.iconColor,
  }
}
</script>

<style scoped lang="scss">
.winners-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
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
  background: var(--accent-color);
  border-radius: 50%;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0.1;
  }
  25% {
    transform: translateY(-150px) translateX(50px);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-100px) translateX(-30px);
    opacity: 0.2;
  }
  75% {
    transform: translateY(-200px) translateX(20px);
    opacity: 0.3;
  }
}

.glow-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

// Header
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
  padding: 24px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  text-align: center;
  flex: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--gold-color) 0%, var(--gold-dark) 50%, var(--gold-color) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: title-shine 3s linear infinite;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

@keyframes title-shine {
  to { background-position: 200% center; }
}

.header-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;

  .divider-line {
    display: block;
    width: 80px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.6), transparent);
  }

  .divider-star {
    color: rgba(255, 215, 0, 0.7);
    font-size: 12px;
  }
}

.header-subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: var(--text-secondary);

  .total-badge {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.1));
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 20px;
    padding: 2px 12px;
    font-size: 13px;
    color: var(--accent-color);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

// Main content
.page-main {
  position: relative;
  z-index: 1;
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 48px;
}

// Empty state
.empty-state {
  text-align: center;
  padding: 100px 20px;

  .empty-icon {
    margin-bottom: 32px;
    animation: pulse-glow 3s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.3)); }
    50% { transform: scale(1.05); filter: drop-shadow(0 0 40px rgba(255, 215, 0, 0.5)); }
  }

  .empty-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .empty-desc {
    font-size: 16px;
    color: var(--text-muted);
    margin-bottom: 32px;
  }
}

// Winners grid
.winners-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.prize-group {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: 28px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--level-icon, rgba(255, 215, 0, 0.3));
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }

  &.level-1 {
    border-color: rgba(255, 215, 0, 0.4);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, var(--card-bg) 100%);

    .group-badge {
      background: linear-gradient(135deg, #FFD700, #FFA500);
      font-size: 18px;
      padding: 8px 24px;
    }

    .group-image {
      border-color: rgba(255, 215, 0, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #FFD700, #FFA500);
    }
  }

  &.level-2 {
    .group-badge {
      background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
    }

    .group-image {
      border-color: rgba(192, 192, 192, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
    }
  }

  &.level-3 {
    .group-badge {
      background: linear-gradient(135deg, #CD7F32, #B8860B);
    }

    .group-image {
      border-color: rgba(205, 127, 50, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #CD7F32, #B8860B);
    }
  }

  &.level-4 {
    .group-badge {
      background: linear-gradient(135deg, #4169E1, #1E40AF);
      color: #fff;
    }

    .group-image {
      border-color: rgba(65, 105, 225, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #4169E1, #1E40AF);
    }
  }

  &.level-5 {
    .group-badge {
      background: linear-gradient(135deg, #6B7280, #4B5563);
      color: #fff;
    }

    .group-image {
      border-color: rgba(107, 114, 128, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #6B7280, #4B5563);
    }
  }

  &.level-6 {
    .group-badge {
      background: linear-gradient(135deg, #10B981, #059669);
      color: #fff;
    }

    .group-image {
      border-color: rgba(16, 185, 129, 0.4);
    }

    .winner-sn {
      background: linear-gradient(135deg, #10B981, #059669);
    }
  }
}

.group-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  .group-badge {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    color: white;
    padding: 6px 20px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 2px;
    flex-shrink: 0;
  }

  .group-image {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: var(--radius-md);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 215, 0, 0.2);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .img-dots {
    position: absolute;
    bottom: 4px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 3px;

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transition: all 0.3s;

      &.active {
        background: var(--gold-color);
        width: 8px;
        border-radius: 2px;
      }
    }
  }

  .group-text {
    flex: 1;
    min-width: 0;
  }

  .group-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
  }

  .group-name {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    display: block;
  }

  .group-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;

    .item-tag {
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 12px;
      border-width: 1px;
      border-style: solid;
    }
  }

  .group-count {
    font-size: 14px;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 12px;
    border-radius: 12px;
    flex-shrink: 0;
  }
}

.group-winners {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.winner-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s ease;
  animation: card-in 0.5s ease-out backwards;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 215, 0, 0.2);
    transform: scale(1.02);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.winner-sn {
  font-size: 28px;
  font-weight: 800;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.winner-company {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.winner-region {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

// Responsive
@media (max-width: 768px) {
  .header-content {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
  }

  .page-main {
    padding: 20px;
  }

  .group-winners {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .winner-sn {
    font-size: 22px;
  }
}
</style>
