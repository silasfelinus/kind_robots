<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl bg-base-300 p-4"
  >
    <!-- Loading / empty states -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else-if="!groups.length"
      class="flex flex-col items-center gap-2 rounded-2xl bg-base-100 p-10 text-center"
    >
      <Icon name="kind-icon:moon" class="h-10 w-10 text-primary opacity-70" />
      <h2 class="text-xl font-bold">No daily dream yet</h2>
      <p class="max-w-md text-sm opacity-70">
        Conductor proposes a new starter dream each morning and builds it the
        next day — the first one will appear here once its records land.
      </p>
    </div>

    <template v-else>
      <!-- Header: the active dream -->
      <header
        class="flex flex-col gap-2 rounded-2xl bg-base-100 p-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm text-primary">
            <Icon name="kind-icon:moon" class="h-5 w-5" />
            <span class="font-semibold uppercase tracking-wide">Daily Dream</span>
            <span v-if="active?.date" class="badge badge-ghost badge-sm">{{
              active.date
            }}</span>
          </div>
          <h1 class="truncate text-2xl font-black md:text-3xl">
            {{ activeTitle }}
          </h1>
          <p v-if="activeIdea" class="mt-1 max-w-3xl text-sm opacity-80">
            {{ activeIdea }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <a
            v-if="editLink"
            :href="editLink"
            target="_blank"
            rel="noopener"
            class="btn btn-primary btn-sm"
          >
            <Icon name="kind-icon:message-square-magic" class="h-4 w-4" />
            Comment / edit this dream
          </a>
          <select
            v-if="groups.length > 1"
            v-model="selectedSlug"
            class="select select-bordered select-sm"
            aria-label="Choose a dream day"
          >
            <option v-for="g in groups" :key="g.slug" :value="g.slug">
              {{ g.date }} — {{ g.title }}
            </option>
          </select>
        </div>
      </header>

      <!-- The cast: real pitch cards -->
      <div class="flex flex-wrap items-stretch justify-center gap-4">
        <dream-pitch-sheet
          v-for="sheet in activeSheets"
          :key="sheet.id"
          :dream="dreamShim(sheet)"
          :sheet="sheet"
          variant="card"
          :auto-load="false"
          :allow-ensure="false"
          :allow-edit="false"
          :allow-actions="false"
        />
      </div>

      <!-- Art strip: attached images at a glance -->
      <div v-if="artImages.length" class="rounded-2xl bg-base-100 p-4">
        <h2 class="mb-2 flex items-center gap-2 text-lg font-bold">
          <Icon name="kind-icon:palette" class="h-5 w-5 text-primary" />
          Dream art
        </h2>
        <div class="flex flex-wrap gap-3">
          <img
            v-for="img in artImages"
            :key="img.src"
            :src="img.src"
            :alt="img.alt"
            loading="lazy"
            class="h-40 rounded-xl border border-base-200 object-cover"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
// /daily-dream — the rolling daily-dream showcase. Conductor's dream-cycle
// pipeline creates one starter dream per day (2 locations, 3 characters, a
// narrator bot, 2 rewards) as real records with PitchSheets tagged
// extraData.dreamCycle; this page groups those sheets by dream and renders
// the actual dream-pitch-sheet cards.
import { computed, onMounted, ref, watch } from 'vue'
import {
  useSheetStore,
  type SheetDream,
  type SheetWithDream,
} from '@/stores/sheetStore'

const sheetStore = useSheetStore()
const loading = ref(true)
const selectedSlug = ref<string>('')

interface DreamCycleMeta {
  dreamCycle?: string
  proposalDate?: string
  elementType?: string
  element?: string
}

function metaOf(sheet: SheetWithDream): DreamCycleMeta {
  const extra = sheet.extraData
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    return extra as DreamCycleMeta
  }
  return {}
}

const cycleSheets = computed(() =>
  sheetStore.sheets.filter((s) => Boolean(metaOf(s).dreamCycle)),
)

interface DreamGroup {
  slug: string
  date: string
  title: string
  sheets: SheetWithDream[]
}

const ELEMENT_ORDER = ['PITCH', 'LOCATION', 'CHARACTER', 'NARRATOR', 'REWARD', 'SCENARIO']

const groups = computed<DreamGroup[]>(() => {
  const bySlug = new Map<string, DreamGroup>()
  for (const sheet of cycleSheets.value) {
    const meta = metaOf(sheet)
    const slug = meta.dreamCycle as string
    let group = bySlug.get(slug)
    if (!group) {
      group = { slug, date: meta.proposalDate || '', title: '', sheets: [] }
      bySlug.set(slug, group)
    }
    group.sheets.push(sheet)
    if (meta.proposalDate && meta.proposalDate > group.date) {
      group.date = meta.proposalDate
    }
    if (metaOf(sheet).elementType === 'PITCH' && sheet.title) {
      group.title = sheet.title
    }
  }
  const list = [...bySlug.values()]
  for (const g of list) {
    if (!g.title) {
      g.title = g.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    g.sheets.sort(
      (a, b) =>
        ELEMENT_ORDER.indexOf(metaOf(a).elementType || 'PITCH') -
        ELEMENT_ORDER.indexOf(metaOf(b).elementType || 'PITCH'),
    )
  }
  return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
})

const active = computed(
  () =>
    groups.value.find((g) => g.slug === selectedSlug.value) || groups.value[0],
)
const activeSheets = computed(() => active.value?.sheets ?? [])
const pitchSheet = computed(() =>
  activeSheets.value.find((s) => metaOf(s).elementType === 'PITCH'),
)
const activeTitle = computed(() => active.value?.title || 'Daily Dream')
const activeIdea = computed(
  () => pitchSheet.value?.pitch || pitchSheet.value?.hook || '',
)

// Comment/edit link → the conductor backlog file's Notes-from-Silas section.
const editLink = computed(() => {
  const g = active.value
  if (!g?.date || !g.slug) return ''
  return `https://github.com/silasfelinus/conductor/blob/main/projects/dream-cycle/backlog/${g.date}-${g.slug}.md#notes-from-silas`
})

const artImages = computed(() =>
  activeSheets.value
    .filter((s) => s.imagePath)
    .map((s) => ({ src: s.imagePath as string, alt: s.title || 'Dream art' })),
)

function dreamShim(sheet: SheetWithDream): { id: number; dreamType: SheetDream['dreamType'] } {
  // dream-pitch-sheet themes by dream.dreamType; feed it the element type so
  // location/character/narrator/reward cards get their real theming even when
  // the sheet isn't attached to a Dream row.
  return {
    id: sheet.dreamId ?? 0,
    dreamType: (metaOf(sheet).elementType || 'PITCH') as SheetDream['dreamType'],
  }
}

watch(groups, (list) => {
  const first = list[0]
  if (first && !list.some((g) => g.slug === selectedSlug.value)) {
    selectedSlug.value = first.slug
  }
})

onMounted(async () => {
  try {
    await sheetStore.fetchSheets()
  } finally {
    loading.value = false
  }
})
</script>
