<template>
  <div class="fixed bottom-4 right-4" @click="toggleTooltip">
    <!-- Pulsing Butterfly Icon -->
    <div v-if="!tooltipOpen && tooltipExists" class="cursor-pointer">
      <icon name="ph:butterfly-duotone" class="text-3xl animate-pulse" />
    </div>

    <!-- Tooltip Popup -->
    <div
      v-else-if="tooltipOpen && tooltipExists"
      class="tooltip-popup bg-base-200 p-4 rounded-2xl border"
    >
      <div>
        <span class="font-semibold">
          <icon name="mdi:chat" class="text-default mr-2 text-2xl" />Silas Says:
          <span class="text-default text-xl">{{ streamedText }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { errorHandler } from '@/server/api/utils/error'
const { page } = useContent()

const tooltipExists = ref(!!page.tooltip)
const tooltipOpen = ref(false)
const streamedText = ref('')
let index = 0
let timer: number

const toggleTooltip = () => {
  if (!tooltipExists.value) {
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

const startStreaming = () => {
  timer = window.setInterval(() => {
    if (index < page.tooltip.length) {
      streamedText.value += page.tooltip[index]
      index++
    } else {
      clearInterval(timer)
    }
  }, 50)
}

onMounted(() => {
  if (tooltipExists.value) {
    startStreaming()
  }
})

watch(
  () => page.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    index = 0
    tooltipExists.value = !!page.tooltip
    if (tooltipExists.value) {
      startStreaming()
    }
  }
)
</script>

<style scoped>
.tooltip-popup {
  width: 33%;
  padding: 1rem;
  border-radius: 1rem;
  background-color: var(--bg-base-200);
}
</style>
