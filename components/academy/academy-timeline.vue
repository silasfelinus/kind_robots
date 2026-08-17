<!-- /components/academy/academy-timeline.vue -->
<template>
  <section class="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
    <header
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,30rem),1fr))] overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div class="flex flex-col justify-center gap-4 p-5 sm:p-7">
        <div class="flex items-center gap-2 text-primary">
          <Icon name="kind-icon:map" class="h-5 w-5" aria-hidden="true" />
          <span class="text-xs font-black uppercase tracking-[0.18em]">
            Art history, room by room
          </span>
        </div>
        <div class="max-w-2xl">
          <h2 class="text-2xl font-black leading-tight text-base-content sm:text-3xl">
            The Art History Timeline
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-base-content/70 sm:text-base">
            Start with the pictures. Move through thirty-three centuries of style,
            open whatever catches your eye, then turn what you learn into a remix.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span class="badge badge-primary badge-outline">
            {{ academyStore.lessonsViewedCount }}/{{ academyStore.timeline.length }} explored
          </span>
          <span class="badge badge-secondary badge-outline">
            {{ academyStore.stylesRemixedCount }} styles remixed
          </span>
        </div>
      </div>

      <div
        class="grid min-h-52 grid-cols-3 border-t border-base-300 bg-base-200 lg:min-h-64 lg:border-l lg:border-t-0"
        aria-hidden="true"
      >
        <div
          v-for="(style, index) in heroStyles"
          :key="style.slug"
          class="relative overflow-hidden"
          :class="index === 1 ? 'border-x border-base-300' : ''"
        >
          <img
            v-if="style.previewImageSrc"
            :src="style.previewImageSrc"
            alt=""
            class="h-full w-full object-cover"
            :class="index === 1 ? 'scale-110' : ''"
          />
          <div v-else class="flex h-full items-center justify-center bg-base-200">
            <Icon name="kind-icon:gallery" class="h-10 w-10 text-base-content/20" />
          </div>
          <div class="absolute inset-0 bg-linear-to-t from-base-content/65 via-transparent to-transparent" />
          <p
            class="absolute inset-x-2 bottom-2 line-clamp-2 text-xs font-black leading-tight text-base-100 drop-shadow"
          >
            {{ style.name }}
          </p>
        </div>
      </div>
    </header>

    <div class="flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.16em] text-base-content/45">
          Chronological gallery
        </p>
        <p class="mt-1 text-sm text-base-content/65">
          Each image opens into a lesson, gallery wall, and remix path.
        </p>
      </div>
      <p class="text-xs font-semibold text-base-content/45">Earliest → latest</p>
    </div>

    <ol
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4"
      aria-label="Art history timeline lessons"
    >
      <li
        v-for="(style, index) in academyStore.timeline"
        :key="style.slug"
        class="min-w-0"
        :class="expandedSlug === style.slug ? 'col-span-full' : ''"
      >
        <button
          v-if="expandedSlug !== style.slug"
          :ref="(el) => setToggleRef(style.slug, el)"
          type="button"
          class="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-base-300 bg-base-100 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded="false"
          :aria-controls="`academy-style-detail-${style.slug}`"
          @click="expandedSlug = style.slug"
        >
          <div class="relative w-full overflow-hidden bg-base-200" :class="timelineImageAspect(index)">
            <img
              v-if="style.previewImageSrc"
              :src="style.previewImageSrc"
              :alt="`${style.name} style preview`"
              loading="lazy"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div v-else class="flex h-full items-center justify-center">
              <Icon name="kind-icon:gallery" class="h-10 w-10 text-base-content/20" />
            </div>

            <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/10" />

            <div class="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span class="badge border-0 bg-base-100/90 text-[0.65rem] font-bold text-base-content shadow-sm backdrop-blur">
                {{ style.era }}
              </span>
              <span class="badge border-0 bg-base-100/80 text-[0.65rem] text-base-content/75 shadow-sm backdrop-blur">
                {{ style.region }}
              </span>
            </div>

            <div
              v-if="academyStore.viewedLessons.includes(style.slug)"
              class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-content shadow-md"
              title="Lesson explored"
            >
              <Icon name="kind-icon:check" class="h-4 w-4" aria-hidden="true" />
              <span class="sr-only">Lesson explored</span>
            </div>

            <div class="absolute inset-x-0 bottom-0 p-4">
              <p class="text-lg font-black leading-tight text-white drop-shadow sm:text-xl">
                {{ style.name }}
              </p>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-3 p-4">
            <p class="line-clamp-2 text-sm leading-relaxed text-base-content/70">
              {{ style.recognitionCues[0] }}
            </p>
            <div class="mt-auto flex items-center justify-between gap-3 text-xs font-bold text-primary">
              <span>Enter the gallery</span>
              <Icon
                name="kind-icon:arrow-right"
                class="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </div>
        </button>

        <div v-else :id="`academy-style-detail-${style.slug}`" class="py-1">
          <academy-style-detail
            :lesson="style"
            @close="closeLesson(style.slug)"
            @remix="emit('remix', $event)"
          />
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type ComponentPublicInstance,
} from 'vue'
import { useAcademyStore } from '@/stores/academyStore'

const emit = defineEmits<{
  remix: [styleSlug: string]
}>()

const academyStore = useAcademyStore()
const expandedSlug = ref<string | null>(null)

const heroStyles = computed(() => {
  const timeline = academyStore.timeline
  if (timeline.length <= 3) return timeline
  const middle = Math.floor(timeline.length / 2)
  return [timeline[0], timeline[middle], timeline[timeline.length - 1]].filter(
    (style): style is NonNullable<typeof style> => Boolean(style),
  )
})

function timelineImageAspect(index: number) {
  if (index % 11 === 0) return 'aspect-[16/9]'
  if (index % 5 === 0) return 'aspect-square'
  return 'aspect-[4/3]'
}

// Collapsing an expanded lesson unmounts its close button (v-if/v-else swap
// with the toggle button), so the browser drops focus to <body> with no
// fix — keyboard/screen-reader users lose their place in the timeline.
// Track each toggle button so we can restore focus to it after closing.
const toggleRefs = new Map<string, HTMLButtonElement>()

function setToggleRef(
  slug: string,
  el: Element | ComponentPublicInstance | null,
) {
  if (el instanceof HTMLButtonElement) {
    toggleRefs.set(slug, el)
  } else {
    toggleRefs.delete(slug)
  }
}

function closeLesson(slug: string) {
  expandedSlug.value = null
  nextTick(() => {
    toggleRefs.get(slug)?.focus()
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && expandedSlug.value) {
    closeLesson(expandedSlug.value)
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>
