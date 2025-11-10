// /components/content/icons/smart-image.vue
<template>
  <div
    class="relative w-full rounded-2xl border border-base-300 bg-base-200/70 overflow-hidden flex items-center justify-center aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] cursor-pointer"
    :class="{ 'smart-image-spin': isSpinning }"
    @click="handleClick"
  >
    <img
      v-if="currentSrc"
      :src="currentSrc"
      alt="Room illustration"
      class="w-full h-full object-cover"
      loading="lazy"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/smart-image.vue
import { computed, ref, watch } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const fallbackImage = '/images/botcafe.webp'

// Replace this array with real gallery hero images when you wire it up
const galleryImages = [
  '/images/botcafe.webp',
  '/images/wonderlab.webp',
  '/images/memory-room.webp',
]

const frontSrc = ref<string | null>(null)
const backSrc = ref<string | null>(null)
const showFront = ref(true)
const isSpinning = ref(false)

const currentSrc = computed(() => (showFront.value ? frontSrc.value : backSrc.value))

const pageKey = computed(() => {
  const page = pageStore.page
  return (
    page?.slug ||
    (page as any)?.id?.toString?.() ||
    page?.title ||
    page?.room ||
    'default-page'
  )
})

const resolveImage = (img: string | null | undefined): string => {
  if (!img) return fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
}

const getRandomGalleryImage = (): string | null => {
  if (!galleryImages.length) return null
  const index = Math.floor(Math.random() * galleryImages.length)
  return galleryImages[index]
}

const initImagesForPage = () => {
  const pageImgRaw = (pageStore.page as any)?.image as string | null | undefined
  const pageImg = pageImgRaw ? resolveImage(pageImgRaw) : null
  const randomImg = getRandomGalleryImage()

  if (pageImg) {
    frontSrc.value = pageImg
    backSrc.value = randomImg ? resolveImage(randomImg) : pageImg
  } else if (randomImg) {
    const resolvedRandom = resolveImage(randomImg)
    frontSrc.value = resolvedRandom
    backSrc.value = resolvedRandom
  } else {
    const fallbackResolved = resolveImage(fallbackImage)
    frontSrc.value = fallbackResolved
    backSrc.value = fallbackResolved
  }

  showFront.value = true
  isSpinning.value = false
}

watch(
  pageKey,
  () => {
    initImagesForPage()
  },
  { immediate: true },
)

const SPIN_DURATION = 600

const handleClick = () => {
  if (isSpinning.value || !frontSrc.value || !backSrc.value) return

  isSpinning.value = true

  window.setTimeout(() => {
    showFront.value = false
  }, SPIN_DURATION / 3)

  window.setTimeout(() => {
    showFront.value = true
  }, (2 * SPIN_DURATION) / 3)

  window.setTimeout(() => {
    isSpinning.value = false
  }, SPIN_DURATION)
}
</script>

<style scoped>
.smart-image-spin {
  animation: smart-image-spin 0.6s ease-in-out;
  transform-origin: center;
}

@keyframes smart-image-spin {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
</style>