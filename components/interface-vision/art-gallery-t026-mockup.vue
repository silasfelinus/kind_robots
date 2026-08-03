<!-- /components/interface-vision/art-gallery-t026-mockup.vue -->
<!--
  Fixture-only visual mockup for interface-vision/t-026. No store or DB
  wiring — mirrors the t-001/t-002 "build mockups, Silas picks by eye"
  convention. Real images (public conductor project art) are used so the
  carousel motion and image density read the way they would in production.
-->
<template>
  <div class="flex flex-col gap-6">
    <section class="kr-panel space-y-2 p-4">
      <h2 class="text-lg font-black">
        t-026 — conductor-art-gallery.vue vs entity-art-manager.vue
      </h2>
      <p class="text-sm text-base-content/70">
        Project's art panel today is a bespoke carousel
        (<code>conductor-art-gallery.vue</code>) that autoplays through the
        Hero/Card/Icon set, ProjectArtImage history, and a linked ArtCollection
        in one slideshow. Every other entity (Bot, Character, Scenario, Reward,
        Facet) uses the shared
        <code>entity-art-manager.vue</code>, which has richer generation
        controls (img2img, presets, checkpoints) but only shows one current
        image plus a history grid — no autoplay, no collection merge.
      </p>
      <p class="text-sm text-base-content/70">
        Two options below, same fixture data in both. Pick the one you want and
        this task ships it for real.
      </p>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Option A -->
      <section class="kr-panel flex flex-col gap-3 p-4">
        <header class="space-y-1">
          <span class="badge badge-secondary badge-sm">Option A</span>
          <h3 class="text-base font-bold">
            Keep the carousel, thin-wrap the shared endpoints
          </h3>
          <p class="text-xs text-base-content/60">
            conductor-art-gallery.vue keeps its autoplay/collection chrome as
            its own component, but its generate/replace calls and polling loop
            become a thin wrapper around the same logic entity-art-manager.vue
            already uses internally — one fewer duplicated implementation, two
            components still exist.
          </p>
        </header>

        <div
          class="group relative min-h-56 overflow-hidden rounded-xl border border-base-300 bg-base-200"
          @mouseenter="pausedA = true"
          @mouseleave="pausedA = false"
        >
          <Transition name="t026-fade">
            <img
              :key="activeA.src"
              :src="activeA.src"
              :alt="activeA.label"
              class="absolute inset-0 size-full object-cover"
            />
          </Transition>
          <div
            class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-base-300/90 to-transparent p-3 pt-10"
          >
            <span
              class="badge badge-sm border-0 bg-base-100/85 font-semibold backdrop-blur"
            >
              {{ activeA.label }}
            </span>
            <span class="text-xs text-base-content/50">
              {{ indexA + 1 }} / {{ slidesA.length }}
            </span>
          </div>
          <button
            type="button"
            class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow group-hover:opacity-100"
            aria-label="Previous"
            @click="stepA(-1)"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" />
          </button>
          <button
            type="button"
            class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow group-hover:opacity-100"
            aria-label="Next"
            @click="stepA(1)"
          >
            <Icon name="kind-icon:chevron-right" class="size-4" />
          </button>
        </div>

        <div class="flex flex-wrap justify-center gap-1.5">
          <button
            v-for="(slide, i) in slidesA"
            :key="slide.src"
            type="button"
            class="relative size-10 overflow-hidden rounded-lg border transition-all"
            :class="
              i === indexA
                ? 'border-primary ring-2 ring-primary/40'
                : 'border-base-300 opacity-60 hover:opacity-100'
            "
            @click="indexA = i"
          >
            <img
              :src="slide.src"
              :alt="slide.label"
              class="size-full object-cover"
            />
          </button>
        </div>

        <div class="mt-auto flex flex-wrap gap-1.5">
          <span class="badge badge-secondary badge-xs">2 collection</span>
          <span class="badge badge-accent badge-xs">1 inspiration</span>
          <span class="badge badge-ghost badge-xs ml-auto">autoplay</span>
        </div>
      </section>

      <!-- Option B -->
      <section class="kr-panel flex flex-col gap-3 p-4">
        <header class="space-y-1">
          <span class="badge badge-primary badge-sm">Option B</span>
          <h3 class="text-base font-bold">
            Extend entity-art-manager.vue with a collection-carousel mode
          </h3>
          <p class="text-xs text-base-content/60">
            entity-art-manager.vue grows an optional collection-carousel panel
            (autoplay through Hero/Card/Icon + ArtCollection art) that only
            mounts when a caller passes collection slides. Project adopts it
            directly; conductor-art-gallery.vue is deleted — one canonical
            implementation for every entity type.
          </p>
        </header>

        <div
          class="relative min-h-40 overflow-hidden rounded-xl border border-base-300 bg-base-200"
        >
          <img
            :src="currentB.src"
            :alt="currentB.label"
            class="absolute inset-0 size-full object-cover"
          />
          <div
            class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-base-300/95 to-transparent p-3 pt-8"
          >
            <span
              class="badge badge-sm border-0 bg-base-100/85 font-bold backdrop-blur"
            >
              Current {{ currentB.label }}
            </span>
            <div class="flex gap-1">
              <button
                type="button"
                class="btn btn-secondary btn-xs gap-1 rounded-lg"
                disabled
              >
                <Icon name="kind-icon:sparkles" class="size-3" />
                Generate
              </button>
              <button
                type="button"
                class="btn btn-xs gap-1 rounded-lg border-0 bg-base-100/85 backdrop-blur"
                disabled
              >
                <Icon name="kind-icon:upload" class="size-3" />
                Upload
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="slot in slotsB"
            :key="slot.field"
            type="button"
            class="btn btn-xs rounded-lg"
            :class="
              selectedB === slot.field
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            @click="selectedB = slot.field"
          >
            {{ slot.label }}
          </button>
        </div>

        <div
          class="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3"
        >
          <div class="mb-2 flex items-center gap-2">
            <Icon name="kind-icon:image" class="size-3.5 text-primary" />
            <h4
              class="text-xs font-black uppercase tracking-wide text-primary/80"
            >
              New: collection carousel
            </h4>
            <span class="badge badge-ghost badge-xs ml-auto"
              >{{ collectionB.length }} linked</span
            >
          </div>
          <div class="grid grid-cols-3 gap-2">
            <img
              v-for="slide in collectionB"
              :key="slide.src"
              :src="slide.src"
              :alt="slide.label"
              class="aspect-square w-full rounded-lg border border-base-300 object-cover"
            />
          </div>
        </div>

        <aside class="rounded-xl border border-base-300 bg-base-200/50 p-3">
          <div class="mb-2 flex items-center gap-2">
            <Icon
              name="kind-icon:history"
              class="size-3.5 text-base-content/50"
            />
            <h4
              class="text-xs font-black uppercase tracking-wide text-base-content/55"
            >
              Inspiration history
            </h4>
            <span class="badge badge-ghost badge-xs ml-auto">{{
              historyB.length
            }}</span>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <img
              v-for="item in historyB"
              :key="item.src"
              :src="item.src"
              :alt="item.label"
              class="aspect-square w-full rounded-lg border border-base-300 object-cover"
            />
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type Slide = { src: string; label: string }

const IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

const slideA0: Slide = {
  src: `${IMG_BASE}/ai-art-academy-hero.webp`,
  label: 'Hero',
}
const slidesA: Slide[] = [
  slideA0,
  { src: `${IMG_BASE}/ai-art-academy-card.webp`, label: 'Card' },
  { src: `${IMG_BASE}/ai-art-academy-icon.webp`, label: 'Icon' },
  { src: `${IMG_BASE}/animation-manager-card.webp`, label: 'Collection 1' },
  { src: `${IMG_BASE}/brainstorm-card.webp`, label: 'Collection 2' },
]

const indexA = ref(0)
const pausedA = ref(false)
const activeA = computed(() => slidesA[indexA.value] ?? slideA0)
function stepA(direction: number) {
  const count = slidesA.length
  indexA.value = (indexA.value + direction + count) % count
}
let timerA: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timerA = setInterval(() => {
    if (!pausedA.value) stepA(1)
  }, 3000)
})
onBeforeUnmount(() => {
  if (timerA) clearInterval(timerA)
})

const slotB0 = {
  field: 'heroPath',
  label: 'Hero',
  src: `${IMG_BASE}/ai-art-academy-hero.webp`,
}
const slotsB = [
  slotB0,
  {
    field: 'cardPath',
    label: 'Card',
    src: `${IMG_BASE}/ai-art-academy-card.webp`,
  },
  {
    field: 'imagePath',
    label: 'Icon',
    src: `${IMG_BASE}/ai-art-academy-icon.webp`,
  },
]
const selectedB = ref(slotB0.field)
const currentB = computed(
  () => slotsB.find((slot) => slot.field === selectedB.value) ?? slotB0,
)
const collectionB: Slide[] = [
  { src: `${IMG_BASE}/animation-manager-card.webp`, label: 'Collection 1' },
  { src: `${IMG_BASE}/brainstorm-card.webp`, label: 'Collection 2' },
  { src: `${IMG_BASE}/challenge-center-card.webp`, label: 'Collection 3' },
]
const historyB: Slide[] = [
  { src: `${IMG_BASE}/appmaker-card.webp`, label: 'Prior 1' },
  { src: `${IMG_BASE}/approval-portal-card.webp`, label: 'Prior 2' },
  { src: `${IMG_BASE}/art-generator-connect-card.webp`, label: 'Prior 3' },
  { src: `${IMG_BASE}/career-transition-card.webp`, label: 'Prior 4' },
]
</script>

<style scoped>
.t026-fade-enter-active,
.t026-fade-leave-active {
  transition: opacity 400ms ease;
}
.t026-fade-enter-from,
.t026-fade-leave-to {
  opacity: 0;
}
</style>
