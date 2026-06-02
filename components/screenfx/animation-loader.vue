<!-- /components/content/story/animation-loader.vue -->
<template>
  <div
    v-if="animationStore.isActive || isFading"
    class="effect-container"
    :class="{ 'fade-out': isFading }"
    :style="containerStyle"
  >
    <component
      :is="currentComponent"
      v-if="currentComponent"
      class="absolute inset-0 z-50 h-full w-full"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/animation-loader.vue
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
  type CSSProperties,
} from 'vue'
import { useAnimationStore } from '@/stores/animationStore'

type EffectId =
  | 'bubble-effect'
  | 'fizzy-bubbles'
  | 'rain-effect'
  | 'butterfly-animation'

type EffectLayout = 'fullscreen' | 'surface'

type EffectDefinition = {
  component: Component
  layout: EffectLayout
}

const props = withDefaults(
  defineProps<{
    surfaceSelector?: string
  }>(),
  {
    surfaceSelector:
      '[data-animation-surface], [data-debug="dashboard-content"], [data-debug="layout-main"], main',
  },
)

const animationStore = useAnimationStore()

const LazyBubbleEffect = defineAsyncComponent(
  () => import('@/components/screenfx/bubble-effect.vue'),
)
const LazyFizzyBubbles = defineAsyncComponent(
  () => import('@/components/screenfx/fizzy-bubbles.vue'),
)
const LazyRainEffect = defineAsyncComponent(
  () => import('@/components/screenfx/rain-effect.vue'),
)
const LazyButterflyAnimation = defineAsyncComponent(
  () => import('@/components/screenfx/butterfly-animation.vue'),
)

const effectMap: Record<EffectId, EffectDefinition> = {
  'bubble-effect': {
    component: LazyBubbleEffect,
    layout: 'fullscreen',
  },
  'fizzy-bubbles': {
    component: LazyFizzyBubbles,
    layout: 'fullscreen',
  },
  'rain-effect': {
    component: LazyRainEffect,
    layout: 'fullscreen',
  },
  'butterfly-animation': {
    component: LazyButterflyAnimation,
    layout: 'surface',
  },
}

const isFading = ref(false)
const surfaceRect = ref<DOMRect | null>(null)

let fadeTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null

const activeEffectId = computed<EffectId | null>(() => {
  const id = animationStore.activeEffect?.id
  return isEffectId(id) ? id : null
})

const activeEffectDefinition = computed<EffectDefinition | null>(() => {
  const id = activeEffectId.value
  if (!id) return null
  return effectMap[id] ?? null
})

const currentComponent = computed(() => {
  return activeEffectDefinition.value?.component ?? null
})

const activeLayout = computed<EffectLayout>(() => {
  return activeEffectDefinition.value?.layout ?? 'fullscreen'
})

const containerStyle = computed<CSSProperties>(() => {
  if (activeLayout.value === 'fullscreen') {
    return {
      inset: '0',
      height: '100dvh',
      width: '100vw',
    }
  }

  const rect = surfaceRect.value

  if (!rect) {
    return {
      inset: '0',
      height: '100dvh',
      width: '100vw',
    }
  }

  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

function isEffectId(value: unknown): value is EffectId {
  return (
    value === 'bubble-effect' ||
    value === 'fizzy-bubbles' ||
    value === 'rain-effect' ||
    value === 'butterfly-animation'
  )
}

function getSurfaceElement(): Element | null {
  if (typeof document === 'undefined') return null
  return document.querySelector(props.surfaceSelector)
}

function measureSurface() {
  if (typeof window === 'undefined') return

  const element = getSurfaceElement()

  if (!element) {
    surfaceRect.value = null
    return
  }

  surfaceRect.value = element.getBoundingClientRect()
}

async function attachSurfaceObserver() {
  await nextTick()

  resizeObserver?.disconnect()
  resizeObserver = null

  const element = getSurfaceElement()
  if (!element) {
    surfaceRect.value = null
    return
  }

  resizeObserver = new ResizeObserver(() => {
    measureSurface()
  })

  resizeObserver.observe(element)
  measureSurface()
}

watch(
  () => animationStore.isActive,
  async (isActive) => {
    if (fadeTimer) {
      clearTimeout(fadeTimer)
      fadeTimer = null
    }

    if (isActive) {
      isFading.value = false
      await attachSurfaceObserver()
      return
    }

    isFading.value = true
    fadeTimer = setTimeout(() => {
      isFading.value = false
    }, 1000)
  },
)

watch(
  () => activeLayout.value,
  async () => {
    await attachSurfaceObserver()
  },
)

onMounted(async () => {
  await attachSurfaceObserver()

  window.addEventListener('resize', measureSurface, { passive: true })
  window.addEventListener('orientationchange', measureSurface, {
    passive: true,
  })
  window.visualViewport?.addEventListener('resize', measureSurface, {
    passive: true,
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (fadeTimer) {
    clearTimeout(fadeTimer)
    fadeTimer = null
  }

  if (typeof window === 'undefined') return

  window.removeEventListener('resize', measureSurface)
  window.removeEventListener('orientationchange', measureSurface)
  window.visualViewport?.removeEventListener('resize', measureSurface)
})
</script>

<style scoped>
.effect-container {
  pointer-events: none;
  position: fixed;
  z-index: 9000;
  overflow: hidden;
  opacity: 1;
  transition: opacity 1s ease;
}

.effect-container.fade-out {
  opacity: 0;
}
</style>
