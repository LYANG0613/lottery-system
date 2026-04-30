<template>
  <div class="admin-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="company-logo">
            <img v-if="store.state.companyLogo" :src="store.state.companyLogo" alt="logo" />
            <span v-else class="logo-placeholder">L</span>
          </div>
          <h1 class="site-title">抽奖系统管理后台</h1>
        </div>
        <div class="header-actions">
          <el-button link @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button link @click="goToLottery" type="primary">
            <el-icon><Monitor /></el-icon>
            抽奖页面
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="page-main">
      <div class="admin-container">
        <!-- 左侧：配置面板 -->
        <div class="config-sidebar">
          <!-- 活动设置 -->
          <div class="config-card">
            <div class="card-header" @click="toggleSection('settings')">
              <el-icon><Setting /></el-icon>
              <span>活动设置</span>
              <el-icon class="arrow" :class="{ 'is-expanded': expandedSections.settings }">
                <ArrowRight />
              </el-icon>
            </div>
            <el-collapse-transition>
              <div v-show="expandedSections.settings" class="card-body">
                <el-form label-position="top" size="default">
                  <el-form-item label="活动名称">
                    <el-input
                      v-model="settingsForm.eventName"
                      placeholder="例如：2026年度盛典"
                      @blur="saveSettings"
                    />
                  </el-form-item>
                  <el-form-item label="公司Logo（URL）">
                    <el-input
                      v-model="settingsForm.companyLogo"
                      placeholder="输入Logo图片URL"
                      @blur="saveSettings"
                    />
                  </el-form-item>
                  <div class="preview-logo" v-if="settingsForm.companyLogo">
                    <img :src="settingsForm.companyLogo" alt="logo预览" />
                  </div>
                </el-form>
              </div>
            </el-collapse-transition>
          </div>

          <!-- 奖品配置 -->
          <div class="config-card">
            <div class="card-header" @click="toggleSection('prizes')">
              <el-icon><Present /></el-icon>
              <span>奖品配置</span>
              <el-tag type="warning" size="small">{{ store.state.prizes.length }}</el-tag>
              <el-icon class="arrow" :class="{ 'is-expanded': expandedSections.prizes }">
                <ArrowRight />
              </el-icon>
            </div>
            <el-collapse-transition>
              <div v-show="expandedSections.prizes" class="card-body">
                <div class="prize-actions">
                  <el-button type="primary" size="small" @click="showPrizeDialog = true">
                    <el-icon><Plus /></el-icon>
                    添加奖品
                  </el-button>
                </div>
                <div class="prize-list">
                  <div
                    v-for="prize in store.state.prizes"
                    :key="prize.id"
                    class="prize-item"
                  >
                    <div v-if="prize.images?.length || prize.image" class="prize-thumb">
                      <img :src="prize.images?.[0] || prize.image" alt="" @error="e => (e.target as HTMLImageElement).style.display = 'none'" />
                    </div>
                    <div class="prize-info">
                      <span class="prize-level">{{ getLevelLabel(prize.level) }}</span>
                      <span class="prize-name">{{ prize.name }}</span>
                      <span class="prize-count">{{ prize.count }}名</span>
                    </div>
                    <div class="prize-actions">
                      <el-button type="danger" link size="small" @click="handleDeletePrize(prize.id)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  <div v-if="store.state.prizes.length === 0" class="empty-hint">
                    暂无奖品，点击上方添加
                  </div>
                </div>
              </div>
            </el-collapse-transition>
          </div>

          <!-- 参与人员 -->
          <div class="config-card">
            <div class="card-header" @click="toggleSection('participants')">
              <el-icon><User /></el-icon>
              <span>参与人员</span>
              <el-tag type="info" size="small">{{ store.state.participants.length }}</el-tag>
              <el-icon class="arrow" :class="{ 'is-expanded': expandedSections.participants }">
                <ArrowRight />
              </el-icon>
            </div>
            <el-collapse-transition>
              <div v-show="expandedSections.participants" class="card-body">
                <ParticipantImport
                  :participants="store.state.participants"
                  @update:participants="handleUpdateParticipants"
                />
              </div>
            </el-collapse-transition>
          </div>
        </div>

        <!-- 右侧：中奖名单 -->
        <div class="result-area">
          <div class="result-card">
            <div class="card-header">
              <el-icon class="trophy"><Trophy /></el-icon>
              <span>中奖名单</span>
              <el-tag type="success">{{ store.state.winners.length }} 人</el-tag>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="store.state.winners.length === 0"
                  @click="handleExport"
                >
                  <el-icon><Download /></el-icon>
                  导出Excel
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  :disabled="store.state.winners.length === 0"
                  @click="handleClearWinners"
                >
                  <el-icon><Delete /></el-icon>
                  清空中奖
                </el-button>
              </div>
            </div>
            <div class="card-body winners-body">
              <WinnerList
                :winners="store.state.winners"
                @remove="handleRemoveWinner"
              />
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToLottery">
              <el-icon><Monitor /></el-icon>
              进入抽奖页面
            </el-button>
            <el-button type="warning" size="large" @click="handleResetAll">
              <el-icon><RefreshLeft /></el-icon>
              重置所有数据
            </el-button>
          </div>

          <!-- 数据备份 -->
          <div class="backup-card">
            <div class="card-header">
              <el-icon class="warning"><Warning /></el-icon>
              <span>数据安全</span>
            </div>
            <div class="card-body">
              <div class="backup-info" v-if="lastBackup">
                <el-icon><DocumentCopy /></el-icon>
                <span>上次备份: {{ formatBackupTime(lastBackup.timestamp) }}</span>
              </div>
              <div class="backup-info empty" v-else>
                <el-icon><Warning /></el-icon>
                <span>暂无备份记录</span>
              </div>
              <div class="backup-buttons">
                <el-button type="success" @click="handleCreateBackup">
                  <el-icon><DocumentCopy /></el-icon>
                  备份当前数据
                </el-button>
                <el-button type="warning" @click="handleRestore" :disabled="!lastBackup">
                  <el-icon><Refresh /></el-icon>
                  恢复备份
                </el-button>
              </div>
              <p class="backup-tip">
                <el-icon><Warning /></el-icon>
                建议在抽奖前备份数据，以防意外丢失
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加奖品对话框 -->
    <el-dialog
      v-model="showPrizeDialog"
      title="添加奖品"
      width="450px"
      destroy-on-close
    >
      <el-form :model="prizeForm" label-width="80px">
        <el-form-item label="奖品名称" required>
          <el-input v-model="prizeForm.name" placeholder="例如：特等奖 iPhone 15" />
        </el-form-item>
        <el-form-item label="奖品等级" required>
          <el-select v-model="prizeForm.level" placeholder="选择等级" style="width: 100%">
            <el-option :value="1" label="特等奖" />
            <el-option :value="2" label="一等奖" />
            <el-option :value="3" label="二等奖" />
            <el-option :value="4" label="三等奖" />
            <el-option :value="5" label="四等奖" />
            <el-option :value="6" label="参与奖" />
          </el-select>
        </el-form-item>
        <el-form-item label="名额数量" required>
          <el-input-number
            v-model="prizeForm.count"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="奖品描述">
          <el-input
            v-model="prizeForm.description"
            type="textarea"
            :rows="2"
            placeholder="奖品描述（可选）"
          />
        </el-form-item>
        <el-form-item label="奖品物品">
          <div class="items-list">
            <div v-for="(item, idx) in prizeForm.items" :key="item.id" class="item-row">
              <el-input
                v-model="item.name"
                placeholder="物品名称，如：iPhone 15"
                size="small"
              />
              <el-button type="danger" size="small" link @click="removePrizeItem(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addPrizeItem">
              <el-icon><Plus /></el-icon>
              添加物品
            </el-button>
          </div>
          <p class="upload-tip">可添加多个物品，例如：一等奖包含 iPhone、AirPods</p>
        </el-form-item>
        <el-form-item label="奖品图片">
          <div class="images-upload-grid">
            <div
              v-for="(img, idx) in prizeForm.images"
              :key="idx"
              class="image-item"
            >
              <img :src="img" alt="" />
              <span class="remove-btn" @click="prizeForm.images.splice(idx, 1)">&times;</span>
            </div>
            <div
              class="add-image-btn"
              :class="{ 'is-dragover': isDragover }"
              @dragover.prevent="isDragover = true"
              @dragleave="isDragover = false"
              @drop.prevent="handleImageDrop"
              @click="imageInputRef?.click()"
            >
              <el-icon><Plus /></el-icon>
            </div>
          </div>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display: none"
            @change="handleImageChange"
          />
          <p class="upload-tip">点击 + 或拖拽图片上传，支持多张</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPrizeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddPrize">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Present, User, Trophy, Plus, Delete, Download, ArrowRight, HomeFilled, Monitor, RefreshLeft, DocumentCopy, Refresh, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ParticipantImport from '../components/ParticipantImport.vue'
