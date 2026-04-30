<template>
  <div class="prize-config">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span class="title">奖品配置</span>
          <el-button type="primary" size="small" @click="addPrize">
            <el-icon><Plus /></el-icon>
            添加奖品
          </el-button>
        </div>
      </template>

      <div v-if="prizes.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Present /></el-icon>
        <p>暂无奖品配置</p>
        <p class="hint">点击上方按钮添加奖品</p>
      </div>

      <div v-else class="prize-list">
        <div
          v-for="(prize, index) in prizes"
          :key="prize.id"
          class="prize-item"
          :class="{ 'is-active': selectedPrizeId === prize.id }"
          @click="selectPrize(prize.id)"
        >
          <div v-if="prize.images?.length || prize.image" class="prize-thumb">
            <img :src="prize.images?.[0] || prize.image" alt="" @error="e => (e.target as HTMLImageElement).style.display = 'none'" />
          </div>

          <div class="prize-rank">
            <span class="rank-number">{{ index + 1 }}</span>
            <span class="rank-label">{{ getLevelLabel(prize.level) }}</span>
          </div>

          <div class="prize-info">
            <div class="prize-name">{{ prize.name }}</div>
            <div class="prize-meta">
              <el-tag size="small" type="warning">
                <el-icon><Trophy /></el-icon>
                {{ prize.count }} 名
              </el-tag>
              <span class="remaining">
                剩余 {{ getRemainingCount(prize.id) }} 个名额
              </span>
            </div>
          </div>

          <div class="prize-actions">
            <el-button type="primary" link @click.stop="editPrize(prize)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              type="primary"
              link
              :disabled="getRemainingCount(prize.id) === 0"
              @click.stop="startDraw(prize)"
            >
              {{ getRemainingCount(prize.id) === 0 ? '已抽完' : '抽奖' }}
            </el-button>
            <el-button type="danger" link @click.stop="removePrize(prize.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 编辑奖品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingPrize ? '编辑奖品' : '添加奖品'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" label-width="80px" class="prize-form">
        <el-form-item label="奖品名称" required>
          <el-input v-model="form.name" placeholder="例如：特等奖 iPhone 15" />
        </el-form-item>

        <el-form-item label="奖品等级" required>
          <el-select v-model="form.level" placeholder="选择等级" style="width: 100%">
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
            v-model="form.count"
            :min="1"
            :max="100"
            placeholder="中奖人数"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="奖品描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="奖品描述或备注（可选）"
          />
        </el-form-item>

        <el-form-item label="奖品图片">
          <div class="images-upload-grid">
            <div
              v-for="(img, idx) in form.images"
              :key="idx"
              class="image-item"
            >
              <img :src="img" alt="" />
              <span class="remove-btn" @click="form.images.splice(idx, 1)">&times;</span>
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrize">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus, Delete, Present, Trophy, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Prize, Winner } from '../types'

interface Props {
  prizes: Prize[]
  winners: Winner[]
}

interface Emits {
  (e: 'update:prizes', value: Prize[]): void
  (e: 'select', prize: Prize): void
  (e: 'draw', prize: Prize): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const editingPrize = ref<Prize | null>(null)
const selectedPrizeId = ref<string | null>(null)
const isDragover = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: '',
  level: 3,
  count: 1,
  description: '',
  images: [] as string[]
})

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

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

function getRemainingCount(prizeId: string): number {
  const prize = props.prizes.find(p => p.id === prizeId)
  if (!prize) return 0
  const wonCount = props.winners.filter(w => w.prize.id === prizeId).length
  return Math.max(0, prize.count - wonCount)
}

function addPrize() {
  editingPrize.value = null
  Object.assign(form, {
    name: '',
    level: 3,
    count: 1,
    description: '',
    images: []
  })
  dialogVisible.value = true
}

function editPrize(prize: Prize) {
  editingPrize.value = prize
  Object.assign(form, {
    name: prize.name,
    level: prize.level,
    count: prize.count,
    description: prize.description || '',
    image: prize.images?.[0] || prize.image || '',
    images: prize.images || (prize.image ? [prize.image] : [])
  })
  dialogVisible.value = true
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
    form.images.push(e.target?.result as string)
  }
  reader.readAsDataURL(file)
}

function savePrize() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入奖品名称')
    return
  }

  if (editingPrize.value) {
    const index = props.prizes.findIndex(p => p.id === editingPrize.value!.id)
    if (index !== -1) {
      const updated = [...props.prizes]
      updated[index] = {
        ...updated[index],
        name: form.name,
        level: form.level,
        count: form.count,
        description: form.description,
        images: [...form.images]
      }
      emit('update:prizes', updated)
    }
    ElMessage.success('奖品已更新')
  } else {
    const newPrize: Prize = {
      id: generateId(),
      name: form.name,
      level: form.level,
      count: form.count,
      description: form.description,
      images: [...form.images]
    }
    const sorted = [...props.prizes, newPrize].sort((a, b) => a.level - b.level)
    emit('update:prizes', sorted)
    ElMessage.success('奖品已添加')
  }

  dialogVisible.value = false
}

function selectPrize(id: string) {
  selectedPrizeId.value = id
  const prize = props.prizes.find(p => p.id === id)
  if (prize) {
    emit('select', prize)
  }
}

function startDraw(prize: Prize) {
  if (getRemainingCount(prize.id) === 0) {
    ElMessage.warning('该奖品名额已用完')
    return
  }
  emit('draw', prize)
}

async function removePrize(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该奖品吗？相关中奖记录也会被清除', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    emit('update:prizes', props.prizes.filter(p => p.id !== id))
    if (selectedPrizeId.value === id) {
      selectedPrizeId.value = null
    }
    ElMessage.success('奖品已删除')
  } catch {
    // 用户取消
  }
}

defineExpose({
  selectFirstAvailable: () => {
    const firstWithRemaining = props.prizes.find(p => getRemainingCount(p.id) > 0)
    if (firstWithRemaining) {
      selectPrize(firstWithRemaining.id)
      return firstWithRemaining
    }
    return null
  }
})
</script>

<style scoped lang="scss">
.prize-config {
  width: 100%;
}

.config-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 8px 0;
  }

  .hint {
    font-size: 13px;
  }
}

.prize-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.is-active {
    background: rgba(26, 92, 170, 0.15);
    border-color: var(--primary-color);
  }
}

.prize-thumb {
  width: 48px;
  height: 48px;
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

.prize-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;

  .rank-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
    border-radius: 50%;
    font-weight: 700;
    font-size: 16px;
    color: #fff;
  }

  .rank-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }
}

.prize-info {
  flex: 1;

  .prize-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .prize-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .remaining {
      font-size: 13px;
      color: var(--text-muted);
    }
  }
}

.prize-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prize-form {
  padding: 10px 0;
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

.upload-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

:deep(.el-card__header) {
  border-bottom-color: var(--card-border);
}

:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
}
</style>
