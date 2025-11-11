<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
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
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{
                  'border-base-300 bg-base-200/70':
                    targetSmartState === 'front',
                }"
                @click="setSmart('front')"
              >
                <Icon name="kind-icon:map" class="w-3 h-3 md:w-4 md:h-4" />
                <span class="hidden sm:inline">Map</span>
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{
                  'border-base-300 bg-base-200/70': targetSmartState === 'dash',
                }"
                @click="setSmart('dash')"
              >
                <Icon
                  name="kind-icon:dashboard"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
                <span class="hidden sm:inline">Dash</span>
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                :class="{
                  'border-base-300 bg-base-200/70': targetSmartState === 'back',
                }"
                @click="setSmart('back')"
              >
                <Icon
                  name="kind-icon:butterfly"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
                <span class="hidden sm:inline">Ami</span>
              </button>
            </div>
          </div>

          <div class="w-full overflow-x-auto">
            <smart-icons />
          </div>
        </div>
      </div>

      <div
        class="relative flex-1 min-h-0 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4"
      >
        <div class="prism-card w-full h-full">
          <div
            ref="prismInner"
            class="prism-inner w-full h-full rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden"
            :style="prismStyle"
            @transitionend="onTransitionEnd"
          >
            <div class="prism-face prism-face-front">
              <smart-front />
            </div>

            <div class="prism-face prism-face-dash">
              <smart-dash />
            </div>

            <div class="prism-face prism-face-back">
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
import { ref, computed, watch, onMounted } from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const targetSmartState = computed(() => displayStore.SmartState)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const stateOrder: SmartState[] = ['front', 'dash', 'back']

const currentSmartState = ref<SmartState>('front')
const currentAngle = ref(0)
const lastDirection = ref<1 | -1>(1)
const isAnimating = ref(false)

const prismStyle = computed(() => ({
  transform: `rotateY(${currentAngle.value}deg)`,
  transformOrigin: lastDirection.value === 1 ? 'right center' : 'left center',
}))

const setSmart = (next: SmartState) => {
  if (next === targetSmartState.value) return
  displayStore.setSmartState(next)
}

watch(
  targetSmartState,
  newState => {
    const from = currentSmartState.value

    if (!newState || newState === from || isAnimating.value) return

    const fromIndex = stateOrder.indexOf(from)
    const toIndex = stateOrder.indexOf(newState as SmartState)
    if (fromIndex === -1 || toIndex === -1) return

    const diff = (toIndex - fromIndex + stateOrder.length) % stateOrder.length
    if (diff === 0) return

    const step: 1 | -1 = diff === 1 ? 1 : -1
    lastDirection.value = step
    currentAngle.value += step * 120
    currentSmartState.value = newState as SmartState
    isAnimating.value = true
  },
  { immediate: true },
)

const onTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName !== 'transform') return
  isAnimating.value = false
}

onMounted(() => {
  const initial = targetSmartState.value
  if (initial && initial !== currentSmartState.value) {
    const fromIndex = stateOrder.indexOf(currentSmartState.value)
    const toIndex = stateOrder.indexOf(initial as SmartState)
    if (fromIndex !== -1 && toIndex !== -1) {
      const diff =
        (toIndex - fromIndex + stateOrder.length) % stateOrder.length
      if (diff !== 0) {
        const step: 1 | -1 = diff === 1 ? 1 : -1
        lastDirection.value = step
        currentAngle.value += step * 120
        currentSmartState.value = initial as SmartState
      }
    }
  }
})
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
  transition: transform 0.6s;
}

.prism-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.prism-face-front {
  transform: rotateY(0deg) translateZ(260px);
}

.prism-face-dash {
  transform: rotateY(120deg) translateZ(260px);
}

.prism-face-back {
  transform: rotateY(240deg) translateZ(260px);
}
</style>