import WinnerList from '../components/WinnerList.vue'
import { useLotteryStore } from '../stores/lottery'
import { exportToExcel } from '../composables/useExcel'
import { getLevelLabel, updatePageTitle } from '../composables/useConstants'
import type { Participant, Prize, PrizeItem } from '../types'

const router = useRouter()
const store = useLotteryStore()

// 页面标题
updatePageTitle(store.state.eventName)

const expandedSections = reactive({
  settings: true,
  prizes: true,
  participants: false
})

const settingsForm = reactive({
  eventName: '',
  companyLogo: ''
})

const prizeForm = reactive({
  name: '',
  level: 3,
  count: 1,
  description: '',
  images: [] as string[],
  items: [] as PrizeItem[]
})

const showPrizeDialog = ref(false)
const isDragover = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)

function addPrizeItem() {
  prizeForm.items.push({ id: Date.now().toString(36) + Math.random().toString(36).substring(2), name: '' })
}

function removePrizeItem(index: number) {
  prizeForm.items.splice(index, 1)
}

// 备份状态
const lastBackup = computed(() => store.getBackup())

function formatBackupTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleImageDrop(e: DragEvent) {
  isDragover.value = false
  const file = e.dataTransfer?.files[0]
  if (file) await processImageFile(file)
}

async function handleImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await processImageFile(file)
}

