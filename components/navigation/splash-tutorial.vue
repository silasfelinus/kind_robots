<!-- /components/content/icons/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full rounded-2xl border-2 border-black z-20 bg-base-200/80 overflow-hidden"
  >
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

    <div class="relative z-10 w-full h-full flex">
      <div
        ref="contentContainer"
        class="w-full max-w-4xl mx-auto h-full px-1 py-1 md:px-2 md:py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-4 flex"
      >
        <section class="relative w-full h-full">
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
              <!-- FRONT SIDE -->
              <div
                class="flip-side flip-front"
                :class="{
                  'flip-static-visible': !isAnimating && !flipped,
                  'flip-static-hidden': !isAnimating && flipped,
                }"
              >
                <div
                  ref="frontRef"
                  class="relative flex flex-col w-full h-full rounded-2xl border border-black bg-base-100/95 shadow-md overflow-hidden"
                >
                  <div
                    v-if="pageIcon"
                    class="pointer-events-none absolute -top-10 -right-10 sm:-top-14 sm:-right-14 lg:-top-16 lg:-right-16 opacity-20 rotate-6"
                  >
                    <Icon
                      :name="pageIcon"
                      class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
                    />
                  </div>

                  <!-- FRONT BUTTON (travels with card) -->
                  <button
                    type="button"
                    class="absolute top-3 right-4 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                    @click.stop="handleFlipToggle"
                  >
                    <Icon name="kind-icon:arrow-right" class="w-3 h-3" />
                    <span class="hidden sm:inline"> Browse </span>
                  </button>

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

              <!-- BACK SIDE -->
              <div
                class="flip-side flip-back"
                :class="{
                  'flip-static-visible': !isAnimating && flipped,
                  'flip-static-hidden': !isAnimating && !flipped,
                }"
              >
                <div
                  ref="backRef"
                  class="relative w-full h-full rounded-2xl border border-black shadow-md p-4 sm:p-5 overflow-hidden"
                >
                  <div
                    v-if="pageIcon"
                    class="pointer-events-none absolute -top-10 -left-10 sm:-top-14 sm:-left-14 lg:-top-16 lg:-left-16 opacity-20 rotate-6"
                    style="transform: scaleX(-1)"
                  >
                    <Icon
                      :name="pageIcon"
                      class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
                    />
                  </div>

                  <!-- BACK BUTTON (travels with card) -->
                  <button
                    type="button"
                    class="absolute top-3 right-4 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
                    @click.stop="handleFlipToggle"
                  >
                    <Icon name="kind-icon:arrow-left" class="w-3 h-3" />
                    <span class="hidden sm:inline"> Details </span>
                  </button>

                  <div class="relative z-10 w-full h-full overflow-y-auto">
                    <smart-panel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-tutorial.vue
import { ref, computed } from 'vue'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useNavStore } from '@/stores/navStore'

const contentContainer = ref<HTMLElement | null>(null)
const flipInner = ref<HTMLElement | null>(null)
const frontRef = ref<HTMLElement | null>(null)
const backRef = ref<HTMLElement | null>(null)

const flipped = ref(false)
const isAnimating = ref(false)
const animFlipped = ref(false)

const navStore = useNavStore()
const pageStore = usePageStore()

if (!navStore.isInitialized) {
  ;(async () => {
    await navStore.initialize()
    navStore.setActiveModelType(null)
  })()
}

const handleFlipToggle = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  animFlipped.value = flipped.value

  if (flipInner.value) {
    void flipInner.value.offsetWidth
  }
  animFlipped.value = !flipped.value
}

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (!isAnimating.value || event.propertyName !== 'transform') return
  isAnimating.value = false
  flipped.value = !flipped.value
}

const fallbackImage = '/images/botcafe.webp'
const image = computed(() => pageStore.page?.image)
const resolvedImage = computed(() => {
  const img = image.value || fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

const pageIcon = computed(() => pageStore.page?.icon)
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

.flip-side {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-front {
  transform: rotateY(0deg);
}

.flip-back {
  transform: rotateY(180deg);
}

.flip-static-visible {
  visibility: visible;
}

.flip-static-hidden {
  visibility: hidden;
}
</style>
