<template>
  <section :style="tooltipPosition" class="relative">
    <!-- Image Banner -->
    <div v-if="page.image" class="w-full h-16 bg-cover bg-center" :style="imageStyle"></div>

    <!-- Tooltip Content -->
    <div
      class="tooltip tooltip-top p-4 mt-2 bg-white text-black border rounded-lg shadow-md default"
    ></div>

    <!-- Streaming Text Effect -->
    <div v-if="streamingText" class="mt-2">
      {{ streamingText }}
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  page: {
    type: Object,
    default: () => ({})
  }
})

const streamingText = ref('')

const tooltipPosition = computed(() => ({
  top: props.page.startHeight ? `${props.page.startHeight}vh` : 'auto',
  left: props.page.startWidth ? `${props.page.startWidth}vw` : 'auto'
}))

const imageStyle = computed(() => ({
  backgroundImage: `url('/images/${props.page.image}')`
}))

watch(
  () => props.page.tooltipData,
  (newValue) => {
    streamText(newValue)
  },
  { immediate: true }
)

const streamText = (text) => {
  let index = 0
  const interval = setInterval(() => {
    if (index < text.length) {
      streamingText.value += text.charAt(index)
      index++
    } else {
      clearInterval(interval)
    }
  }, 100) // Adjust the interval for typing speed
}
</script>
