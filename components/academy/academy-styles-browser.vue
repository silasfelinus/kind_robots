<!-- /components/academy/academy-styles-browser.vue -->
<template>
  <section class="flex flex-col gap-4">
    <header
      class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div class="flex min-w-0 flex-col gap-1">
        <h2
          class="flex items-center gap-2 text-base font-black text-base-content"
        >
          <Icon
            name="kind-icon:palette"
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />
          Style Gallery
        </h2>
        <p class="text-sm text-base-content/70">
          Every style the Academy teaches. Open a lesson, learn to spot it, then
          remix your own image in it.
        </p>
      </div>

      <div class="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <div
          class="join"
          role="group"
          aria-label="Filter Academy lessons by progress"
        >
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

        <div class="flex w-full items-center gap-2 sm:w-auto">
          <label
            class="input input-bordered input-sm flex min-w-0 flex-1 items-center gap-1.5 bg-base-100 sm:w-64"
          >
            <Icon
              name="kind-icon:search"
              class="h-3.5 w-3.5 shrink-0 text-base-content/40"
              aria-hidden="true"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              class="min-w-0 flex-1 bg-transparent"
              placeholder="Search styles…"
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

        <p
          class="text-xs font-semibold text-base-content/50"
          aria-live="polite"
        >
          {{ resultSummary }}
        </p>
      </div>
    </header>

    <div
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-bold text-base-content">
            {{ progressHeadline }}
          </p>
          <span class="text-xs font-semibold text-base-content/50">
            {{ progressPercent }}%
          </span>
        </div>
        <progress
          class="progress progress-primary mt-2 w-full"
          :value="academyStore.viewedLessons.length"
          :max="academyStore.timeline.length || 1"
          :aria-label="`${academyStore.viewedLessons.length} of ${academyStore.timeline.length} Academy lessons explored`"
        />
        <p class="mt-1 text-xs text-base-content/60">
          {{ progressMessage }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-sm shrink-0"
        @click="openNextLesson"
      >
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
    >
      <academy-style-detail
        :key="expandedStyle.slug"
        :lesson="expandedStyle"
        @close="closeStyle"
        @remix="emit('remix', $event)"
      />
    </div>

    <div
      class="grid gap-3"
      style="
        grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
      "
    >
      <button
        v-for="style in filteredStyles"
        :key="style.slug"
        :ref="(el) => setGridRef(style.slug, el)"
        type="button"
        class="group flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-150"
        :class="
          expandedSlug === style.slug
            ? 'border-primary shadow-md shadow-primary/20'
            : 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-sm'
        "
        :aria-expanded="expandedSlug === style.slug"
        :aria-controls="
          expandedSlug === style.slug
            ? `academy-style-detail-${style.slug}`
            : undefined
        "
        @click="expandedSlug = expandedSlug === style.slug ? null : style.slug"
      >
        <div
          v-if="style.previewImageSrc"
          class="relative -mx-4 -mt-4 w-[calc(100%+2rem)] overflow-hidden rounded-t-xl"
          style="aspect-ratio: 16 / 9"
        >
          <img
            :src="style.previewImageSrc"
            :alt="style.name"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <template v-if="academyStore.viewedLessons.includes(style.slug)">
            <Icon
              name="kind-icon:check"
              class="absolute right-1.5 top-1.5 h-4 w-4 rounded-full bg-base-100/80 p-0.5 text-success"
              aria-hidden="true"
            />
            <span class="sr-only">Lesson explored</span>
          </template>
        </div>
        <div v-else class="flex items-center justify-between gap-2">
          <span class="text-2xl leading-none" aria-hidden="true">🏛️</span>
          <template v-if="academyStore.viewedLessons.includes(style.slug)">
            <Icon
              name="kind-icon:check"
              class="h-4 w-4 text-success"
              aria-hidden="true"
            />
            <span class="sr-only">Lesson explored</span>
          </template>
        </div>
        <div class="flex flex-col">
          <span
            class="text-sm font-black text-base-content group-hover:text-primary"
          >
            {{ style.name }}
          </span>
          <span class="text-xs text-base-content/50">
            {{ style.era }} · {{ style.region }}
          </span>
        </div>
        <p class="line-clamp-2 text-xs leading-relaxed text-base-content/60">
          {{ style.keyIdeas }}
        </p>
      </button>
    </div>

    <div
      v-if="!filteredStyles.length"
      class="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200/60 px-4 text-center"
    >
      <Icon
        :name="emptyStateIcon"
        class="h-8 w-8 text-base-content/20"
        aria-hidden="true"
      />
      <p class="mt-1 text-xs text-base-content/40">
        {{ emptyStateMessage }}
      </p>
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
    detailPanelRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  })
})

const gridRefs = new Map<string, HTMLButtonElement>()

function setGridRef(
  slug: string,
  el: Element | ComponentPublicInstance | null,
) {
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
  expandedSlug.value =
    nextLesson.value?.slug ?? academyStore.timeline[0]?.slug ?? null
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
  return (
    academyStore.styles.find((style) => style.slug === expandedSlug.value) ??
    null
  )
})

const nextLesson = computed<AcademyStyle | null>(() => {
  return (
    academyStore.timeline.find(
      (style) => !academyStore.viewedLessons.includes(style.slug),
    ) ?? null
  )
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
  if (!academyStore.timeline.length) {
    return 'The Academy is gathering its lesson collection.'
  }
  if (!nextLesson.value) {
    return 'You explored every lesson. Revisit any movement whenever inspiration gets suspiciously quiet.'
  }
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
  return lessonFilter.value === 'new' ? 'kind-icon:check' : 'kind-icon:search'
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
