<!-- /components/navigation/smart-image.vue -->
<template>
  <div
    ref="wrapRef"
    class="relative w-full rounded-2xl border border-base-300 bg-base-200/70 overflow-hidden flex items-center justify-center aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] cursor-pointer [perspective:1200px]"
    @click="spinOnce"
  >
    <div
      ref="innerRef"
      class="relative w-full h-full [transform-style:preserve-3d]"
      :style="innerStyle"
      @transitionend="onTransitionEnd"
    >
      <div
        class="absolute inset-0 w-full h-full [backface-visibility:hidden]"
        :style="faceStyle(0)"
      >
        <img
          v-if="frontSrc"
          :src="frontSrc"
          alt="Front"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div
        class="absolute inset-0 w-full h-full [backface-visibility:hidden]"
        :style="faceStyle(1)"
      >
        <img
          v-if="backSrc"
          :src="backSrc"
          alt="Back"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div
        class="absolute inset-0 w-full h-full [backface-visibility:hidden]"
        :style="faceStyle(2)"
      >
        <img
          v-if="dashSrc"
          :src="dashSrc"
          alt="Dash"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/smart-image.vue
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useDisplayStore } from '@/stores/displayStore'

const pageStore = usePageStore()
const galleryStore = useGalleryStore()
const displayStore = useDisplayStore()

const fallbackImage = '/images/botcafe.webp'

const wrapRef = ref<HTMLElement | null>(null)
const innerRef = ref<HTMLElement | null>(null)

const frontSrc = ref<string | null>(null)
const backSrc = ref<string | null>(null)
const dashSrc = ref<string | null>(null)

const spinning = ref(false)
const angleDeg = ref(0)
const targetIndex = ref(0)
const currentIndex = ref(0)
const depthPx = ref(120)

const smartState = computed(() => displayStore.SmartState as string)

const pageKey = computed(() => {
  const p = pageStore.page as any
  return p?.slug || p?.id?.toString?.() || p?.title || p?.room || 'default-page'
})

const stateToIndex = (state: string): number => {
  if (state === 'map') return 0
  if (state === 'ami') return 1
  if (state === 'dash') return 2
  return 0
}

const resolveImage = (img?: string | null): string | null => {
  if (!img) return null
  return img.startsWith('/') ? img : `/images/${img}`
}

const resolveBackendImage = (img?: string | null): string | null => {
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

const setDepthFromWidth = () => {
  const el = wrapRef.value
  if (!el) return
  const w = el.getBoundingClientRect().width
  const d = w / (2 * Math.tan(Math.PI / 3))
  depthPx.value = Math.max(40, Math.floor(d))
}

const loadImages = async () => {
  const page = pageStore.page as any
  const pageImg = resolveImage(page?.image) || null
  const galleryName = getGalleryNameForPage()

  const seedFront = pageImg || galleryStore.randomImage || null || fallbackImage
  frontSrc.value = seedFront

  let g1: string | null = null
  let g2: string | null = null

  if (galleryName) {
    try {
      const r1: any =
        await galleryStore.getRandomImageFromGalleryName(galleryName)
      const c1 =
        typeof r1 === 'string'
          ? r1
          : r1?.imagePath ||
            r1?.MediaPath ||
            r1?.mediaPath ||
            r1?.path ||
            r1?.url ||
            null
      g1 = resolveBackendImage(c1)
      if (!g1) g1 = seedFront
    } catch {
      g1 = seedFront
    }

    try {
      const r2: any =
        await galleryStore.getRandomImageFromGalleryName(galleryName)
      const c2 =
        typeof r2 === 'string'
          ? r2
          : r2?.imagePath ||
            r2?.MediaPath ||
            r2?.mediaPath ||
            r2?.path ||
            r2?.url ||
            null
      g2 = resolveBackendImage(c2)
      if (!g2) g2 = seedFront
    } catch {
      g2 = seedFront
    }
  } else {
    g1 = seedFront
    g2 = seedFront
  }

  backSrc.value = g1 || seedFront
  dashSrc.value = g2 || seedFront

  console.log('[smart-image] front:', frontSrc.value)
  console.log('[smart-image] back:', backSrc.value)
  console.log('[smart-image] dash:', dashSrc.value)
}

const normalizeAngle = (deg: number) => {
  let a = deg % 360
  if (a < 0) a += 360
  return a
}

const indexToAngle = (idx: number) => normalizeAngle(-idx * 120)

const rotateToIndex = (nextIdx: number) => {
  const current = normalizeAngle(angleDeg.value)
  const desired = indexToAngle(nextIdx)

  let delta = desired - current
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360

  angleDeg.value = normalizeAngle(current + delta)
  currentIndex.value = nextIdx
}

const innerStyle = computed(() => {
  return {
    transform: `rotateY(${angleDeg.value}deg)`,
    transition: spinning.value
      ? 'transform 600ms ease-in-out'
      : 'transform 420ms ease-in-out',
    '--depth': `${depthPx.value}px`,
  } as Record<string, string>
})

const faceStyle = (face: number) => {
  const base = face * 120
  return {
    transform: `rotateY(${base}deg) translateZ(var(--depth))`,
  }
}

const spinOnce = () => {
  if (spinning.value) return
  spinning.value = true
  angleDeg.value = normalizeAngle(angleDeg.value + 360)
}

const onTransitionEnd = () => {
  spinning.value = false
}

watch(
  pageKey,
  async () => {
    await loadImages()
  },
  { immediate: true },
)

watch(
  smartState,
  async (s) => {
    targetIndex.value = stateToIndex(s || 'map')
    await nextTick()
    rotateToIndex(targetIndex.value)
  },
  { immediate: true },
)

onMounted(() => {
  setDepthFromWidth()
  window.addEventListener('resize', setDepthFromWidth, { passive: true })
  currentIndex.value = stateToIndex(smartState.value || 'map')
  angleDeg.value = indexToAngle(currentIndex.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setDepthFromWidth)
})
</script>
