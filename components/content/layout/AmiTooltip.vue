<template>
  <div
    class="flex items-center bg-base-400 text-default p-4 m-6 rounded-2xl border shadow-md"
  >
    <!-- Butterfly Container -->
    <div class="flex-none w-10 h-10">
      <icon name="icon-park-twotone:butterfly" class="text-2xl w-full h-full" />
    </div>
    <!-- Text Container -->
    <div class="flex-grow ml-4">
      <span class="font-semibold flex items-center">
        <icon name="mdi:chat" class="text-default mr-2 text-2xl" />
        <span class="text-default text-xl">{{ streamedText }}</span>
      </span>
    </div>
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
  },
)
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
