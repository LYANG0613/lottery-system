<template>
  <div class="import-container">
    <el-card class="import-card">
      <template #header>
        <div class="card-header">
          <span class="title">参与者管理</span>
          <div class="header-actions">
            <el-tag type="info" size="large">
              共 {{ participants.length }} 人
            </el-tag>
          </div>
        </div>
      </template>

      <div
        class="upload-area"
        :class="{ 'is-dragover': isDragover }"
        @dragover.prevent="isDragover = true"
        @dragleave="isDragover = false"
        @drop.prevent="handleDrop"
        @click="triggerUpload"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <p class="upload-text">拖拽Excel文件到此处，或 <span class="link">点击上传</span></p>
        <p class="upload-hint">支持 .xlsx, .xls 格式</p>
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls"
          style="display: none"
          @change="handleFileChange"
        />
      </div>

      <div v-if="errors.length > 0" class="error-box">
        <el-alert
          title="导入提示"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="error-list">
              <p v-for="(error, index) in errors.slice(0, 5)" :key="index">{{ error }}</p>
              <p v-if="errors.length > 5">... 还有 {{ errors.length - 5 }} 条提示</p>
            </div>
          </template>
        </el-alert>
      </div>

      <div v-if="participants.length > 0" class="participant-section">
        <div class="section-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索机器SN、企业名称或区域..."
            prefix-icon="Search"
            clearable
            style="width: 280px"
          />
          <el-button type="danger" plain @click="clearAll">
            <el-icon><Delete /></el-icon>
            清空列表
          </el-button>
        </div>

        <el-table
          :data="filteredParticipants"
          stripe
          height="300"
          style="width: 100%"
        >
          <el-table-column prop="machineCode" label="机器SN号" width="180">
            <template #default="{ row }">
              <span class="machine-code-cell">{{ row.machineCode || row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="companyName" label="代理商公司名" min-width="280" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.companyName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="region" label="所属区域" width="140">
            <template #default="{ row }">
              {{ row.region || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                link
                @click="removeParticipant(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseExcel } from '../composables/useExcel'
import type { Participant } from '../types'

interface Props {
  participants: Participant[]
}

interface Emits {
  (e: 'update:participants', value: Participant[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragover = ref(false)
const searchKeyword = ref('')
const errors = ref<string[]>([])

const filteredParticipants = computed(() => {
  if (!searchKeyword.value) return props.participants
  const keyword = searchKeyword.value.toLowerCase()
  return props.participants.filter(
    p =>
      p.machineCode?.toLowerCase().includes(keyword) ||
      p.companyName?.toLowerCase().includes(keyword) ||
      p.region?.toLowerCase().includes(keyword) ||
      p.name?.toLowerCase().includes(keyword)
  )
})

function triggerUpload() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processFile(file)
  }
  target.value = ''
}

async function handleDrop(event: DragEvent) {
  isDragover.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isExcel) {
      ElMessage.error('请上传Excel文件 (.xlsx, .xls)')
      return
    }
    await processFile(file)
  }
}

async function processFile(file: File) {
  ElMessage.info('正在解析文件...')
  const result = await parseExcel(file)
  errors.value = result.errors

  if (result.data.length > 0) {
    const existingIds = new Set(props.participants.map(p => p.id))
    const newParticipants = result.data.filter(p => !existingIds.has(p.id))
    emit('update:participants', [...props.participants, ...newParticipants])
    ElMessage.success(`成功导入 ${newParticipants.length} 名参与者`)
  } else if (result.errors.length === 0) {
    ElMessage.warning('未能从文件中提取有效数据')
  }
}

async function removeParticipant(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该参与者吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    emit('update:participants', props.participants.filter(p => p.id !== id))
    ElMessage.success('已删除')
  } catch {
    // 用户取消
  }
}

async function clearAll() {
  try {
    await ElMessageBox.confirm(
      `确定要清空所有 ${props.participants.length} 名参与者吗?`,
      '警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('update:participants', [])
    errors.value = []
    ElMessage.success('已清空列表')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.import-container {
  width: 100%;
  max-width: none;
}

.import-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);

  :deep(.el-card__body) {
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
  }
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

.upload-area {
  padding: 40px 20px;
  border: 2px dashed var(--card-border);
  border-radius: var(--radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-bottom: 20px;

  &:hover,
  &.is-dragover {
    border-color: var(--primary-color);
    background: rgba(26, 92, 170, 0.1);
  }

  .upload-icon {
    font-size: 48px;
    color: var(--primary-color);
    margin-bottom: 16px;
  }

  .upload-text {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;

    .link {
      color: var(--primary-color);
      text-decoration: underline;
    }
  }

  .upload-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.error-box {
  margin-bottom: 20px;

  .error-list {
    max-height: 150px;
    overflow-y: auto;

    p {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}

.participant-section {
  .section-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  :deep(.el-table) {
    .machine-code-cell {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 600;
      color: var(--gold-color);
    }
  }
}

:deep(.el-card__header) {
  border-bottom-color: var(--card-border);
}
</style>
