<template>
  <!-- Transparent Overlay with Button Instruction -->
  <div class="relative w-full h-full">
    <div
      v-if="!butterfliesExist"
      class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
    >
      <p class="text-white text-lg text-center">
        Press the button to start animations
      </p>
    </div>

    <!-- Canvas Element -->
    <canvas
      ref="butterflyCanvas"
      class="absolute inset-0"
      :style="{
        height: canvasHeight,
        width: canvasWidth,
        top: headerAndPaddingHeight,
        right: sidebarRightOpen ? sidebarRightWidthWithPadding : sectionPadding,
      }"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()

// Canvas size based on display store
const canvasHeight = computed(() => displayStore.mainContentHeight)
const canvasWidth = computed(() => displayStore.mainContentWidth)

// Pre-calculated properties for layout
const headerAndPaddingHeight = computed(() => displayStore.headerStyle.height)
const sectionPadding = computed(() => displayStore.sectionPaddingVw)
const sidebarRightWidthWithPadding = computed(() =>
  displayStore.sidebarRightVisible
    ? `calc(${displayStore.sidebarRightWidth} + ${sectionPadding.value})`
    : sectionPadding.value,
)
const sidebarRightOpen = computed(() => displayStore.sidebarRightVisible)

// Check if butterflies exist to toggle fallback message
const butterfliesExist = computed(() => butterflyStore.butterflies.length > 0)

// Render butterflies on canvas
const renderButterflies = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw each butterfly
  butterflyStore.butterflies.forEach((butterfly) => {
    ctx.save()
    ctx.translate(butterfly.x, butterfly.y)
    ctx.rotate((butterfly.rotation * Math.PI) / 180)
    ctx.scale(butterfly.scale, butterfly.scale)
    ctx.fillStyle = butterfly.wingTopColor
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

// Watch for changes in butterflies and re-render
watch(() => butterflyStore.butterflies, renderButterflies, { deep: true })

onMounted(() => {
  renderButterflies()
})
</script>
