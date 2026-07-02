<!-- /components/pages/conductor-art-gallery.vue -->
<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-3 overflow-x-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="flex min-w-0 items-center gap-2">
      <Icon name="kind-icon:image" class="size-4 text-secondary" />
      <h4
        class="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-base-content/60"
      >
        Inspiration Gallery
      </h4>
      <span
        v-if="matchedCollection"
        class="badge badge-secondary badge-xs shrink-0"
        :title="`Art collection: ${matchedCollection.label}`"
      >
        {{ collectionSlideCount }} from collection
      </span>
      <span v-if="slides.length" class="ml-auto shrink-0 text-xs text-base-content/40">
        {{ activeIndex + 1 }} / {{ slides.length }}
      </span>
    </div>

    <div
      v-if="slides.length"
      class="group relative min-h-[14rem] flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:min-h-[18rem]"
    >
      <Transition name="conductor-slide-fade">
        <img
          :key="activeSlide.src"
          :src="activeSlide.src"
          :alt="activeSlide.label"
          class="absolute inset-0 h-full w-full object-cover"
          @error="dropSlide(activeSlide.src)"
        />
      </Transition>

      <span
        class="absolute bottom-2 left-2 badge badge-sm border-0 bg-base-100/80 font-semibold backdrop-blur"
      >
        {{ activeSlide.label }}
      </span>

      <template v-if="slides.length > 1">
        <button
          type="button"
          class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow transition-opacity hover:bg-base-100 group-hover:opacity-100"
          aria-label="Previous image"
          @click="step(-1)"
        >
          <Icon name="kind-icon:chevron-left" class="size-4" />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow transition-opacity hover:bg-base-100 group-hover:opacity-100"
          aria-label="Next image"
          @click="step(1)"
        >
          <Icon name="kind-icon:chevron-right" class="size-4" />
        </button>
      </template>
    </div>

    <div
      v-else
      class="flex min-h-[14rem] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/50 p-4 text-center"
    >
      <Icon name="kind-icon:image" class="size-8 text-base-content/20" />
      <p class="text-xs font-semibold text-base-content/50">
        No inspiration art yet.
      </p>
      <p class="max-w-xs text-xs text-base-content/35">
        Give an art collection the slug (or name)
        <strong class="text-base-content/60">{{ slug }}</strong> and its images
        will slideshow here.
      </p>
    </div>

    <div
      v-if="slides.length > 1"
      class="flex shrink-0 flex-wrap justify-center gap-1.5 overflow-x-hidden pb-1"
    >
      <button
        v-for="(slide, index) in slides"
        :key="slide.src"
        type="button"
        class="relative size-12 overflow-hidden rounded-lg border transition-all"
        :class="
          index === activeIndex
            ? 'border-primary ring-2 ring-primary/40'
            : 'border-base-300 opacity-60 hover:opacity-100'
        "
        :aria-label="`Show image ${index + 1}`"
        @click="activeIndex = index"
      >
        <img
          :src="slide.src"
          :alt="slide.label"
          class="h-full w-full object-cover"
        />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'

const props = defineProps<{
  slug: string
  heroPath?: string
  cardPath?: string
  iconPath?: string
}>()

type Slide = { src: string; label: string }

const collectionStore = useCollectionStore()

const activeIndex = ref(0)
const paused = ref(false)
const failedSrcs = ref<Set<string>>(new Set())

function normalizeImageSrc(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed
  }
  const clean = trimmed.replace(/^\/?(app\/)?public\/+/, '')
  if (clean.startsWith('/')) return clean
  if (clean.startsWith('images/')) return `/${clean}`
  return `/images/${clean}`
}

// Prefer the stable slug binding; the store helper falls back to a slugified
// label match so unslugged legacy collections still show.
const matchedCollection = computed(() => {
  // Touch collections so this recomputes when fetchCollections resolves.
  void collectionStore.collections
  return collectionStore.findCollectionBySlug?.(props.slug) ?? null
})

const collectionSlides = computed<Slide[]>(() => {
  if (!matchedCollection.value) return []
  const images =
    collectionStore.getCollectionImages?.(matchedCollection.value.id) ?? []
  return images
    .map((image, index) => ({
      src: normalizeImageSrc(
        image.imagePath ||
          (image as { path?: string | null }).path ||
          image.fileName,
      ),
      label: `Inspiration ${index + 1}`,
    }))
    .filter((slide) => Boolean(slide.src))
})

const collectionSlideCount = computed(() => collectionSlides.value.length)

const slides = computed<Slide[]>(() => {
  const out: Slide[] = []
  const seen = new Set<string>()
  const push = (src: string | null | undefined, label: string) => {
    const normalized = normalizeImageSrc(src)
    if (!normalized || seen.has(normalized) || failedSrcs.value.has(normalized))
      return
    seen.add(normalized)
    out.push({ src: normalized, label })
  }
  for (const slide of collectionSlides.value) push(slide.src, slide.label)
  push(props.heroPath, 'Hero')
  push(props.cardPath, 'Card')
  push(props.iconPath, 'Icon')
  return out
})

const activeSlide = computed<Slide>(() => {
  return (
    slides.value[activeIndex.value] ?? slides.value[0] ?? { src: '', label: '' }
  )
})

function step(direction: number) {
  const count = slides.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + direction + count) % count
}

function dropSlide(src: string) {
  failedSrcs.value = new Set([...failedSrcs.value, src])
}

watch(
  () => props.slug,
  () => {
    activeIndex.value = 0
    failedSrcs.value = new Set()
  },
)

watch(slides, (next) => {
  if (activeIndex.value >= next.length) activeIndex.value = 0
})

let advanceTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  advanceTimer = setInterval(() => {
    if (!paused.value && slides.value.length > 1) step(1)
  }, 6000)

  try {
    await collectionStore.fetchCollections()
  } catch {
    // Collections are decorative here — the static hero/card art still shows.
  }
})

onBeforeUnmount(() => {
  if (advanceTimer) clearInterval(advanceTimer)
})
</script>

<style scoped>
.conductor-slide-fade-enter-active,
.conductor-slide-fade-leave-active {
  transition: opacity 400ms ease;
}

.conductor-slide-fade-enter-from,
.conductor-slide-fade-leave-to {
  opacity: 0;
}
</style>