<template>
  <div
    v-if="displayStore.footer !== 'hidden'"
    :class="{
      'h-12': displayStore.footer === 'open',
      'h-6': displayStore.footer === 'compact',
    }"
    class="kind-footer w-full bg-primary text-white flex justify-center items-center p-4 transition-all duration-500"
    :style="{ height: `${displayStore.footerVh}vh`, width: `${displayStore.footerVw}%` }"
  >
    <p class="text-center text-sm">
      © 2024 My Project. All rights reserved.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>

<style scoped>
.kind-footer {
  background-color: var(--tw-bg-primary);
  color: var(--tw-text-white);
}
</style>
