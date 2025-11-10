<!-- /components/content/icons/smart-image.vue -->
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
import { useGalleryStore } from '@/stores/galleryStore'

const pageStore = usePageStore()
const galleryStore = useGalleryStore()

const fallbackImage = '/images/botcafe.webp'

const frontSrc = ref<string | null>(null)
const backSrc = ref<string | null>(null)
const showFront = ref(true)
const isSpinning = ref(false)

const currentSrc = computed(() => (showFront.value ? frontSrc.value : backSrc.value))

const pageKey = computed(() => {
  const page = pageStore.page as any
  return (
    page?.slug ||
    page?.id?.toString?.() ||
    page?.title ||
    page?.room ||
    'default-page'
  )
})

const resolveImage = (img: string | null | undefined): string => {
  if (!img) return fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
}

const resolveBackendImage = (img: string | null): string | null => {
  if (!img) return null
  return img.startsWith('/') ? img : `/images/${img}`
}

const getGalleryNameForPage = (): string | null => {
  const page = pageStore.page as any
  if (page?.galleryName) return page.galleryName as string
  if (page?.room) return page.room as string
  if (page?.title) return page.title as string
  if (galleryStore.currentGallery?.name) return galleryStore.currentGallery.name
  return null
}

const initImagesForPage = async () => {
  const page = pageStore.page as any
  const pageImgRaw = page?.image as string | null | undefined
  const pageImg = pageImgRaw ? resolveImage(pageImgRaw) : null

  const randomFront = galleryStore.randomImage || null
  const fallbackFront = pageImg || randomFront || fallbackImage

  frontSrc.value = fallbackFront
  showFront.value = true
  isSpinning.value = false

  backSrc.value = null

  const galleryName = getGalleryNameForPage()
  if (!galleryName) {
    backSrc.value = frontSrc.value
    return
  }

  try {
    const randomFromGallery = await galleryStore.getRandomImageFromGalleryName(
      galleryName,
    )
    const resolved = resolveBackendImage(randomFromGallery)
    backSrc.value = resolved || frontSrc.value
  } catch {
    backSrc.value = frontSrc.value
  }
}

watch(
  pageKey,
  () => {
    void initImagesForPage()
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
  33% {
    transform: rotateY(180deg);
  }
  66% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
</style>