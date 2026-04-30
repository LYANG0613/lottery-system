<template>
  <div class="winner-list">
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Trophy /></el-icon>
            获奖名单
          </span>
          <div class="header-actions">
            <el-tag type="success" size="large">
              共 {{ winners.length }} 人
            </el-tag>
            <el-button
              type="primary"
              :disabled="winners.length === 0"
              @click="handleExport"
            >
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="winners.length === 0" class="empty-state">
        <div class="empty-illustration">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.1)" stroke-width="2" stroke-dasharray="8 4"/>
            <path d="M60 30L66.18 46.82L84 49.64L70 62.18L72.36 80L60 71.5L47.64 80L50 62.18L36 49.64L53.82 46.82L60 30Z" fill="rgba(245,166,35,0.2)" stroke="rgba(245,166,35,0.4)" stroke-width="2"/>
          </svg>
        </div>
        <p class="empty-text">暂无中奖名单</p>
        <p class="empty-hint">开始抽奖后，中奖者将显示在这里</p>
      </div>

      <div v-else class="winners-content">
        <!-- 按奖品分组展示 -->
        <div
          v-for="group in groupedWinners"
          :key="group.prize.id"
          class="prize-group"
        >
          <div class="group-header">
            <div class="prize-badge">
              <span class="badge-rank">{{ getLevelLabel(group.prize.level) }}</span>
              <span class="badge-name">{{ group.prize.name }}</span>
            </div>
            <div class="group-stats">
              <span class="count">{{ group.winners.length }}/{{ group.prize.count }}</span>
            </div>
          </div>

          <div class="winner-grid">
            <transition-group name="winner-item">
              <div
                v-for="winner in group.winners"
                :key="winner.id"
                class="winner-card"
              >
                <div class="winner-avatar">
                  {{ getInitials(winner.participant.name) }}
                </div>
                <div class="winner-info">
                  <div class="winner-name">{{ winner.participant.name }}</div>
                  <div class="winner-dept" v-if="winner.participant.department">
                    {{ winner.participant.department }}
                  </div>
                </div>
                <div class="winner-time">
                  {{ formatTime(winner.winTime) }}
                </div>
                <el-button
                  type="danger"
                  link
                  class="remove-btn"
                  @click="$emit('remove', winner.id)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </transition-group>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, Download, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { exportToExcel } from '../composables/useExcel'
import type { Winner, Prize } from '../types'

interface Props {
  winners: Winner[]
}

interface Emits {
  (e: 'remove', winnerId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

interface WinnerGroup {
  prize: Prize
  winners: Winner[]
}

const groupedWinners = computed<WinnerGroup[]>(() => {
  const groups: Record<string, WinnerGroup> = {}

  for (const winner of props.winners) {
    const prizeId = winner.prize.id
    if (!groups[prizeId]) {
      groups[prizeId] = {
        prize: winner.prize,
        winners: []
      }
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

function getInitials(name: string): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

function formatTime(date: Date): string {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function handleExport() {
  if (props.winners.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const exportData = props.winners.map(w => ({
    machineCode: w.participant.machineCode || w.participant.name,
    companyName: w.participant.companyName,
    region: w.participant.region,
    prizeName: w.prize.name,
    winTime: w.winTime
  }))

  exportToExcel(exportData, '抽奖获奖名单')
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
.winner-list {
  width: 100%;
}

.list-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);

    .el-icon {
      color: var(--accent-color);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-illustration {
    margin-bottom: 24px;
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .empty-text {
    font-size: 18px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .empty-hint {
    font-size: 14px;
    color: var(--text-muted);
  }
}

.winners-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.prize-group {
  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--card-border);
  }

  .prize-badge {
    display: flex;
    align-items: center;
    gap: 12px;

    .badge-rank {
      padding: 4px 12px;
      background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
    }

    .badge-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .group-stats {
    .count {
      font-size: 14px;
      color: var(--accent-color);
      font-weight: 600;
    }
  }
}

.winner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.winner-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(245, 166, 35, 0.3);

    .remove-btn {
      opacity: 1;
    }
  }
}

.winner-avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  border-radius: 50%;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.winner-info {
  flex: 1;
  min-width: 0;

  .winner-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .winner-dept {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.winner-time {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.remove-btn {
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.winner-item-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.winner-item-leave-active {
  transition: all 0.3s ease;
}

.winner-item-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.winner-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

:deep(.el-card__header) {
  border-bottom-color: var(--card-border);
}
</style>
