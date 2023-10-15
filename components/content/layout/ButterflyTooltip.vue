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
import { ref, computed, onMounted, watch } from 'vue'
import { errorHandler } from '@/server/api/utils/error'
import { usePageStore } from '@/stores/pageStore'

// Initialization
const pageStore = usePageStore()
const { page } = useContent()

const tooltipOpen = ref(false)
const streamedText = ref('')
let index = 0
let timer: number

// Toggle tooltip
const toggleTooltip = () => {
  if (!page.tooltip) {
    const errorInput = {
      success: false,
      message: 'No tooltip found.',
      statusCode: 404
    }
    errorHandler(errorInput)
    return
  }
  tooltipOpen.value = !tooltipOpen.value
}

// Start streaming tooltip text
const startStreaming = () => {
  if (page.tooltip) {
    timer = window.setInterval(() => {
      if (index < page.value.tooltip.length) {
        streamedText.value += page.value.tooltip[index]
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)
  } else {
    const errorInput = {
      success: false,
      message: 'No tooltip data available.',
      statusCode: 404
    }
    errorHandler(errorInput)
  }
}

// Lifecycle hook
onMounted(() => {
  if (page.value.tooltip) {
    startStreaming()
  }
})

// Watch for changes
watch(
  () => page.value?.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    index = 0
    if (page.value.tooltip) {
      startStreaming()
    }
  }
)
</script>

<style scoped>
.tooltip-popup {
  width: 50%;
  padding: 1rem;
  border-radius: 1rem;
  background-color: var(--bg-base-200);
}
</style>
