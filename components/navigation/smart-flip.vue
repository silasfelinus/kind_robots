<!-- /components/navigation/smart-flip.vue -->
<template>
  <section
    class="relative w-full max-w-4xl h-[90%] mx-auto rounded-3xl border-2 border-black bg-base-100/95 shadow-xl overflow-hidden"
  >
    <div class="flip-card w-full h-full">
      <div
        ref="flipInner"
        class="flip-card-inner w-full h-full"
        :class="{
          'is-flipped': isAnimating ? animFlipped : flipped,
          'is-animating': isAnimating,
        }"
        @transitionend="onFlipTransitionEnd"
      >
        <div
          class="flip-side flip-front"
          :class="{
            'flip-static-visible': !isAnimating && !flipped,
            'flip-static-hidden': !isAnimating && flipped,
          }"
        >
          <div class="relative flex flex-col w-full h-full bg-base-100/95">
            <div v-if="pageIcon" class="corner-icon corner-icon-tl">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-tr">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-bl">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-br">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div class="relative z-10 flex-1 min-h-0">
              <div
                ref="frontScrollRef"
                class="smart-scroll-container w-full h-full overflow-y-auto"
                @scroll="updateScrollState('front')"
              >
                <div
                  class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-2 md:gap-3"
                >
                  <div
                    class="flex items-center justify-between gap-2 mb-1 md:mb-2 lg:mb-3 xl:mb-4"
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
                        v-if="!flipped && !isAnimating"
                        type="button"
                        class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                        @click="setAmiSide"
                      >
                        <Icon
                          name="kind-icon:butterfly"
                          class="w-3 h-3 md:w-4 md:h-4"
                        />
                        <span class="hidden sm:inline">Ami</span>
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 md:gap-3">
                    <div class="w-full">
                      <smart-image />
                    </div>

                    <div class="w-full">
                      <smart-buttons />
                    </div>

                    <div class="w-full">
                      <smart-panel />
                    </div>
                  </div>
                </div>
              </div>

              <button
                v-if="frontCanScrollUp"
                type="button"
                class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                @click.stop="scrollBy('front', 'up')"
              >
                <Icon
                  name="kind-icon:chevron-up"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
              </button>

              <button
                v-if="frontCanScrollDown"
                type="button"
                class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                @click.stop="scrollBy('front', 'down')"
              >
                <Icon
                  name="kind-icon:chevron-down"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
              </button>
            </div>
          </div>
        </div>

        <div
          class="flip-side flip-back"
          :class="{
            'flip-static-visible': !isAnimating && flipped,
            'flip-static-hidden': !isAnimating && !flipped,
          }"
        >
          <div class="relative flex flex-col w-full h-full bg-base-100/95">
            <div v-if="pageIcon" class="corner-icon corner-icon-tl">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-tr">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-bl">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div v-if="pageIcon" class="corner-icon corner-icon-br">
              <Icon :name="pageIcon" class="corner-icon-inner text-primary" />
            </div>

            <div class="relative z-10 flex-1 min-h-0">
              <div
                ref="backScrollRef"
                class="smart-scroll-container w-full h-full overflow-y-auto"
                @scroll="updateScrollState('back')"
              >
                <div
                  class="flex flex-col w-full min-h-full p-2 md:p-3 lg:p-4 xl:p-5 gap-2 md:gap-3"
                >
                  <div
                    class="flex items-center justify-between gap-2 mb-1 md:mb-2 lg:mb-3 xl:mb-4"
                  >
                    <div class="flex items-center gap-1 md:gap-2">
                      <button
                        v-if="flipped && !isAnimating"
                        type="button"
                        class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs flex items-center gap-1"
                        @click="setMapSide"
                      >
                        <Icon
                          name="kind-icon:map"
                          class="w-3 h-3 md:w-4 md:h-4"
                        />
                        <span class="hidden sm:inline">Map</span>
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 md:gap-3 flex-1 min-h-0">
                    <div class="w-full">
                      <title-card />
                    </div>

                    <div class="w-full">
                      <smart-image />
                    </div>

                    <div class="flex-1 min-h-0">
                      <ami-chat class="w-full h-full" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                v-if="backCanScrollUp"
                type="button"
                class="absolute right-2 top-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                @click.stop="scrollBy('back', 'up')"
              >
                <Icon
                  name="kind-icon:chevron-up"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
              </button>

              <button
                v-if="backCanScrollDown"
                type="button"
                class="absolute right-2 bottom-2 z-20 rounded-full border border-base-300 bg-base-200/80 px-1 py-[2px] text-base-content/70"
                @click.stop="scrollBy('back', 'down')"
              >
                <Icon
                  name="kind-icon:chevron-down"
                  class="w-3 h-3 md:w-4 md:h-4"
                />
              </button>
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
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const flipInner = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const animFlipped = ref(false)

