<!-- /components/content/icons/smart-flip.vue -->
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
            <div
              v-if="pageIcon"
              class="pointer-events-none absolute -bottom-10 -left-10 sm:-bottom-14 sm:-left-14 lg:-bottom-16 lg:-left-16 opacity-20 rotate-6"
            >
              <Icon
                :name="pageIcon"
                class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
              />
            </div>

            <div
              v-if="pageIcon"
              class="pointer-events-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 lg:-bottom-16 lg:-right-16 opacity-20 -rotate-6"
            >
              <Icon
                :name="pageIcon"
                class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
              />
            </div>

            <div
              class="relative z-10 flex flex-col w-full h-full p-2 md:p-3 lg:p-4 xl:p-5"
            >
              <div
                class="flex items-center justify-between gap-2 mb-2 md:mb-3 lg:mb-4"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-2xl border border-base-300 bg-base-100 text-[10px] md:text-xs font-semibold uppercase tracking-wide"
                  >
                    Kind
                  </span>

                  <h2
                    class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-base-content/90 truncate"
                  >
                    {{ title }}
                  </h2>
                </div>

                <div class="flex items-center gap-1 md:gap-2">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs"
                    :class="{
                      'btn-active bg-primary text-primary-content':
                        !flipped && !isAnimating,
                    }"
                    @click="setMapSide"
                  >
                    Map
                  </button>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs"
                    :class="{
                      'btn-active bg-secondary text-secondary-content':
                        flipped && !isAnimating,
                    }"
                    @click="setAmiSide"
                  >
                    Ami
                  </button>
                </div>
              </div>

              <div class="flex-1 min-h-0 flex flex-col gap-2 md:gap-3">
                <div class="w-full">
                  <smart-image />
                </div>

                <div class="w-full">
                  <smart-buttons />
                </div>

                <div class="flex-1 min-h-0">
                  <div class="w-full h-full overflow-y-auto rounded-2xl">
                    <smart-panel />
                  </div>
                </div>
              </div>
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
            <div
              v-if="pageIcon"
              class="pointer-events-none absolute -bottom-10 -left-10 sm:-bottom-14 sm:-left-14 lg:-bottom-16 lg:-left-16 opacity-20 rotate-6"
            >
              <Icon
                :name="pageIcon"
                class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
              />
            </div>

            <div
              v-if="pageIcon"
              class="pointer-events-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 lg:-bottom-16 lg:-right-16 opacity-20 -rotate-6"
            >
              <Icon
                :name="pageIcon"
                class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
              />
            </div>

            <div
              class="relative z-10 flex flex-col w-full h-full p-2 md:p-3 lg:p-4 xl:p-5"
            >
              <div
                class="flex items-center justify-between gap-2 mb-2 md:mb-3 lg:mb-4"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-2xl border border-base-300 bg-base-100 text-[10px] md:text-xs font-semibold uppercase tracking-wide"
                  >
                    Kind
                  </span>

                  <h2
                    class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-base-content/90 truncate"
                  >
                    {{ title }}
                  </h2>
                </div>

                <div class="flex items-center gap-1 md:gap-2">
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs"
                    :class="{
                      'btn-active bg-primary text-primary-content':
                        !flipped && !isAnimating,
                    }"
                    @click="setMapSide"
                  >
                    Map
                  </button>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-full px-2 md:px-3 text-[10px] md:text-xs"
                    :class="{
                      'btn-active bg-secondary text-secondary-content':
                        flipped && !isAnimating,
                    }"
                    @click="setAmiSide"
                  >
                    Ami
                  </button>
                </div>
              </div>

              <div class="flex-1 min-h-0 flex flex-col">
                <div class="w-full mb-2 md:mb-3 lg:mb-4">
                  <title-card />
                </div>

                <div class="w-full mb-2 md:mb-3 lg:mb-4">
                  <smart-image />
                </div>

                <div class="flex-1 min-h-0">
                  <div class="w-full h-full overflow-y-auto rounded-2xl">
                    <ami-chat class="h-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/icons/smart-flip.vue
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const flipInner = ref<HTMLElement | null>(null)
const isAnimating = ref(false)
const animFlipped = ref(false)

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

watch(
  () => displayStore.SmartState,
  (newState, oldState) => {
    if (isAnimating.value) return

    const prevFlipped = oldState === 'ami'
    const nextFlipped = newState === 'ami'

    if (prevFlipped === nextFlipped) return

    isAnimating.value = true
    animFlipped.value = prevFlipped

    nextTick(() => {
      if (flipInner.value) {
        void flipInner.value.offsetWidth
      }
      animFlipped.value = nextFlipped
    })
  },
)

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (!isAnimating.value || event.propertyName !== 'transform') return
  isAnimating.value = false
}
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
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-inner.is-animating {
  transform-origin: center;
}

.flip-card-inner.is-animating .flip-side {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-side {
  width: 100%;
  height: 100%;
}

.flip-back {
  transform: rotateY(180deg);
}

.flip-static-visible {
  display: block;
}

.flip-static-hidden {
  display: none;
}
</style>