<template>
  <div class="lottery-machine">
    <!-- 背景光效 -->
    <div class="bg-effects">
      <div class="bg-gradient"></div>
      <div class="light-beam beam-1"></div>
      <div class="light-beam beam-2"></div>
      <div class="light-beam beam-3"></div>
    </div>

    <div class="machine-container">
      <!-- 外圈光环 -->
      <div class="outer-ring">
        <div class="ring-dot" v-for="i in 12" :key="i" :style="ringDotStyle(i)"></div>
      </div>

      <!-- 装饰光环 -->
      <div class="glow-ring glow-ring-1"></div>
      <div class="glow-ring glow-ring-2"></div>
      <div class="glow-ring glow-ring-3"></div>
      <div class="glow-ring glow-ring-4"></div>

      <!-- 中心显示区域 -->
      <div class="display-container">
        <!-- 奖项标签 -->
        <div class="prize-badge" :class="{ 'prize-active': currentPrize }" v-if="currentPrize">
          <div
            v-if="getPrizeImageList(currentPrize).length > 0"
            class="badge-image"
            @mouseenter="startAutoPlay"
            @mouseleave="stopAutoPlay"
          >
            <img
              :src="getPrizeImageList(currentPrize)[currentImageIndex]"
              alt=""
              @error="e => (e.target as HTMLImageElement).style.display = 'none'"
            />
            <div v-if="getPrizeImageList(currentPrize).length > 1" class="img-dots">
              <span
                v-for="(_, i) in getPrizeImageList(currentPrize)"
                :key="i"
                class="dot"
                :class="{ active: i === currentImageIndex }"
              ></span>
            </div>
          </div>
          <div class="badge-text">
            <span class="prize-label">当前奖项</span>
            <span class="prize-name">{{ currentPrize.name }}</span>
            <div v-if="currentPrize.items && currentPrize.items.length > 0" class="prize-items">
              <span v-for="item in currentPrize.items" :key="item.id" class="item-tag">{{ item.name }}</span>
            </div>
            <span class="prize-count">第 {{ drawIndex }} 轮 · 共 {{ currentPrize.count }} 名</span>
          </div>
        </div>

        <!-- 滚动区域 -->
        <div
          class="rolling-container"
          :class="{
            'is-running': isRunning,
            'is-winning': showWinner
          }"
        >
          <!-- 边框光效 -->
          <div class="border-glow"></div>

          <!-- 装饰角标 -->
          <div class="corner-decor top-left"></div>
          <div class="corner-decor top-right"></div>
          <div class="corner-decor bottom-left"></div>
          <div class="corner-decor bottom-right"></div>

          <!-- 渐变遮罩 -->
          <div class="gradient-mask top-mask"></div>
          <div class="gradient-mask bottom-mask"></div>

          <!-- 滚动视口 -->
          <div class="rolling-viewport">
            <div
              class="rolling-track"
              :style="{
                transform: `translateY(${(-props.rollOffset * 52)}px)`,
              }"
            >
              <div
                v-for="(item, _idx) in rollingItems"
                :key="item.key"
                class="code-row"
                :class="{
                  'is-center': item.isCenter,
                  'is-top': item.position < 0,
                  'is-bottom': item.position > 0
                }"
                :style="getRowStyle(item.position)"
              >
                {{ item.code }}
              </div>
            </div>
          </div>

          <!-- 中心高亮线 -->
          <div class="center-highlight"></div>

          <!-- 中奖特效 -->
          <transition name="winner-effect">
            <div v-if="showWinner" class="winner-overlay">
              <div class="winner-glow"></div>
              <div class="star-burst">
                <span v-for="i in 8" :key="i" class="star" :style="starStyle(i)"></span>
              </div>
              <div class="confetti-container">
                <span v-for="i in 30" :key="i" class="confetti" :style="confettiStyle(i)"></span>
              </div>
            </div>
          </transition>
        </div>

        <!-- 状态指示 -->
        <div class="status-bar" v-if="!currentPrize">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>请先在管理后台配置奖品</span>
        </div>

      </div>

      <!-- 装饰粒子 -->
      <div class="particles">
        <span v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></span>
      </div>

      <!-- 火花效果 -->
      <div class="sparks" v-if="isRunning">
        <span v-for="i in 8" :key="i" class="spark" :style="sparkStyle(i)"></span>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <div class="btn-glow" v-if="canStart && !isRunning"></div>
      <el-button
        type="primary"
        size="large"
        :disabled="!canStart || isRunning"
        class="start-btn"
        @click="handleStart"
      >
        <span v-if="isRunning" class="btn-content">
          <el-icon class="loading-icon"><Loading /></el-icon>
          抽奖中...
        </span>
        <span v-else class="btn-content">
          <el-icon><Star /></el-icon>
          {{ canStart ? '开始抽奖' : '等待配置' }}
        </span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Star, Loading } from '@element-plus/icons-vue'