const frontScrollRef = ref<HTMLElement | null>(null)
const backScrollRef = ref<HTMLElement | null>(null)

const frontCanScrollUp = ref(false)
const frontCanScrollDown = ref(false)
const backCanScrollUp = ref(false)
const backCanScrollDown = ref(false)

const pageStore = usePageStore()
const displayStore = useDisplayStore()

const flipped = computed(() => displayStore.SmartState === 'ami')

const pageIcon = computed(() => pageStore.page?.icon)
const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)

const setMapSide = () => {
  displayStore.SmartState = 'map'
}

const setAmiSide = () => {
  displayStore.SmartState = 'ami'
}

const updateScrollState = (side: 'front' | 'back') => {
  const el = side === 'front' ? frontScrollRef.value : backScrollRef.value
  if (!el) return

  const canUp = el.scrollTop > 2
  const canDown = el.scrollTop + el.clientHeight < el.scrollHeight - 2

  if (side === 'front') {
    frontCanScrollUp.value = canUp
    frontCanScrollDown.value = canDown
  } else {
    backCanScrollUp.value = canUp
    backCanScrollDown.value = canDown
  }
}

const refreshScrollStates = () => {
  nextTick(() => {
    updateScrollState('front')
    updateScrollState('back')
  })
}

watch(
  () => displayStore.SmartState,
  (newState, oldState) => {
    if (isAnimating.value) return

    const prevFlipped = oldState === 'ami'
    const nextFlipped = newState === 'ami'

    if (prevFlipped === nextFlipped) {
      refreshScrollStates()
      return
    }

    isAnimating.value = true
    animFlipped.value = prevFlipped

    nextTick(() => {
      if (flipInner.value) {
        void flipInner.value.offsetWidth
      }
      animFlipped.value = nextFlipped
      refreshScrollStates()
    })
  },
)

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (!isAnimating.value || event.propertyName !== 'transform') return
  isAnimating.value = false
  refreshScrollStates()
}

const scrollBy = (side: 'front' | 'back', direction: 'up' | 'down') => {
  const el = side === 'front' ? frontScrollRef.value : backScrollRef.value
  if (!el) return

  const delta = el.clientHeight * 0.6 * (direction === 'up' ? -1 : 1)
  el.scrollBy({ top: delta, behavior: 'smooth' })
}

onMounted(() => {
  refreshScrollStates()
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-inner.is-animating {
  transform-origin: center;
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

.flip-side > * {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-back {
  transform: rotateY(180deg);
}

.flip-static-visible {
  display: block !important;
}

.flip-static-hidden {
  display: none !important;
}

.smart-scroll-container {
  scrollbar-width: none;
}

.smart-scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.corner-icon {
  position: absolute;
  width: clamp(4rem, 7vw, 6rem);
  height: clamp(4rem, 7vw, 6rem);
  opacity: 0.4;
  pointer-events: none;
}

.corner-icon-inner {
  width: 100%;
  height: 100%;
}

.corner-icon-tl {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
}

.corner-icon-tr {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
}

.corner-icon-bl {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
}

.corner-icon-br {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
}

.corner-icon-bl .corner-icon-inner {
  transform: rotate(6deg);
}

.corner-icon-br .corner-icon-inner {
  transform: rotate(-6deg);
}
</style>
