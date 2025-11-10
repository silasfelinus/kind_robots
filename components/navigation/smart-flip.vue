<!-- /components/navigation/smart-flip.vue -->
<template>
  <div class="flip-top-perspective w-full flex items-center justify-center">
    <div
      ref="innerRef"
      class="flip-top-inner relative w-full rounded-t-3xl border border-black border-b-0 bg-base-100/95 shadow-xl overflow-hidden"
      :class="{
        'is-animating': isAnimating,
        'is-flipped': isAnimating ? animFlipped : flipped,
      }"
      @transitionend="onFlipTransitionEnd"
    >
      <div
        class="flip-face flip-front"
        :class="{
          'flip-static-visible': !isAnimating && !flipped,
          'flip-static-hidden': !isAnimating && flipped,
        }"
      >
        <div class="relative w-full h-full overflow-hidden">
          <div
            v-if="pageIcon"
            class="pointer-events-none absolute -top-10 -right-10 sm:-top-12 sm:-right-12 lg:-top-14 lg:-right-14 opacity-30"
          >
            <Icon
              :name="pageIcon"
              class="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 text-primary"
            />
          </div>

          <button
            type="button"
            class="absolute top-3 right-4 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
            @click.stop="handleFlipToggle"
          >
            <Icon v-if="!flipped" name="kind-icon:butterfly" class="w-3 h-3" />
            <Icon v-else name="kind-icon:map" class="w-3 h-3" />
            <span class="hidden sm:inline">
              {{ flipped ? 'Map' : 'AMI' }}
            </span>
          </button>

          <div
            class="relative z-10 flex flex-col w-full px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 lg:px-6 lg:pt-6 lg:pb-5 space-y-3"
          >
            <div
              class="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-black bg-gradient-to-r from-base-100 via-base-200 to-base-100 px-4 py-1.5 sm:px-5 sm:py-2 shadow-[0_3px_0_rgba(0,0,0,0.6)]"
            >
              <span
                class="inline-flex items-center justify-center rounded-full bg-black text-base-100 px-2.5 py-px text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-[0.24em] uppercase whitespace-nowrap"
              >
                Kind
              </span>
              <span
                class="truncate font-semibold leading-tight text-[clamp(1rem,2.1vw,1.5rem)] tracking-tight"
              >
                {{ title || 'Kind Robots' }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <h1
                  v-if="room"
                  class="text-lg sm:text-xl lg:text-2xl font-black leading-tight tracking-tight"
                >
                  <span
                    class="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]"
                  >
                    The {{ room }}
                  </span>
                </h1>
              </div>

              <button
                v-if="theme && themeStore.currentTheme !== theme"
                type="button"
                class="shrink-0 inline-flex items-center justify-center rounded-full border border-black bg-accent px-3 py-1 text-[0.7rem] sm:text-xs lg:text-sm font-semibold text-black shadow-sm hover:translate-y-[1px] hover:shadow-md transition"
                @click="themeStore.setActiveTheme(theme)"
              >
                <span
                  class="mr-1.5 text-[0.65rem] uppercase tracking-[0.16em] opacity-80"
                >
                  Theme
                </span>
                <span class="font-mono">{{ theme }}</span>
              </button>
            </div>

            <div
              v-if="description"
              class="inline-flex w-full sm:max-w-[90%] items-center rounded-full border border-black bg-secondary px-4 py-1 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.18em] leading-relaxed whitespace-normal"
            >
              {{ description }}
            </div>
          </div>

          <div class="relative z-10 px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6">
            <div class="flex items-center justify-center">
              <div
                class="image-spinner-wrapper w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 flex items-center justify-center"
              >
                <div
                  class="image-spinner relative rounded-2xl border border-base-300 bg-base-100/80 shadow-md overflow-hidden w-full h-full"
                  :class="imageSpinnerClass"
                  @click.stop="handleFlipToggle"
                >
                  <img
                    :src="frontDisplayImage"
                    alt="Room image"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flip-face flip-back"
        :class="{
          'flip-static-visible': !isAnimating && flipped,
          'flip-static-hidden': !isAnimating && !flipped,
        }"
      >
        <div class="relative w-full h-full overflow-hidden">
          <div
            v-if="pageIcon"
            class="pointer-events-none absolute -top-10 -left-10 sm:-top-12 lg:-top-14 lg:-left-14 opacity-30"
          >
            <Icon
              :name="pageIcon"
              class="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 text-primary"
            />
          </div>

          <button
            type="button"
            class="absolute top-3 right-4 z-20 inline-flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[0.65rem] sm:text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-[1px] transition"
            @click.stop="handleFlipToggle"
          >
            <Icon v-if="!flipped" name="kind-icon:butterfly" class="w-3 h-3" />
            <Icon v-else name="kind-icon:map" class="w-3 h-3" />
            <span class="hidden sm:inline">
              {{ flipped ? 'Map' : 'AMI' }}
            </span>
          </button>

          <div
            class="relative z-10 flex flex-col w-full px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 lg:px-6 lg:pt-6 lg:pb-5 space-y-3"
          >
            <div
              class="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-black bg-gradient-to-r from-base-100 via-base-200 to-base-100 px-4 py-1.5 sm:px-5 sm:py-2 shadow-[0_3px_0_rgba(0,0,0,0.6)]"
            >
              <span
                class="inline-flex items-center justify-center rounded-full bg-black text-base-100 px-2.5 py-px text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-[0.24em] uppercase whitespace-nowrap"
              >
                AMI
              </span>
              <span
                class="truncate font-semibold leading-tight text-[clamp(1rem,2.1vw,1.5rem)] tracking-tight"
              >
                Meet AMI
              </span>
            </div>

            <p
              class="text-[0.7rem] sm:text-xs text-base-content/80 max-w-prose"
            >
              Chat with the butterfly hive mind that is trying to make your day,
              and maybe the world, a little better.
            </p>
          </div>

          <div class="relative z-10 px-4 pb-4 sm:px-5 sm:pb-5 lg:px-6">
            <div class="flex items-center justify-center">
              <div
                class="image-spinner-wrapper w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 flex items-center justify-center"
              >
                <div
                  class="image-spinner relative rounded-2xl border border-base-300 bg-base-100/80 shadow-md overflow-hidden w-full h-full"
                  :class="imageSpinnerClass"
                  @click.stop="handleFlipToggle"
                >
                  <img
                    :src="backDisplayImage"
                    alt="Room image"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/smart-flip.vue
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useDisplayStore } from '@/stores/displayStore'
import { Icon } from '#components'

