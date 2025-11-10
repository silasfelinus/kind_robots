<!-- /components/content/icons/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full rounded-2xl z-20 bg-base-200/80 overflow-hidden"
  >
    <!-- Background image layer (100% of container) -->
    <div
      v-if="resolvedImage"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        class="w-full h-full bg-cover bg-center scale-105 opacity-70"
        :style="{ backgroundImage: `url('${resolvedImage}')` }"
      />
      <div class="absolute inset-0 bg-base-200/80 mix-blend-multiply" />
      <div
        class="absolute inset-0 bg-gradient-to-b from-base-200/40 via-base-200/60 to-base-200/95"
      />
    </div>

    <!-- Foreground container with ~10% vertical gutter -->
    <div class="relative z-10 w-full h-full flex">
      <div ref="contentContainer" class="w-full h-full flex">
        <div
          class="w-full max-w-4xl mx-auto h-full px-1 md:px-2 lg:px-3 xl:px-4 py-[5%] flex flex-col"
        >
          <!-- Top smart header flip (rounded top, no bottom radius) -->
          <smart-flip />

          <!-- Bottom flip card (single pill bottom, shared with smart-flip) -->
          <section
            class="relative w-full flex-1 min-h-0 rounded-b-3xl border border-black border-t-0 bg-base-100/95 shadow-xl overflow-hidden"
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
                <!-- FRONT SIDE (Teleport / smart-panel, small title only) -->
                <div
                  class="flip-side flip-front"
                  :class="{
                    'flip-static-visible': !isAnimating && !flipped,
                    'flip-static-hidden': !isAnimating && flipped,
                  }"
                >
                  <div
                    ref="frontRef"
                    class="relative flex flex-col w-full h-full bg-base-100/95 overflow-hidden"
                  >
                    <!-- Bottom corner icons, partially clipped -->
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
                      class="relative z-10 flex flex-col w-full h-full p-2 sm:p-3 lg:p-4"
                    >
                      <div class="mb-1 md:mb-2 lg:mb-3 xl:mb-4">
                        <h2
                          class="text-xs sm:text-sm font-semibold text-base-content/80 truncate"
                        >
                          {{ title }}
                        </h2>
                      </div>

                      <div class="flex-1 min-h-0 flex overflow-y-auto">
                        <smart-panel class="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- BACK SIDE (Tutorial / ami-chat with full Kind title layout) -->
                <div
                  class="flip-side flip-back"
                  :class="{
                    'flip-static-visible': !isAnimating && flipped,
                    'flip-static-hidden': !isAnimating && !flipped,
                  }"
                >
                  <div
                    ref="backRef"
                    class="relative flex flex-col w-full h-full bg-base-100/95 overflow-hidden"
                  >
                    <!-- Bottom corner icons, partially clipped -->
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
                      class="relative z-10 flex flex-col w-full h-full p-1 md:p-2 lg:p-3 xl:p-4"
                    >
                      <div class="mb-1 md:mb-2 lg:mb-3 xl:mb-4">
                        <title-card />
                      </div>

                      <div class="flex-1 min-h-0 flex overflow-y-auto">
                        <ami-chat class="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <!-- END BACK SIDE -->
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-tutorial.vue
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'
import { useDisplayStore } from '@/stores/displayStore'

const contentContainer = ref<HTMLElement | null>(null)
const flipInner = ref<HTMLElement | null>(null)
const frontRef = ref<HTMLElement | null>(null)
const backRef = ref<HTMLElement | null>(null)

const isAnimating = ref(false)
const animFlipped = ref(false)

const navStore = useNavStore()
const pageStore = usePageStore()
const displayStore = useDisplayStore()

const flipped = computed(() => displayStore.SmartState === 'tutorial')

onMounted(async () => {
  if (!navStore.isInitialized) {
    await navStore.initialize()
  }
  navStore.setActiveModelType(null)
})

watch(
  () => displayStore.SmartState,
  (newState, oldState) => {
    if (isAnimating.value) return

    const prevFlipped = oldState === 'tutorial'
    const nextFlipped = newState === 'tutorial'

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

const fallbackImage = '/images/botcafe.webp'
const image = computed(() => pageStore.page?.image)
const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

const pageIcon = computed(() => pageStore.page?.icon)

const title = computed(
  () => pageStore.page?.title || pageStore.page?.room || 'Kind Room',
)
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
