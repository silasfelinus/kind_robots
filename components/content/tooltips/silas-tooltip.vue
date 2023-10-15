<template>
  <div v-if="shouldDisplayTooltip" class="tooltip-container">
    <div>Silas says: {{ page.tooltip }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const { page } = useContent()
const pageStore = usePageStore()

const streamedText = ref('')
let index = 0
let timer: number

const shouldDisplayTooltip = computed(() => {
  if (pageStore.overrideTooltip !== null) {
    return pageStore.overrideTooltip
  }
  return pageStore.showTooltip && page.tooltip
})
</script>

<style scoped>
.tooltip-container {
  background-color: var(--bg-base-400);
  color: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
