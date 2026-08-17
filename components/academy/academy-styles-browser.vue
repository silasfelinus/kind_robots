<!-- /components/academy/academy-styles-browser.vue -->
<template>
  <section class="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
    <header
      class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5 lg:flex-row lg:items-end lg:justify-between"
    >
      <div class="min-w-0 max-w-2xl">
        <p class="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-primary">
          <Icon name="kind-icon:palette" class="h-4 w-4" aria-hidden="true" />
          Browse the collection
        </p>
        <h2 class="mt-2 text-2xl font-black text-base-content sm:text-3xl">Style Gallery</h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/65">
          Start with the image. Open whatever catches your eye, learn how to recognize it, then remix your own source in that visual language.
        </p>
      </div>

      <div class="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <div class="join" role="group" aria-label="Filter Academy lessons by progress">
            <button
              v-for="option in lessonFilterOptions"
              :key="option.value"
              type="button"
              class="btn btn-sm join-item"
              :class="lessonFilter === option.value ? 'btn-primary' : 'btn-ghost'"
              :aria-pressed="lessonFilter === option.value"
              @click="lessonFilter = option.value"
            >
              <Icon :name="option.icon" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ option.label }}
            </button>
          </div>

          <div class="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
            <label class="input input-bordered input-sm flex min-w-0 flex-1 items-center gap-1.5 bg-base-100 lg:w-72">
              <Icon name="kind-icon:search" class="h-3.5 w-3.5 shrink-0 text-base-content/40" aria-hidden="true" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="search"
                class="min-w-0 flex-1 bg-transparent"
                placeholder="Search styles, artists, eras…"
                aria-label="Search Academy styles"
              />
            </label>
            <button
              v-if="searchQuery"
              type="button"
              class="btn btn-circle btn-ghost btn-sm shrink-0"
              aria-label="Clear style search"
              title="Clear search"
              @click="clearSearch"
            >
              <Icon name="mdi:close" class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p class="text-xs font-semibold text-base-content/50" aria-live="polite">
          {{ resultSummary }}
        </p>
      </div>
    </header>

    <div class="flex flex-wrap items-center gap-3 rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
      <div class="min-w-[min(100%,20rem)] flex-1">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-black text-base-content">{{ progressHeadline }}</p>
            <p class="mt-0.5 text-xs text-base-content/55">{{ progressMessage }}</p>
          </div>
          <span class="text-sm font-black text-primary">{{ progressPercent }}%</span>
        </div>
        <progress
          class="progress progress-primary mt-3 w-full"
          :value="academyStore.viewedLessons.length"
          :max="academyStore.timeline.length || 1"
          :aria-label="`${academyStore.viewedLessons.length} of ${academyStore.timeline.length} Academy lessons explored`"
        />
      </div>
      <button type="button" class="btn btn-primary btn-sm rounded-2xl" @click="openNextLesson">
        <Icon
          :name="nextLesson ? 'kind-icon:arrow-right' : 'kind-icon:refresh'"
          class="h-4 w-4"
          aria-hidden="true"
        />
        {{ nextLesson ? 'Continue learning' : 'Review from the start' }}
      </button>
    </div>

    <div
      v-if="expandedStyle"
      :id="`academy-style-detail-${expandedStyle.slug}`"
      ref="detailPanelRef"
      class="py-1"
    >
      <academy-style-detail
        :key="expandedStyle.slug"
        :lesson="expandedStyle"
        @close="closeStyle"
        @remix="emit('remix', $event)"
      />
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
      <button
        v-for="style in filteredStyles"
        :key="style.slug"
        :ref="(el) => setGridRef(style.slug, el)"
        type="button"
        class="group relative aspect-[4/5] min-w-0 overflow-hidden rounded-3xl border-2 bg-base-200 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="expandedSlug === style.slug ? 'border-primary shadow-lg shadow-primary/20' : 'border-base-300 hover:border-primary/55'"
        :aria-expanded="expandedSlug === style.slug"
        :aria-controls="expandedSlug === style.slug ? `academy-style-detail-${style.slug}` : undefined"
        @click="expandedSlug = expandedSlug === style.slug ? null : style.slug"
      >
        <img
          v-if="style.previewImageSrc"
          :src="style.previewImageSrc"
          :alt="`${style.name} style preview`"
          loading="lazy"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div v-else class="absolute inset-0 flex items-center justify-center bg-base-200">
          <Icon name="kind-icon:gallery" class="h-10 w-10 text-base-content/20" />
        </div>

        <div class="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-black/10" />

        <div class="absolute left-2.5 top-2.5 flex max-w-[calc(100%-3rem)] flex-wrap gap-1">
          <span class="badge border-0 bg-black/45 text-[0.6rem] font-bold text-white backdrop-blur">
            {{ style.era }}
          </span>
        </div>

        <div
          v-if="academyStore.viewedLessons.includes(style.slug)"
          class="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-success text-success-content shadow-md"
          title="Lesson explored"
        >
          <Icon name="kind-icon:check" class="h-3.5 w-3.5" aria-hidden="true" />
          <span class="sr-only">Lesson explored</span>
        </div>

        <div class="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p class="text-base font-black leading-tight text-white drop-shadow sm:text-lg">
            {{ style.name }}
          </p>
          <p class="mt-1 truncate text-[0.68rem] font-semibold text-white/65">{{ style.region }}</p>
          <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-white/78">
            {{ style.recognitionCues[0] }}
          </p>
          <div class="mt-3 flex items-center gap-1 text-[0.68rem] font-black uppercase tracking-wide text-white/90">
            Open lesson
            <Icon name="kind-icon:arrow-right" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </div>
      </button>
    </div>

    <div
      v-if="!filteredStyles.length"
      class="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-base-300 bg-base-100 px-4 text-center shadow-sm"
    >
      <Icon :name="emptyStateIcon" class="h-8 w-8 text-base-content/20" aria-hidden="true" />
      <p class="mt-2 text-sm text-base-content/45">{{ emptyStateMessage }}</p>
      <button
        v-if="searchQuery || lessonFilter !== 'all'"
        type="button"
        class="btn btn-ghost btn-xs mt-2"
        @click="resetFilters"
      >
        Show every lesson
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import type { AcademyStyle } from '@/stores/seeds/academyStyles'

