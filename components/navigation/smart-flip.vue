<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
      <!-- Kind + Nav + Icons header -->
      <div class="px-2 md:px-3 lg:px-4 pt-2">
        <div
          class="w-full rounded-2xl border border-base-300 bg-base-200/90 px-2.5 md:px-3.5 py-1.5 md:py-2 flex flex-col gap-1.5 md:gap-2"
        >
          <div class="flex items-center justify-between gap-2 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="inline-flex items-center px-2 py-1 rounded-2xl border border-base-300 bg-base-100 text-[10px] md:text-xs font-semibold uppercase tracking-wide"
              >
                Kind
              </span>
              <h2
                class="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-base-content/90 truncate"
              >
                {{ title }}
              </h2>
            </div>

            <div class="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                v-for="state in states"
                :key="state.id"
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{
                  'border-base-300 bg-base-200/70': targetSmartState === state.id,
                }"
                @click="setSmart(state.id)"
              >
                <Icon :name="state.icon" class="w-3 h-3 md:w-4 md:h-4" />
                <span class="hidden sm:inline">{{ state.label }}</span>
              </button>
            </div>
          </div>

          <div class="w-full overflow-x-auto">
            <smart-icons />
          </div>
        </div>
      </div>

      <!-- Prism body -->
      <div class="relative flex-1 min-h-0 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4">
        <div class="prism-card w-full h-full">
          <div
            ref="prismInner"
            class="prism-inner w-full h-full rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden"
            :style="prismStyle"
            @transitionend="onTransitionEnd"
          >
            <div
              class="prism-face prism-front"
              :style="{ transform: `rotateY(0deg) translateZ(${translateZ}px)` }"
            >
              <smart-front />
            </div>
            <div
              class="prism-face prism-dash"
              :style="{ transform: `rotateY(120deg) translateZ(${translateZ}px)` }"
            >
              <smart-dash />
            </div>
            <div
              class="prism-face prism-back"
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const targetSmartState = computed(() => displayStore.SmartState)

const title = computed(() => pageStore.page?.title || pageStore.page?.room || 'Kind Room')

const states = [
  { id: 'front', label: 'Map', icon: 'kind-icon:map' },
  { id: 'dash', label: 'Dash', icon: 'kind-icon:dashboard' },
  { id: 'back', label: 'Ami', icon: 'kind-icon:butterfly' },
]

const prismInner = ref<HTMLElement | null>(null)
const currentSmartState = ref<SmartState>('front')
const currentAngle = ref(0)
const translateZ = ref(0)
const isAnimating = ref(false)

const stateOrder: SmartState[] = ['front', 'dash', 'back']

// core rotation style
const prismStyle = computed(() => ({
  transform: `rotateY(${currentAngle.value}deg)`,
  transformOrigin: 'center center',
  transition: isAnimating.value ? 'transform 0.8s ease-in-out' : 'none',
}))

onMounted(() => {
  nextTick(() => {
    if (prismInner.value) {
      const w = prismInner.value.offsetWidth
      // correct inscribed circle radius for equilateral triangle
      translateZ.value = w / (2 * Math.tan(Math.PI / 3))
      console.log('translateZ for centered prism:', translateZ.value.toFixed(2))
    }
  })
})

const setSmart = (next: SmartState) => {
  if (next === targetSmartState.value) return
  displayStore.setSmartState(next)
}

watch(targetSmartState, newState => {
  if (!newState || newState === currentSmartState.value || isAnimating.value) return
  const fromIndex = stateOrder.indexOf(currentSmartState.value)
  const toIndex = stateOrder.indexOf(newState as SmartState)
  if (fromIndex === -1 || toIndex === -1) return

  const diff = (toIndex - fromIndex + stateOrder.length) % stateOrder.length
  const step: 1 | -1 = diff === 1 ? 1 : -1
  // rotate opposite to bring new face forward
  currentAngle.value += -step * 120
  currentSmartState.value = newState as SmartState
  isAnimating.value = true
})

const onTransitionEnd = (e: TransitionEvent) => {
  if (e.propertyName !== 'transform') return
  isAnimating.value = false
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
}
</style>