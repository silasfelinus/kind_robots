<!-- /components/navigation/smart-image.vue -->
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
import { useDisplayStore } from '@/stores/displayStore'

const pageStore = usePageStore()
const galleryStore = useGalleryStore()
const displayStore = useDisplayStore()

const fallbackImage = '/images/botcafe.webp'

const frontSrc = ref<string | null>(null)
const backSrc = ref<string | null>(null)
const isSpinning = ref(false)

const smartState = computed(() => displayStore.SmartState)

const currentSrc = computed(() => {
  const front = frontSrc.value
  const back = backSrc.value

  // Map vs Ami (new semantics)
  if (smartState.value === 'ami') {
    return back || front || fallbackImage
  }
  if (smartState.value === 'map') {
    return front || back || fallbackImage
  }

  // Backwards compatibility for older values
  if (smartState.value === 'teleport') {
    return back || front || fallbackImage
  }
  if (smartState.value === 'tutorial') {
    return front || back || fallbackImage
  }

  // Fallback if SmartState is something unexpected
  return front || back || fallbackImage
})

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

  const randomFrontRaw = galleryStore.randomImage || null

  if (randomFrontRaw) {
    console.log(
      '[smart-image] Using galleryStore.randomImage for front image:',
      randomFrontRaw,
    )
  } else {
    console.log(
      '[smart-image] No galleryStore.randomImage set, falling back to page image or default',
    )
  }

  // Keep original behavior: use raw randomImage as-is, no extra prefixing
  const fallbackFront = pageImg || randomFrontRaw || fallbackImage

  frontSrc.value = fallbackFront
  backSrc.value = null
  isSpinning.value = false

  const galleryName = getGalleryNameForPage()
  console.log('[smart-image] Resolved galleryName for page:', galleryName)

  if (!galleryName) {
    backSrc.value = frontSrc.value
    return
  }

  try {
    console.log(
      '[smart-image] Requesting random image from gallery:',
      galleryName,
    )

    const randomFromGallery: any =
      await galleryStore.getRandomImageFromGalleryName(galleryName)

    console.log(
      '[smart-image] Received random image from gallery',
      galleryName,
      ':',
      randomFromGallery,
    )

    let resolvedPath: string | null = null

    if (typeof randomFromGallery === 'string') {
      resolvedPath = resolveBackendImage(randomFromGallery)
    } else if (randomFromGallery && typeof randomFromGallery === 'object') {
      const candidate =
        randomFromGallery.imagePath ||
        randomFromGallery.MediaPath ||
        randomFromGallery.mediaPath ||
        randomFromGallery.path ||
        randomFromGallery.url ||
        null

      if (candidate && typeof candidate === 'string') {
        resolvedPath = resolveBackendImage(candidate)
      }
    }

    backSrc.value = resolvedPath || frontSrc.value

    if (resolvedPath) {
      console.log('[smart-image] Using backSrc from gallery:', resolvedPath)
    } else {
      console.log(
        '[smart-image] Falling back to frontSrc for backSrc (resolvedPath was null)',
      )
    }
  } catch (error) {
    console.error(
      '[smart-image] Error while fetching random image from gallery:',
      error,
    )
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
  if (isSpinning.value) return

  isSpinning.value = true

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