import type { Participant, Prize } from '../types'

interface RollingItem {
  code: string
  isCenter: boolean
  position: number
  key: string
}

interface Props {
  participants: Participant[]
  currentPrize: Prize | null
  drawIndex: number
  isRunning: boolean
  displayName: string
  winnerIds: string[]
  visibleCodes?: string[]
  isAnimating?: boolean
  rollOffset?: number
}

interface Emits {
  (e: 'start'): void
}

const props = withDefaults(defineProps<Props>(), {
  visibleCodes: () => [],
  isAnimating: false,
  rollOffset: 0
})
const emit = defineEmits<Emits>()

const showWinner = ref(false)

// 多图轮播
const currentImageIndex = ref(0)
const AUTO_PLAY_INTERVAL = 3000
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

function getPrizeImageList(prize: Prize | null): string[] {
  if (!prize) return []
  return prize.images?.length ? prize.images : prize.image ? [prize.image] : []
}

function startAutoPlay() {
  const list = getPrizeImageList(props.currentPrize)
  if (list.length <= 1) return
  if (autoPlayTimer) clearInterval(autoPlayTimer)
  autoPlayTimer = setInterval(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % list.length
  }, AUTO_PLAY_INTERVAL)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

onUnmounted(() => {
  if (autoPlayTimer) clearInterval(autoPlayTimer)
})

// 计算每个位置的字体大小和透明度（根据距离中心的距离）
function getItemStyle(position: number): Record<string, string> {
  const absPos = Math.abs(position)
  // position: -3 到 3，中心为0
  
  if (absPos === 0) {
    // 中心位置
    return {
      fontSize: '48px',
      opacity: '1',
      transform: 'scale(1)',
      color: 'var(--gold-color)',
      filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8))'
    }
  }
  
  // 根据距离计算大小（从两边向中心变大）
  const scale = 1 - absPos * 0.15
  const opacity = 1 - absPos * 0.2
  const fontSize = `${Math.max(14, 32 - absPos * 6)}px`
  
  return {
    fontSize,
    opacity: String(opacity),
    transform: `scale(${scale})`,
    color: 'rgba(255, 215, 0, 0.4)',
    filter: 'none'
  }
}

// 计算每行的样式
function getRowStyle(position: number): Record<string, string> {
  return getItemStyle(position)
}

const availableCount = computed(() => {
  return props.participants.filter(p => !props.winnerIds.includes(p.id)).length
})

const canStart = computed(() => {
  return (
    props.currentPrize !== null &&
    props.currentPrize.count > 0 &&
    availableCount.value > 0
  )
})

// 生成滚动项：上3个、中心、下3个
const rollingItems = computed<RollingItem[]>(() => {
  if (props.visibleCodes.length === 0) {
    return [
      { code: '', isCenter: false, position: -3, key: 'empty-top-1' },
      { code: '', isCenter: false, position: -2, key: 'empty-top-2' },
      { code: '', isCenter: false, position: -1, key: 'empty-top-3' },
      { code: props.displayName || '', isCenter: true, position: 0, key: 'center' },
      { code: '', isCenter: false, position: 1, key: 'empty-bottom-1' },
      { code: '', isCenter: false, position: 2, key: 'empty-bottom-2' },
      { code: '', isCenter: false, position: 3, key: 'empty-bottom-3' }
    ]
  }

  const codes = props.visibleCodes
  return [
    { code: codes[0] || '', isCenter: false, position: -3, key: `top-${codes[0]}-1` },
    { code: codes[1] || '', isCenter: false, position: -2, key: `top-${codes[1]}-2` },
    { code: codes[2] || '', isCenter: false, position: -1, key: `top-${codes[2]}-3` },
    { code: codes[3] || '', isCenter: true, position: 0, key: `center-${codes[3]}` },
    { code: codes[4] || '', isCenter: false, position: 1, key: `bottom-${codes[4]}-1` },
    { code: codes[5] || '', isCenter: false, position: 2, key: `bottom-${codes[5]}-2` },
    { code: codes[6] || '', isCenter: false, position: 3, key: `bottom-${codes[6]}-3` }
  ]
})

