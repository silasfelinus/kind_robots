<template>
  <img
    ref="imageElement"
    :key="visualSrc"
    :src="visualSrc"
    alt="Kind Robots"
    class="loading-logo"
    :class="{ 'loading-logo--ready': visualReady }"
    width="720"
    height="720"
    loading="eager"
    fetchpriority="high"
    decoding="async"
    @load="handleVisualLoad"
    @error="useLogoFallback"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

type IntroVisualKind = 'logo' | 'animation'

const emit = defineEmits<{
  settled: [kind: IntroVisualKind]
}>()

const ANIMATION_SRC = '/images/startup-animations/launch-04.webp'
const LOGO_SRC = '/images/kindlogo_new.webp'

const imageElement = ref<HTMLImageElement | null>(null)
const visualSrc = ref(ANIMATION_SRC)
const visualReady = ref(false)

let settledEmitted = false

function emitSettled(kind: IntroVisualKind): void {
  if (settledEmitted) return
  settledEmitted = true
  emit('settled', kind)
}

function handleVisualLoad(): void {
  visualReady.value = true
  emitSettled(visualSrc.value === ANIMATION_SRC ? 'animation' : 'logo')
}

function useLogoFallback(): void {
  if (visualSrc.value === LOGO_SRC) {
    emitSettled('logo')
    return
  }

  visualReady.value = false
  visualSrc.value = LOGO_SRC
}

onMounted(() => {
  if (imageElement.value?.complete && imageElement.value.naturalWidth > 0) {
    handleVisualLoad()
  }
})
</script>
