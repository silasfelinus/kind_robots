<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
      <div class="px-2 md:px-3 lg:px-4 pt-2">
        <div class="w-full rounded-2xl border border-base-300 bg-base-200/90 px-2.5 md:px-3.5 py-1.5 md:py-2 flex flex-col gap-1.5 md:gap-2">
          <div class="flex items-center justify-between gap-2 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span class="inline-flex items-center px-2 py-1 rounded-2xl border border-base-300 bg-base-100 text-[10px] md:text-xs font-semibold uppercase tracking-wide">
                Kind
              </span>
              <h2 class="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-base-content/90 truncate">
                {{ title }}
              </h2>
            </div>

            <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                v-for="state in states"
                :key="state.id"
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{ 'border-base-300 bg-base-200/70': targetSmartState === state.id }"
                @click="setSmart(state.id)"
              >
                <Icon :name="state.icon" class="w-3 h-3 md:w-4 md:h-4" />
                <span class="hidden sm:inline">{{ state.label }}</span>
              </button>
            </div>
          </div>

          <div v-if="bigMode" class="w-full overflow-x-auto">
            <smart-icons />
          </div>
        </div>
      </div>

      <div class="relative flex-1 min-h-0 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
        <div class="prism-card w-full h-full">
          <div
            ref="prismInner"
            class="prism-inner w-full h-full rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden"
            :style="prismStyle"
            @transitionend="onTransitionEnd"
          >
            <div
              class="prism-face"
              :class="{ 'prism-face-active': currentSmartState === 'front' }"
              :style="{ transform: `rotateY(0deg) translateZ(${translateZ}px)` }"
            >
              <smart-front />
            </div>

            <div
              class="prism-face"
              :class="{ 'prism-face-active': currentSmartState === 'dash' }"
              :style="{ transform: `rotateY(120deg) translateZ(${translateZ}px)` }"
            >
              <smart-dash />
            </div>

            <div
              class="prism-face"
              :class="{ 'prism-face-active': currentSmartState === 'back' }"
              :style="{ transform: `rotateY(240deg) translateZ(${translateZ}px)` }"
            >
              <smart-back />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-flip.vue
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  type CSSProperties,
} from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const bigMode = computed(() => displayStore.bigMode)
const targetSmartState = computed<SmartState>(() => displayStore.SmartState)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const states: { id: SmartState; label: string; icon: string }[] = [
  { id: 'front', label: 'Map', icon: 'kind-icon:map' },
  { id: 'dash', label: 'Dash', icon: 'kind-icon:dashboard' },
  { id: 'back', label: 'Ami', icon: 'kind-icon:butterfly' },
]

const prismInner = ref<HTMLElement | null>(null)
const currentSmartState = ref<SmartState>('front')
const currentAngle = ref(0)
const translateZ = ref(0)
const isAnimating = ref(false)
const ro = ref<ResizeObserver | null>(null)

const stateOrder: SmartState[] = ['front', 'dash', 'back']

const prismStyle = computed<CSSProperties>(() => ({
  transform: `rotateY(${currentAngle.value}deg)`,
  transformOrigin: 'center center',
  transition: isAnimating.value ? 'transform 0.8s ease-in-out' : 'none',
  willChange: 'transform',
}))

function polygonInradius(side: number, sides: number) {
  return side / (2 * Math.tan(Math.PI / sides))
}

function measureFaceWidth() {
  if (!prismInner.value) return 0
  const face = prismInner.value.querySelector<HTMLElement>('.prism-face')
  if (!face) return 0
  const rect = face.getBoundingClientRect()
  return Math.max(0, rect.width)
}

function updateTranslateZ() {
  const w = measureFaceWidth()
  const r = polygonInradius(w, 3)
  if (!Number.isFinite(r) || r <= 0) {
    console.warn('[smart-flip] bad radius', { width: w, radius: r })
    translateZ.value = 0
    return
  }
  translateZ.value = r
  console.info('[smart-flip] translateZ updated', {
    width: w,
    radius: r,
    perspective: getComputedStyle(document.documentElement).getPropertyValue('--unused'),
  })
}

function ensureFirstLayout() {
  updateTranslateZ()
  console.info('[smart-flip] initial angle/state', {
    angle: currentAngle.value,
    current: currentSmartState.value,
    target: targetSmartState.value,
  })
}

onMounted(async () => {
  await nextTick()
  ensureFirstLayout()

  if (prismInner.value) {
    ro.value = new ResizeObserver(() => {
      updateTranslateZ()
    })
    ro.value.observe(prismInner.value)
  }

  window.addEventListener('resize', updateTranslateZ)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTranslateZ)
  if (ro.value && prismInner.value) {
    ro.value.unobserve(prismInner.value)
  }
  ro.value = null
})

function setSmart(next: SmartState) {
  if (next === targetSmartState.value) return
  displayStore.setSmartState(next)
  console.info('[smart-flip] setSmart invoked', { next })
}

watch(
  targetSmartState,
  newState => {
    if (!newState || newState === currentSmartState.value || isAnimating.value) {
      return
    }

    const fromIndex = stateOrder.indexOf(currentSmartState.value)
    const toIndex = stateOrder.indexOf(newState as SmartState)
    if (fromIndex === -1 || toIndex === -1) return

    const diff = (toIndex - fromIndex + stateOrder.length) % stateOrder.length
    if (diff === 0) return

    const step: 1 | -1 = diff === 1 ? 1 : -1
    isAnimating.value = true
    const delta = -step * 120
    currentAngle.value += delta
    console.info('[smart-flip] rotating', {
      from: currentSmartState.value,
      to: newState,
      step,
      delta,
      angle: currentAngle.value,
      translateZ: translateZ.value,
    })
    currentSmartState.value = newState as SmartState
  },
  { immediate: true },
)

function onTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  isAnimating.value = false
  console.info('[smart-flip] transition end', {
    angle: currentAngle.value,
    state: currentSmartState.value,
  })
}
</script>

<style scoped>
.prism-card {
  perspective: 1200px;
  width: 100%;
  height: 100%;
}

.prism-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.prism-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  display: flex;
  pointer-events: none;
}

.prism-face-active {
  pointer-events: auto;
}
</style>