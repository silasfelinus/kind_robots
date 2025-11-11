<!-- /components/navigation/smart-flip.vue -->
<template>
  <section class="relative w-full max-w-4xl h-[90%] mx-auto overflow-visible">
    <div class="flex flex-col w-full h-full">
      <div class="px-2 md:px-3 lg:px-4 pt-2">
        <div
          class="flex items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200/90 px-2.5 md:px-3.5 py-1.5 md:py-2"
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
                'border-base-300 bg-base-200/70': targetSmartState === 'front',
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
              <Icon name="kind-icon:butterfly" class="w-3 h-3 md:w-4 md:h-4" />
              <span class="hidden sm:inline">Ami</span>
            </button>
          </div>
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
            :style="{ transform: transformStyle }"
            @transitionend="onFlipTransitionEnd"
          >
            <div class="flip-side flip-front">
              <component :is="componentForState(frontFaceState)" />
            </div>

            <div class="flip-side flip-back">
              <component :is="componentForState(backFaceState)" />
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
const showingFront = ref(true)
const flipDirection = ref<1 | -1>(1)

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const targetSmartState = computed(() => displayStore.SmartState)

const visibleSmartState = ref<SmartState>('front')
const frontFaceState = ref<SmartState>('front')
const backFaceState = ref<SmartState>('back')
const pendingSmartState = ref<SmartState | null>(null)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const smartOrder: SmartState[] = ['front', 'dash', 'back']

const getDirection = (from: SmartState, to: SmartState): 1 | -1 => {
  const fromIndex = smartOrder.indexOf(from)
  const toIndex = smartOrder.indexOf(to)
  if (fromIndex === -1 || toIndex === -1) return 1
  const diff = (toIndex - fromIndex + smartOrder.length) % smartOrder.length
  if (diff === 0) return 1
  return diff === 1 ? 1 : -1
}

const componentForState = (state: SmartState) => {
  if (state === 'front') return 'smart-front'
  if (state === 'back') return 'smart-back'
  return 'smart-dash'
}

const transformStyle = computed(() => {
  if (!showingFront.value) {
    return flipDirection.value === 1 ? 'rotateY(180deg)' : 'rotateY(-180deg)'
  }
  return 'rotateY(0deg)'
})

const setSmart = (next: SmartState) => {
  if (next === targetSmartState.value) return
  displayStore.setSmartState(next)
}

watch(
  targetSmartState,
  (newState, oldState) => {
    const current = visibleSmartState.value
    const fromState = oldState ?? current

    if (newState === current || isAnimating.value) {
      return
    }

    const dir = getDirection(fromState as SmartState, newState as SmartState)
    flipDirection.value = dir
    pendingSmartState.value = newState as SmartState

    if (showingFront.value) {
      backFaceState.value = newState as SmartState
    } else {
      frontFaceState.value = newState as SmartState
    }

    isAnimating.value = true

    nextTick(() => {
      showingFront.value = !showingFront.value
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

  if (pendingSmartState.value) {
    visibleSmartState.value = pendingSmartState.value
    pendingSmartState.value = null

    if (showingFront.value) {
      frontFaceState.value = visibleSmartState.value
    } else {
      backFaceState.value = visibleSmartState.value
    }
  }
}

onMounted(() => {
  const initial = targetSmartState.value
  visibleSmartState.value = initial
  frontFaceState.value = initial
  backFaceState.value = initial

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
  transition: transform 0.6s;
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
  transform: rotateY(180deg);
}
</style>