watch(() => props.currentPrize, (prize) => {
  if (prize) {
    currentImageIndex.value = 0
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
})

watch(() => props.displayName, (newName) => {
  if (newName && !props.isRunning) {
    showWinner.value = true
    setTimeout(() => {
      showWinner.value = false
    }, 3000)
  }
})

watch(() => props.isRunning, (running) => {
  if (running) {
    showWinner.value = false
  }
})

function handleStart() {
  if (!canStart.value) return
  emit('start')
}

function confettiStyle(index: number) {
  const colors = [
    'var(--gold-color)', 'var(--gold-dark)', '#FF6347', '#FF69B4',
    '#1E90FF', '#00CED1', '#7CFC00', '#9370DB',
    'var(--gold-color)', '#FF4500', '#00FF7F', '#4169E1'
  ]
  const shapes = ['50%', '0', '30%']
  return {
    '--delay': `${index * 0.05}s`,
    '--x': `${(Math.random() - 0.5) * 400}px`,
    '--y': `${-100 - Math.random() * 200}px`,
    '--rotation': `${Math.random() * 1080}deg`,
    '--color': colors[index % colors.length],
    '--shape': shapes[index % shapes.length],
    '--size': `${6 + Math.random() * 8}px`
  }
}

function particleStyle(index: number) {
  const colors = ['var(--gold-color)', 'var(--gold-dark)', '#1E90FF', '#FF69B4', '#00CED1']
  const angle = (index / 20) * 360 + Math.random() * 20
  const radius = 160 + Math.random() * 80
  const duration = 6 + Math.random() * 6
  return {
    '--angle': `${angle}deg`,
    '--radius': `${radius}px`,
    '--delay': `${index * 0.3}s`,
    '--duration': `${duration}s`,
    '--color': colors[index % colors.length],
    '--size': `${3 + Math.random() * 4}px`,
    '--opacity': 0.4 + Math.random() * 0.4
  }
}

function ringDotStyle(index: number) {
  const angle = (index / 12) * 360
  return {
    '--angle': `${angle}deg`,
    '--delay': `${index * 0.1}s`
  }
}

function starStyle(index: number) {
  const angle = (index / 8) * 360
  return {
    '--angle': `${angle}deg`
  }
}

function sparkStyle(index: number) {
  const angle = (index / 8) * 360
  return {
    '--angle': `${angle}deg`,
    '--delay': `${index * 0.1}s`
  }
}
</script>

<style scoped lang="scss">
.lottery-machine {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  overflow: hidden;
}

.bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    ellipse at center,
    rgba(26, 92, 170, 0.15) 0%,
    rgba(245, 166, 35, 0.05) 30%,
    transparent 70%
  );
  animation: bg-rotate 20s linear infinite;
}

.light-beam {
  position: absolute;
  width: 2px;
  height: 200%;
  background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.3), transparent);
  animation: beam-move 3s ease-in-out infinite;

  &.beam-1 { left: 20%; animation-delay: 0s; }
  &.beam-2 { left: 50%; animation-delay: 1s; }
  &.beam-3 { left: 80%; animation-delay: 2s; }
}

@keyframes bg-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes beam-move {
  0%, 100% { opacity: 0.3; transform: translateY(-10%); }
  50% { opacity: 0.6; transform: translateY(10%); }
}

.machine-container {
  position: relative;
  width: 540px;
  height: 560px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: min(500px, 100%);
    height: min(500px, 100%);
  }
}

.outer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: ring-rotate 30s linear infinite;
}

