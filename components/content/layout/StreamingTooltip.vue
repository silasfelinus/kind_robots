<template>
  <div class="tooltip-container bg-base-100 text-primary p-4 rounded-lg shadow-md">
    <span class="font-semibold"
      ><icon name="mdi:chat" class="text-accent mr-2" />Silas Says:
      <span class="text-secondary">{{ streamedText }}</span></span
    >
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  tooltip: string
}>()

const streamedText = ref('')
let index = 0
let timer: number

const startStreaming = () => {
  timer = window.setInterval(() => {
    if (index < props.tooltip.length) {
      streamedText.value += props.tooltip[index]
      index++
    } else {
      clearInterval(timer)
    }
  }, 100) // Adjust the speed as needed
}

onMounted(() => {
  startStreaming()
})

watch(
  () => props.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    index = 0
    startStreaming()
  }
)
</script>

<style scoped>
.tooltip-container {
  background-color: var(--bg-base-100);
  color: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