async function processImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    prizeForm.images.push(e.target?.result as string)
  }
  reader.readAsDataURL(file)
}

function handleCreateBackup() {
  const backup = store.createBackup('管理后台手动备份')
  if (backup) {
    ElMessage.success('数据已备份成功')
  } else {
    ElMessage.error('备份失败')
  }
}

async function handleRestore() {
  try {
    await ElMessageBox.confirm(
      '确定要从备份恢复数据吗？当前未保存的更改将会丢失。',
      '恢复备份',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const success = store.restoreFromBackup()
    if (success) {
      ElMessage.success('数据已恢复')
      settingsForm.eventName = store.state.eventName
      settingsForm.companyLogo = store.state.companyLogo
    } else {
      ElMessage.warning('没有可用的备份')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  settingsForm.eventName = store.state.eventName
  settingsForm.companyLogo = store.state.companyLogo
})

function toggleSection(section: keyof typeof expandedSections) {
  expandedSections[section] = !expandedSections[section]
}

function saveSettings() {
  store.setEventName(settingsForm.eventName)
  store.setCompanyLogo(settingsForm.companyLogo)
  updatePageTitle(settingsForm.eventName)
  ElMessage.success('设置已保存')
}

function handleAddPrize() {
  if (!prizeForm.name.trim()) {
    ElMessage.warning('请输入奖品名称')
    return
  }

  const newPrize: Prize = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    name: prizeForm.name,
    level: prizeForm.level,
    count: prizeForm.count,
    description: prizeForm.description,
    images: [...prizeForm.images],
    items: [...prizeForm.items]
  }

  store.addPrize(newPrize)
  ElMessage.success('奖品已添加')

  prizeForm.name = ''
  prizeForm.level = 3
  prizeForm.count = 1
  prizeForm.description = ''
  prizeForm.images = []
  prizeForm.items = []
  showPrizeDialog.value = false
}

async function handleDeletePrize(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该奖品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    store.removePrize(id)
    ElMessage.success('奖品已删除')
  } catch {
    // 用户取消
  }
}