type LessonFilter = 'all' | 'new' | 'explored'

const emit = defineEmits<{
  remix: [styleSlug: string]
}>()

const academyStore = useAcademyStore()

const searchQuery = ref('')
const lessonFilter = ref<LessonFilter>('all')
const expandedSlug = ref<string | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const detailPanelRef = ref<HTMLElement | null>(null)

const lessonFilterOptions: Array<{
  value: LessonFilter
  label: string
  icon: string
}> = [
  { value: 'all', label: 'All', icon: 'kind-icon:gallery' },
  { value: 'new', label: 'New', icon: 'kind-icon:sparkles' },
  { value: 'explored', label: 'Explored', icon: 'kind-icon:check' },
]

watch(expandedSlug, (slug) => {
  if (!slug) return
  nextTick(() => {
    detailPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
})

const gridRefs = new Map<string, HTMLButtonElement>()

function setGridRef(slug: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLButtonElement) {
    gridRefs.set(slug, el)
  } else {
    gridRefs.delete(slug)
  }
}

function closeStyle() {
  const slug = expandedSlug.value
  expandedSlug.value = null
  nextTick(() => {
    const target = (slug && gridRefs.get(slug)) || searchInputRef.value
    target?.focus()
  })
}

function clearSearch() {
  searchQuery.value = ''
  nextTick(() => searchInputRef.value?.focus())
}

function resetFilters() {
  searchQuery.value = ''
  lessonFilter.value = 'all'
  nextTick(() => searchInputRef.value?.focus())
}

function openNextLesson() {
  searchQuery.value = ''
  lessonFilter.value = 'all'
  expandedSlug.value = nextLesson.value?.slug ?? academyStore.timeline[0]?.slug ?? null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && expandedSlug.value) {
    closeStyle()
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

const expandedStyle = computed<AcademyStyle | null>(() => {
  if (!expandedSlug.value) return null
  return academyStore.styles.find((style) => style.slug === expandedSlug.value) ?? null
})

const nextLesson = computed<AcademyStyle | null>(() => {
  return academyStore.timeline.find((style) => !academyStore.viewedLessons.includes(style.slug)) ?? null
})

const progressPercent = computed(() => {
  const total = academyStore.timeline.length
  if (!total) return 0
  return Math.round((academyStore.viewedLessons.length / total) * 100)
})

const progressHeadline = computed(() => {
  if (!academyStore.timeline.length) return 'Lessons are loading'
  if (!nextLesson.value) return 'Gallery complete'
  if (!academyStore.viewedLessons.length) return 'Start your art-history tour'
  return 'Keep your gallery streak going'
})

const progressMessage = computed(() => {
  if (!academyStore.timeline.length) return 'The Academy is gathering its lesson collection.'
  if (!nextLesson.value) return 'You explored every lesson. Revisit any movement whenever inspiration gets suspiciously quiet.'
  return `Up next: ${nextLesson.value.name} · ${nextLesson.value.era}`
})

const filteredStyles = computed<AcademyStyle[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return academyStore.timeline.filter((style) => {
    const isViewed = academyStore.viewedLessons.includes(style.slug)
    const matchesProgress =
      style.slug === expandedSlug.value ||
      lessonFilter.value === 'all' ||
      (lessonFilter.value === 'explored' && isViewed) ||
      (lessonFilter.value === 'new' && !isViewed)

    if (!matchesProgress) return false
    if (style.slug === expandedSlug.value) return true
    if (!query) return true

    return [
      style.name,
      style.era,
      style.region,
      style.keyIdeas,
      ...style.recognitionCues,
      ...style.artists.map((artist) => artist.name),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const resultSummary = computed(() => {
  const shown = filteredStyles.value.length
  const total = academyStore.timeline.length
  const noun = shown === 1 ? 'lesson' : 'lessons'
  return `${shown} ${noun} shown · ${academyStore.viewedLessons.length} explored of ${total}`
})

const emptyStateIcon = computed(() => {
  if (searchQuery.value) return 'kind-icon:search'
  if (lessonFilter.value === 'new') return 'kind-icon:check'
  if (lessonFilter.value === 'explored') return 'kind-icon:gallery'
  return 'kind-icon:search'
})

const emptyStateMessage = computed(() => {
  if (lessonFilter.value === 'new' && !searchQuery.value) {
    return 'You explored every lesson. Art history officially fears you now.'
  }
  if (lessonFilter.value === 'explored' && !searchQuery.value) {
    return 'No explored lessons yet. Open one and your progress will appear here.'
  }
  return `No styles match “${searchQuery.value}”. Try a broader search or reset the filters.`
})
</script>
