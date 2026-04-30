<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { setupBeforeUnloadHandler } from './stores/lottery'

const cleanup = setupBeforeUnloadHandler()

onMounted(() => {
  // 注册完成
})

onUnmounted(() => {
  cleanup()
})
</script>