function handleUpdateParticipants(participants: Participant[]) {
  store.setParticipants(participants)
}

function handleRemoveWinner(id: string) {
  store.removeWinner(id)
}

function handleExport() {
  if (store.state.winners.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const exportData = store.state.winners.map(w => ({
    machineCode: w.participant.machineCode || w.participant.name,
    companyName: w.participant.companyName,
    region: w.participant.region,
    prizeName: w.prize.name,
    winTime: w.winTime
  }))

  exportToExcel(exportData, '抽奖获奖名单')
  ElMessage.success('导出成功')
}

async function handleClearWinners() {
  try {
    await ElMessageBox.confirm(
      `确定要清空所有 ${store.state.winners.length} 条中奖记录吗？`,
      '警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    store.clearWinners()
    ElMessage.success('已清空中奖记录')
  } catch {
    // 用户取消
  }
}

async function handleResetAll() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据吗？包括参与者、奖品和中奖记录都将被清空。',
      '危险操作',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    store.clearAll()
    settingsForm.eventName = ''
    settingsForm.companyLogo = ''
    ElMessage.success('所有数据已重置')
  } catch {
    // 用户取消
  }
}

function goHome() {
  router.push('/')
}

function goToLottery() {
  router.push('/lottery')
}
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--card-border);
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.company-logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .logo-placeholder {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }
}

.site-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-main {
  padding: 24px;
}

.admin-container {
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.config-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  > .el-icon:first-child {
    font-size: 18px;
    color: var(--primary-color);
  }

  > span {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .trophy {
    color: var(--accent-color) !important;
  }

  .arrow {
    transition: transform 0.3s;

    &.is-expanded {
      transform: rotate(90deg);
    }
  }

  .header-actions {
    margin-left: auto;
  }
}

.card-body {
  padding: 16px;
  border-top: 1px solid var(--card-border);
}

.prize-actions {
  margin-bottom: 12px;
}

.prize-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.prize-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);

  .prize-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .prize-level {
      font-size: 11px;
      padding: 2px 8px;
      background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
      border-radius: 10px;
      color: #fff;
      font-weight: 600;
    }

    .prize-name {
      font-size: 14px;
      color: var(--text-primary);
    }

    .prize-count {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.empty-hint {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.prize-thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  margin-right: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.images-upload-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .image-item {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--card-border);

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: rgba(255, 255, 255, 0.05);
    }

    .remove-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        background: rgba(220, 53, 69, 0.8);
      }
    }

    &:hover .remove-btn {
      opacity: 1;
    }
  }

  .add-image-btn {
    width: 100px;
    height: 100px;
    border: 2px dashed var(--card-border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-normal);
    color: var(--text-muted);
    font-size: 28px;

    &:hover,
    &.is-dragover {
      border-color: var(--primary-color);
      background: rgba(26, 92, 170, 0.08);
      color: var(--primary-color);
    }
  }
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;

  .item-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-input {
      flex: 1;
    }
  }
}

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.preview-logo {
  margin-top: 12px;

  img {
    max-width: 160px;
    max-height: 80px;
    border-radius: var(--radius-md);
    border: 1px solid var(--card-border);
    object-fit: contain;
  }
}

.result-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.winners-body {
  padding: 16px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.backup-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  backdrop-filter: blur(10px);

  .card-header {
    cursor: default;

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .warning {
      color: var(--accent-color);
    }
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .backup-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--text-secondary);

    &.empty {
      color: var(--text-muted);
    }

    .el-icon {
      font-size: 16px;
      color: var(--accent-color);
    }
  }

  .backup-buttons {
    display: flex;
    gap: 10px;

    .el-button {
      flex: 1;
    }
  }

  .backup-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;

    .el-icon {
      font-size: 14px;
    }
  }
}

:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
}
</style>
