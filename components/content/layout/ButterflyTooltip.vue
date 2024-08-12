<template>
  <div class="fixed bottom-4 right-4" @click="toggleTooltip">
    <!-- Pulsing Butterfly Icon -->
    <div v-if="!tooltipOpen && page.tooltip" class="cursor-pointer">
      <icon name="ph:butterfly-duotone" class="text-3xl animate-pulse" />
    </div>

    <!-- Tooltip Popup -->
    <div
      v-else-if="tooltipOpen && page.tooltip"
      class="tooltip-popup bg-base-200 p-4 rounded-2xl border"
    >
      <div v-if="page.tooltip">
        <span class="font-semibold">
          <butterfly-loader />
          <icon name="mdi:chat" class="text-default mr-2 text-2xl" />AMI Says:
          <!-- Using streamedText without .value as ref unwraps itself in template -->
          <span class="text-default text-xl">{{ streamedText }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useErrorStore } from '@/stores/errorStore'

// Initialization
const errorStore = useErrorStore() // Initialize errorStore
const { page } = useContent()

const tooltipOpen = ref(false)
const streamedText = ref('')
let index = 0
let timer: number

// Toggle tooltip
const toggleTooltip = () => {
  if (!page.tooltip) {
    errorStore.setError(ErrorType.GENERAL_ERROR, 'No tooltip found.')
    return
  }
  tooltipOpen.value = !tooltipOpen.value
}

// Start streaming tooltip text
const startStreaming = () => {
  if (page.tooltip) {
    timer = window.setInterval(() => {
      if (index < page.tooltip.length) {
        streamedText.value += page.tooltip[index]
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)
  } else {
    errorStore.setError(ErrorType.GENERAL_ERROR, 'No tooltip data available.')
  }
}

// Lifecycle hook
onMounted(() => {
  if (page.tooltip) {
    startStreaming()
  }
})

// Watch for changes
watch(
  () => page.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    index = 0
    if (page.tooltip) {
      startStreaming()
    }
  },
)
</script>