type FlipDirection = 'toAmi' | 'toMap'

const pageStore = usePageStore()
const themeStore = useThemeStore()
const galleryStore = useGalleryStore()
const displayStore = useDisplayStore()

const pageIcon = computed(() => pageStore.page?.icon || '')

const title = computed(() => pageStore.page?.title)
const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
const theme = computed(() => pageStore.page?.theme)

const normalizeImagePath = (img?: string | null): string => {
  const fallback = '/images/botcafe.webp'
  if (!img) return fallback

  if (img.startsWith('/images/')) return img
  if (img.startsWith('images/')) return `/${img}`
  if (img.startsWith('/')) return `/images/${img.slice(1)}`
  return `/images/${img}`
}

const galleryName = computed(() => pageStore.page?.gallery || null)

const resolvedPageImage = computed(() =>
  normalizeImagePath(pageStore.page?.image || null),
)

const frontBaseImage = ref<string>(resolvedPageImage.value)
const backBaseImage = computed(() => resolvedPageImage.value)

const frontImage = computed(
  () => frontBaseImage.value || '/images/botcafe.webp',
)
const backImage = computed(() => backBaseImage.value)

const isAnimating = ref(false)
const animFlipped = ref(false)
const flipDirection = ref<FlipDirection>('toAmi')

const innerRef = ref<HTMLElement | null>(null)

const flipped = computed(() => displayStore.SmartState === 'ami')

const frontDisplayImage = computed(() => frontImage.value)
const backDisplayImage = computed(() => backImage.value)

const imageSpinnerClass = computed(() => {
  if (!isAnimating.value) return ''
  return flipDirection.value === 'toAmi' ? 'spin-to-ami' : 'spin-to-map'
})

const loadRandomFrontImage = async () => {
  const fallback = resolvedPageImage.value || '/images/botcafe.webp'

  if (!galleryName.value) {
    frontBaseImage.value = fallback
    return
  }

  try {
    const img = await galleryStore.getRandomImageFromGalleryName(
      galleryName.value,
    )
    frontBaseImage.value = img ? normalizeImagePath(img) : fallback
  } catch (err) {
    console.error('Error fetching random image from gallery:', err)
    frontBaseImage.value = fallback
  }
}

onMounted(() => {
  void loadRandomFrontImage()
})

watch(
  galleryName,
  () => {
    void loadRandomFrontImage()
  },
  { immediate: false },
)

const handleFlipToggle = () => {
  if (isAnimating.value) return

  const currentlyAmi = flipped.value

  isAnimating.value = true
  animFlipped.value = currentlyAmi
  flipDirection.value = currentlyAmi ? 'toMap' : 'toAmi'

  nextTick(() => {
    if (innerRef.value) {
      void innerRef.value.offsetWidth
    }
    animFlipped.value = !currentlyAmi
  })
}

const onFlipTransitionEnd = (event: TransitionEvent) => {
  if (!isAnimating.value || event.propertyName !== 'transform') return
  isAnimating.value = false
  displayStore.toggleSmartFlip()
}
</script>

<style scoped>
.flip-top-perspective {
  perspective: 1000px;
}

.flip-top-inner {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flip-top-inner.is-animating.is-flipped {
  transform: rotateY(180deg);
}

.flip-top-inner.is-animating .flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-face {
  width: 100%;
}

.flip-static-visible {
  display: block;
}

.flip-static-hidden {
  display: none;
}

.flip-back {
  transform: rotateY(180deg);
}

.image-spinner {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.spin-to-ami {
  transform: rotateY(180deg);
}

.spin-to-map {
  transform: rotateY(-180deg);
}
</style>
