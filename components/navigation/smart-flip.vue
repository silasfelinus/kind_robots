<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
      <div
        class="flex items-center justify-between gap-2 px-2 md:px-3 lg:px-4 py-1.5 md:py-2"
      >
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

        <div class="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
            :class="{
              'border-base-300 bg-base-200/70': smartState === 'front',
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
              'border-base-300 bg-base-200/70': smartState === 'back',
            }"
            @click="setSmart('back')"
          >
            <Icon
              name="kind-icon:butterfly"
              class="w-3 h-3 md:w-4 md:h-4"
            />
            <span class="hidden sm:inline">Ami</span>
          </button>

          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
            :class="{
              'border-base-300 bg-base-200/70': smartState === 'dash',
            }"
            @click="setSmart('dash')"
          >
            <Icon name="kind-icon:dashboard" class="w-3 h-3 md:w-4 md:h-4" />
            <span class="hidden sm:inline">Dash</span>
          </button>
        </div>
      </div>

      <div
        class="w-full mb-1 md:mb-2 lg:mb-3 xl:mb-4 px-2 md:px-3 lg:px-4 overflow-x-auto"
      >
        <smart-icons />
      </div>

      <div
        class="relative flex-1 min-h-0 px-2 md:px-3 lg:px-4 pb-2 md:pb-3 lg:pb-4"
      >
        <div class="flip-card w-full h-full">
          <div
            ref="flipInner"
            class="flip-card-inner w-full h-full rounded-3xl border-2 border-black shadow-xl bg-base-100/95 overflow-hidden"
            :style="{ transform: `rotateY(${rotation}deg)` }"
            @transitionend="onFlipTransitionEnd"
          >
            <div class="flip-side flip-front">
              <smart-front />
            </div>

            <div class="flip-side flip-back">
              <smart-back />
            </div>

            <div class="flip-side flip-dash">
              <smart-dash />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/navigation/smart-flip.vue
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Icon } from '#components'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import type { SmartState } from '@/stores/helpers/displayHelper'

const flipInner = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const rotation = ref(0)

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const smartState = computed(() => displayStore.SmartState)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const indexForState = (state: SmartState): number => {
  if (state === 'front') return 0
  if (state === 'back') return 1
  return 2
}

const currentIndex = ref(indexForState(smartState.value))

const setSmart = (next: SmartState) => {
  if (next === smartState.value) return
  displayStore.setSmartState(next)
}

watch(
  smartState,
  (newState, oldState) => {
    if (!oldState) {
      const initialIndex = indexForState(newState)
      currentIndex.value = initialIndex
      rotation.value = initialIndex * 120
      return
    }

    const nextIndex = indexForState(newState)
    const prevIndex = currentIndex.value

    if (nextIndex === prevIndex) return

    let delta = nextIndex - prevIndex
    if (delta === 2) delta = -1
    else if (delta === -2) delta = 1

    rotation.value += delta * 120
    currentIndex.value = nextIndex
    isAnimating.value = true

    nextTick(() => {
      if (flipInner.value) {
        void flipInner.value.offsetWidth
      }
    })
  },
  { immediate: true },
)

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (event.propertyName !== 'transform') return
  isAnimating.value = false
}

onMounted(() => {
  if (flipInner.value) {
    void flipInner.value.offsetWidth
  }
})
</script>

<style scoped>
.flip-card {
  perspective: 1200px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.7s;
}

.flip-side {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.flip-front {
  transform: rotateY(0deg);
}

.flip-back {
  transform: rotateY(120deg);
}

.flip-dash {
  transform: rotateY(240deg);
}
</style>
