<template>
  <div class="entry-page">
    <!-- 粒子背景 -->
    <div class="particle-bg">
      <span v-for="i in 50" :key="i" class="particle" :style="particleStyle(i)"></span>
    </div>

    <!-- 光效装饰 -->
    <div class="glow-effect glow-1"></div>
    <div class="glow-effect glow-2"></div>

    <!-- 主内容 -->
    <div class="entry-content">
      <div class="logo-area">
        <div class="main-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" stroke="url(#logoGradient)" stroke-width="3"/>
              <path d="M50 20L58 38L78 40L64 54L68 74L50 64L32 74L36 54L22 40L42 38L50 20Z" fill="url(#logoGradient)"/>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#f5a623"/>
                  <stop offset="100%" stop-color="#1a5caa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <h1 class="site-title">企业抽奖系统</h1>
        <p class="site-subtitle">Enterprise Lottery System</p>
      </div>

      <div class="entry-buttons">
        <div class="entry-card user-card" @click="goTo('/lottery')">
          <div class="card-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2"/>
              <circle cx="32" cy="32" r="8" fill="currentColor"/>
              <path d="M32 4V16M32 48V60M4 32H16M48 32H60" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h2 class="card-title">用户端</h2>
          <p class="card-desc">抽奖展示页面</p>
          <p class="card-hint">用于投影展示抽奖过程</p>
        </div>

        <div class="entry-card winners-card" @click="goTo('/winners')">
          <div class="card-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 8L38 22L54 24L43 35L46 52L32 45L18 52L21 35L10 24L26 22L32 8Z" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>
            </svg>
          </div>
          <h2 class="card-title">中奖公示</h2>
          <p class="card-desc">中奖名单公示</p>
          <p class="card-hint">公开展示所有中奖信息</p>
        </div>

        <div class="entry-card admin-card" @click="goTo('/admin')">
          <div class="card-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="8" y="8" width="48" height="48" rx="8" stroke="currentColor" stroke-width="2"/>
              <path d="M8 24H56M24 8V56" stroke="currentColor" stroke-width="2"/>
              <circle cx="40" cy="40" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M44 44L52 52" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h2 class="card-title">管理端</h2>
          <p class="card-desc">后台管理页面</p>
          <p class="card-hint">配置奖品、导入名单、导出结果</p>
        </div>
      </div>

      <div class="footer-info">
        <p>请选择要进入的页面</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goTo(path: string) {
  router.push(path)
}

function particleStyle(_index: number) {
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 15}s`,
    animationDuration: `${15 + Math.random() * 10}s`,
    width: `${2 + Math.random() * 6}px`,
    height: `${2 + Math.random() * 6}px`,
    opacity: 0.1 + Math.random() * 0.4
  }
}
</script>

<style scoped lang="scss">
.entry-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
}

.particle-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  background: var(--accent-color);
  border-radius: 50%;
  animation: float-particle 20s ease-in-out infinite;
}

@keyframes float-particle {
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

.glow-effect {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;

  &.glow-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(245, 166, 35, 0.15) 0%, transparent 70%);
    top: -200px;
    left: -200px;
  }

  &.glow-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(26, 92, 170, 0.15) 0%, transparent 70%);
    bottom: -150px;
    right: -150px;
  }
}

.entry-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.logo-area {
  margin-bottom: 60px;

  .main-logo {
    margin-bottom: 24px;
  }

  .logo-icon {
    width: 100px;
    height: 100px;
    margin: 0 auto;
    animation: pulse-glow 3s ease-in-out infinite;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 20px rgba(245, 166, 35, 0.5));
    }
    50% {
      transform: scale(1.05);
      filter: drop-shadow(0 0 30px rgba(245, 166, 35, 0.8));
    }
  }

  .site-title {
    font-size: 48px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-color) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
  }

  .site-subtitle {
    font-size: 16px;
    color: var(--text-muted);
    letter-spacing: 4px;
    text-transform: uppercase;
  }
}

.entry-buttons {
  display: flex;
  gap: 40px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 60px;

  @media (max-width: 960px) {
    gap: 24px;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
}

.entry-card {
  width: 260px;
  padding: 36px 28px;
  background: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  &.user-card {
    &:hover {
      border-color: var(--accent-color);
      box-shadow: 0 20px 60px rgba(245, 166, 35, 0.2);
    }

    .card-icon {
      color: var(--accent-color);
    }
  }

  &.admin-card {
    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 20px 60px rgba(26, 92, 170, 0.2);
    }

    .card-icon {
      color: var(--primary-color);
    }
  }

  &.winners-card {
    &:hover {
      border-color: #FFD700;
      box-shadow: 0 20px 60px rgba(255, 215, 0, 0.2);
    }

    .card-icon {
      color: #FFD700;
    }
  }

  .card-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .card-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 12px;
  }

  .card-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .card-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.footer-info {
  p {
    font-size: 14px;
    color: var(--text-muted);
  }
}
</style>