.ring-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: 50%;
  transform-origin: 1px 0;
  transform: rotate(var(--angle)) translateX(270px);
  box-shadow: 0 0 10px var(--accent-color);
  animation: dot-pulse 2s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 0.4; transform: rotate(var(--angle)) translateX(270px) scale(1); }
  50% { opacity: 1; transform: rotate(var(--angle)) translateX(270px) scale(1.3); }
}

.glow-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  animation: pulse-ring 2.5s ease-in-out infinite;

  &.glow-ring-1 { width: 100%; height: 100%; border-color: rgba(26, 92, 170, 0.2); animation-delay: 0s; }
  &.glow-ring-2 { width: 88%; height: 88%; border-color: rgba(245, 166, 35, 0.25); animation-delay: 0.3s; }
  &.glow-ring-3 { width: 76%; height: 76%; border-color: rgba(26, 92, 170, 0.3); animation-delay: 0.6s; }
  &.glow-ring-4 { width: 64%; height: 64%; border-color: rgba(255, 215, 0, 0.35); animation-delay: 0.9s; }
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.03); opacity: 1; }
}

.display-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.prize-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 16px;
  animation: badge-glow 2s ease-in-out infinite;

  &.prize-active {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 165, 0, 0.15));
    border-color: rgba(255, 215, 0, 0.6);
  }

  .badge-image {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 215, 0, 0.3);
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
        background: rgba(255, 255, 255, 0.5);
        transition: all 0.3s;

        &.active {
          background: var(--gold-color);
          width: 8px;
          border-radius: 2px;
        }
      }
    }
  }

  .badge-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .prize-label {
    font-size: 12px;
    color: rgba(255, 215, 0, 0.8);
    text-transform: uppercase;
    letter-spacing: 3px;
  }
  .prize-name {
    font-size: 28px;
    font-weight: 700;
    color: var(--gold-color);
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
  }

  .prize-items {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin: 2px 0;

    .item-tag {
      padding: 2px 10px;
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 10px;
      font-size: 12px;
      color: rgba(255, 215, 0, 0.9);
    }
  }

  .prize-count {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
}

@keyframes badge-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.4); }
}

.rolling-container {
  position: relative;
  width: 520px;
  height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(26, 92, 170, 0.3) 0%, rgba(15, 60, 120, 0.5) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: min(480px, 100%);
    height: 260px;
  }

  &.is-running {
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.2);
  }

  &.is-winning {
    border-color: var(--gold-color);
    box-shadow: 0 0 80px rgba(255, 215, 0, 0.5), 0 0 120px rgba(255, 165, 0, 0.3);
    animation: win-pulse 0.6s ease-out;
  }
}

@keyframes win-pulse {
  0% { transform: scale(1); }
  30% { transform: scale(1.05); }
  60% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.border-glow {
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.5) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: border-flow 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}

.rolling-container.is-winning .border-glow {
  opacity: 1;
}

@keyframes border-flow {
  0% { background-position: 200% 200%; }
  100% { background-position: 0% 0%; }
}

