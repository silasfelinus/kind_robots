<!-- /components/navigation/hero-showcase.vue
     Cinematic hero card carousel. Full-bleed image with crossfade, auto-advance
     progress bar, prev/next navigation, dot indicators, and a rich description panel. -->
<template>
  <div
    class="flex h-full min-h-80 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <!-- ── Hero image ───────────────────────────────────────────────── -->
    <div class="relative min-h-0 flex-1 overflow-hidden bg-base-300">
      <!-- Crossfade: both old and new images are absolute, overlapping during transition -->
      <Transition name="hero-xfade">
        <img
          v-if="currentItem.imagePath"
          :key="currentItem.id"
          :src="currentItem.imagePath"
          :alt="currentItem.title"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          v-else
          :key="`ph-${currentItem.id}`"
          class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10"
        >
          <Icon name="kind-icon:image" class="h-20 w-20 text-base-content/15" />
        </div>
      </Transition>

      <!-- Cinematic gradient overlay -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/10 to-transparent" />

      <!-- Prev button -->
      <button
        v-if="items.length > 1"
        type="button"
        class="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-base-100/80 shadow backdrop-blur transition hover:bg-base-100 hover:shadow-md"
        aria-label="Previous"
        @click="prev"
      >
        <Icon name="kind-icon:chevron-left" class="h-5 w-5 text-base-content" />
      </button>

      <!-- Next button -->
      <button
        v-if="items.length > 1"
        type="button"
        class="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-base-100/80 shadow backdrop-blur transition hover:bg-base-100 hover:shadow-md"
        aria-label="Next"
        @click="next"
      >
        <Icon name="kind-icon:chevron-right" class="h-5 w-5 text-base-content" />
      </button>

      <!-- Auto-advance progress bar -->
      <div v-if="items.length > 1" class="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-base-300/30">
        <div
          class="progress-fill h-full bg-primary"
          :key="progressKey"
          :class="{ 'animation-paused': isPaused }"
          :style="{ '--interval': `${intervalMs}ms` }"
        />
      </div>
    </div>

    <!-- ── Description panel ────────────────────────────────────────── -->
    <div class="shrink-0 p-4 sm:p-5">
      <!-- Dot navigation + counter -->
      <div v-if="items.length > 1" class="mb-3 flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <button
            v-for="(_, i) in items"
            :key="i"
            type="button"
            class="h-1.5 rounded-full bg-base-300 transition-all hover:bg-primary/60"
            :class="i === currentIndex ? 'w-6 bg-primary' : 'w-1.5'"
            :aria-label="`Go to item ${i + 1}`"
            @click="goTo(i)"
          />
        </div>
        <span class="ml-auto text-xs tabular-nums text-base-content/35">
          {{ currentIndex + 1 }}&thinsp;/&thinsp;{{ items.length }}
        </span>
      </div>

      <!-- Title + description with slide-up transition -->
      <Transition name="desc-slide" mode="out-in">
        <div :key="currentItem.id" class="flex flex-col gap-2">
          <h2 class="text-2xl font-black leading-tight tracking-tight text-base-content sm:text-3xl">
            {{ currentItem.title }}
          </h2>
          <p
            v-if="currentItem.description"
            class="line-clamp-3 text-sm leading-relaxed text-base-content/65 sm:text-base"
          >
            {{ currentItem.description }}
          </p>
        </div>
      </Transition>

      <button
        type="button"
        class="btn btn-primary btn-sm mt-3 rounded-xl gap-1.5"
        @click="$emit('select', { id: currentItem.id })"
      >
        <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
        Open
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface GalleryItem {
  id: number | string
  title: string
  imagePath: string
  description: string
}

const props = withDefaults(
  defineProps<{
    items: GalleryItem[]
    intervalMs?: number
  }>(),
  {
    intervalMs: 5000,
  },
)

defineEmits<{
  select: [{ id: number | string }]
}>()

const currentIndex = ref(0)
const isPaused = ref(false)
const progressKey = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const currentItem = computed(
  () => props.items[currentIndex.value] ?? props.items[0] ?? { id: 0, title: '', imagePath: '', description: '' },
)

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

function goTo(i: number) {
  if (!props.items.length) return
  currentIndex.value = mod(i, props.items.length)
  progressKey.value++
  restartInterval()
}

function next() {
  goTo(currentIndex.value + 1)
}

function prev() {
  goTo(currentIndex.value - 1)
}

function restartInterval() {
  if (intervalId) clearInterval(intervalId)
  if (props.items.length <= 1) return

  intervalId = setInterval(() => {
    if (!isPaused.value) next()
  }, props.intervalMs)
}

onMounted(() => {
  restartInterval()
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})

watch(
  () => props.items,
  () => {
    currentIndex.value = 0
    progressKey.value++
    restartInterval()
  },
)
</script>

<style scoped>
/* ── Crossfade transition ──────────────────────────────────────────── */
.hero-xfade-enter-active,
.hero-xfade-leave-active {
  position: absolute;
  inset: 0;
  transition: opacity 0.55s ease;
}

.hero-xfade-enter-active {
  z-index: 1;
}

.hero-xfade-leave-active {
  z-index: 0;
}

.hero-xfade-enter-from,
.hero-xfade-leave-to {
  opacity: 0;
}

/* ── Description slide-up ─────────────────────────────────────────── */
.desc-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.desc-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.desc-slide-leave-active {
  /* Instant removal; the entering version slides in over the gap */
  transition: none;
  opacity: 0;
}

/* ── Auto-advance progress bar ────────────────────────────────────── */
.progress-fill {
  width: 0;
  animation: progress-expand var(--interval) linear forwards;
  transform-origin: left;
}

.progress-fill.animation-paused {
  animation-play-state: paused;
}

@keyframes progress-expand {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-xfade-enter-active,
  .hero-xfade-leave-active {
    transition: none;
  }

  .desc-slide-enter-active {
    transition: none;
  }

  .progress-fill {
    animation: none;
    width: 100%;
  }
}
</style>
