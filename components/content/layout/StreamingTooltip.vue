<template>
  <div class="tooltip-container bg-secondary text-white p-2 rounded">
    <span>Silas Says: {{ streamedText }}</span>
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
  /* Add your styling here */
}
</style>