.corner-decor {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  pointer-events: none;
  z-index: 10;

  &.top-left { top: 8px; left: 8px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
  &.top-right { top: 8px; right: 8px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
  &.bottom-left { bottom: 8px; left: 8px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
  &.bottom-right { bottom: 8px; right: 8px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }
}

.gradient-mask {
  position: absolute;
  left: 0;
  right: 0;
  height: 80px;
  pointer-events: none;
  z-index: 5;

  &.top-mask {
    top: 0;
    background: linear-gradient(to bottom, rgba(15, 60, 120, 0.95), transparent);
  }

  &.bottom-mask {
    bottom: 0;
    background: linear-gradient(to top, rgba(15, 60, 120, 0.95), transparent);
  }
}

.rolling-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.rolling-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  transition: transform 60ms linear;
}

.code-row {
  font-weight: 700;
  text-align: center;
  padding: 8px 30px;
  letter-spacing: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: nowrap;
  transition: font-size 0.15s ease, opacity 0.15s ease, transform 0.15s ease, color 0.15s ease, filter 0.15s ease;
  height: 58px;
  line-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;

  &.is-center {
    font-size: 54px;
    font-weight: 800;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.5);

    .is-winning & {
      font-size: 60px;
      color: #FFF !important;
      text-shadow: 0 0 40px var(--gold-color), 0 0 80px var(--gold-color), 0 0 120px var(--gold-dark);
      animation: winner-glow-pulse 0.4s ease-in-out infinite alternate;
    }
  }
}

@keyframes winner-glow-pulse {
  from {
    text-shadow: 0 0 40px var(--gold-color), 0 0 80px var(--gold-color), 0 0 120px var(--gold-dark);
    transform: scale(1);
  }
  to {
    text-shadow: 0 0 50px var(--gold-color), 0 0 100px var(--gold-color), 0 0 150px var(--gold-dark);
    transform: scale(1.02);
  }
}

.center-highlight {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 70px;
  transform: translateY(-50%);
  background: linear-gradient(to bottom, transparent 0%, rgba(255, 215, 0, 0.08) 45%, rgba(255, 215, 0, 0.15) 50%, rgba(255, 215, 0, 0.08) 55%, transparent 100%);
  pointer-events: none;
  z-index: 2;
}

.winner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
  border-radius: 20px;
  z-index: 100;
}

.winner-effect-enter-active {
  animation: winner-in 0.3s ease-out;
}
.winner-effect-leave-active {
  animation: winner-out 0.5s ease-in;
}

@keyframes winner-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes winner-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.winner-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 215, 0, 0.5) 0%, rgba(255, 165, 0, 0.25) 40%, transparent 70%);
  animation: glow-pulse 0.8s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

.star-burst {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star {
  position: absolute;
  width: 24px;
  height: 24px;
  background: var(--gold-color);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  animation: star-explode 1s ease-out forwards;
  transform-origin: center;
}

@keyframes star-explode {
  0% { transform: rotate(0deg) translateY(0) scale(0); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateY(-200px) scale(1.5); opacity: 0; }
}

.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: var(--shape);
  animation: confetti-burst 2s ease-out var(--delay) forwards;
  opacity: 0;
}

@keyframes confetti-burst {
  0% { transform: translate(-50%, -50%) translateY(0) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) translateY(var(--y)) translateX(var(--x)) rotate(var(--rotation)); opacity: 0; }
}

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--color);
  opacity: var(--opacity);
  animation: particle-orbit var(--duration) linear infinite;
  animation-delay: var(--delay);
}

@keyframes particle-orbit {
  from { transform: rotate(var(--angle)) translateX(var(--radius)) rotate(calc(-1 * var(--angle))); }
  to { transform: rotate(calc(var(--angle) + 360deg)) translateX(var(--radius)) rotate(calc(-1 * var(--angle) - 360deg)); }
}

.sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--gold-color);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--gold-color), 0 0 12px var(--gold-dark);
  animation: spark-fly 0.6s ease-out infinite;
  animation-delay: var(--delay);
}

@keyframes spark-fly {
  0% { transform: rotate(var(--angle)) translateX(80px); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(200px); opacity: 0; }
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.remain-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;

  .remain-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }
  .remain-number {
    font-size: 24px;
    font-weight: 700;
    color: var(--gold-color);
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.controls {
  position: relative;
  margin-top: 40px;
}

.btn-glow {
  position: absolute;
  inset: -4px;
  background: linear-gradient(45deg, var(--gold-color), var(--gold-dark), var(--gold-color));
  border-radius: 16px;
  filter: blur(15px);
  opacity: 0.6;
  animation: btn-glow-pulse 1.5s ease-in-out infinite;
}

@keyframes btn-glow-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.start-btn {
  position: relative;
  padding: 18px 70px;
  font-size: 22px;
  font-weight: 700;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-color) 0%, var(--gold-dark) 100%) !important;
  border: none !important;
  color: #1a1a2e !important;
  box-shadow: 0 6px 30px rgba(255, 215, 0, 0.5);
  transition: all 0.3s ease;
  letter-spacing: 2px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.7);
  }
  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
  &:disabled {
    background: rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.4) !important;
    box-shadow: none;
  }

  .el-icon {
    font-size: 24px;
    margin-right: 8px;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
