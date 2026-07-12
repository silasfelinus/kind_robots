<!-- /components/model-builder/model-builder-source-picker.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-black text-base-content">1. Pick a source model</h3>
        <p class="mt-1 text-xs text-base-content/60">
          Choose the existing record to upgrade or expand from. Every run keeps a
          snapshot of this source.
        </p>
      </div>

      <!-- View toggle — mirrors the project gallery's mode switch -->
      <div class="flex shrink-0 items-center gap-0.5">
        <button
          v-for="mode in viewModes"
          :key="mode.value"
          type="button"
          class="btn btn-xs rounded-md px-1.5"
          :class="
            viewMode === mode.value
              ? 'btn-primary'
              : 'btn-ghost text-base-content/50'
          "
          :title="mode.label"
          @click="setViewMode(mode.value)"
        >
          <Icon :name="mode.icon" class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Source type tabs -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="type in sourceTypes"
        :key="type.key"
        type="button"
        class="btn btn-sm h-9 min-h-9 gap-1.5 rounded-xl px-3 text-xs font-bold"
        :class="
          store.sourceType === type.key
            ? 'btn-primary'
            : 'btn-ghost border border-base-300 text-base-content/70'
        "
        @click="store.selectSourceType(type.key)"
      >
        <Icon :name="type.icon" class="h-4 w-4" />
        {{ type.label }}
      </button>
    </div>

    <p
      v-if="activeType"
      class="rounded-xl bg-base-100 px-3 py-2 text-xs text-base-content/60"
    >
      {{ activeType.blurb }}
    </p>

    <!-- Records -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="!store.sourceType"
        class="flex h-full min-h-32 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/50"
      >
        Select a source type above to load records.
      </div>

      <div
        v-else-if="store.loadingSources"
        class="flex h-full min-h-32 items-center justify-center gap-2 text-sm text-base-content/60"
      >
        <span class="loading loading-dots loading-md" />
        Loading {{ activeType?.plural.toLowerCase() }}…
      </div>

      <div
        v-else-if="store.sourcesError"
        class="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-error/30 bg-error/5 p-6 text-center text-sm text-error"
      >
        <Icon name="kind-icon:warning" class="h-6 w-6" />
        {{ store.sourcesError }}
        <button
          type="button"
          class="btn btn-xs btn-ghost mt-1 rounded-xl"
          @click="store.loadSources()"
        >
          Retry
        </button>
      </div>

      <!-- GALLERY: image-forward tiles, packs tight to kill whitespace -->
      <div
        v-else-if="viewMode === 'gallery'"
        class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      >
        <button
          v-for="record in store.sources"
          :key="record.id"
          type="button"
          class="group flex flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-left transition hover:border-primary hover:shadow-md"
          @click="store.selectSource(record)"
        >
          <div class="grid aspect-square w-full place-items-center overflow-hidden bg-base-200">
            <img
              v-if="recordImage(record)"
              :src="recordImage(record)"
              :alt="store.sourceLabel(record)"
              class="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <Icon
              v-else
              :name="activeType?.icon || 'kind-icon:blueprint'"
              class="h-7 w-7 text-base-content/25"
            />
          </div>
          <div class="min-w-0 p-2">
            <span class="block truncate text-xs font-bold text-base-content">
              {{ store.sourceLabel(record) }}
            </span>
            <span class="text-[10px] uppercase tracking-wide text-base-content/35">
              #{{ record.id }}
            </span>
          </div>
        </button>
      </div>

      <!-- GRID: horizontal cards, thumbnail + text -->
      <div
        v-else-if="viewMode === 'grid'"
        class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <button
          v-for="record in store.sources"
          :key="record.id"
          type="button"
          class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-2.5 text-left transition hover:border-primary hover:bg-base-200"
          @click="store.selectSource(record)"
        >
          <div
            class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-base-200"
          >
            <img
              v-if="recordImage(record)"
              :src="recordImage(record)"
              :alt="store.sourceLabel(record)"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <Icon
              v-else
              :name="activeType?.icon || 'kind-icon:blueprint'"
              class="h-5 w-5 text-base-content/30"
            />
          </div>

          <div class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold text-base-content">
              {{ store.sourceLabel(record) }}
            </span>
            <span
              v-if="subtitle(record)"
              class="line-clamp-2 text-xs text-base-content/55"
            >
              {{ subtitle(record) }}
            </span>
            <span class="text-[10px] uppercase tracking-wide text-base-content/35">
              #{{ record.id }}
            </span>
          </div>
        </button>
      </div>

      <!-- LIST: dense single-column rows for fast scanning -->
      <div v-else class="flex flex-col gap-1">
        <button
          v-for="record in store.sources"
          :key="record.id"
          type="button"
          class="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-2.5 py-1.5 text-left transition hover:border-primary hover:bg-base-200"
          @click="store.selectSource(record)"
        >
          <div
            class="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-base-200"
          >
            <img
              v-if="recordImage(record)"
              :src="recordImage(record)"
              :alt="store.sourceLabel(record)"
              class="h-full w-full object-cover"
              loading="lazy"
            />
            <Icon
              v-else
              :name="activeType?.icon || 'kind-icon:blueprint'"
              class="h-4 w-4 text-base-content/30"
            />
          </div>
          <span class="shrink-0 truncate text-sm font-bold text-base-content">
            {{ store.sourceLabel(record) }}
          </span>
          <span
            v-if="subtitle(record)"
            class="min-w-0 flex-1 truncate text-xs text-base-content/50"
          >
            {{ subtitle(record) }}
          </span>
          <span
            class="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-base-content/35"
          >
            #{{ record.id }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { SourceRecord } from '@/stores/modelBuilderStore'
import { SOURCE_TYPES, getSourceType } from '@/stores/helpers/modelBuilderRecipes'

const store = useModelBuilderStore()
const sourceTypes = SOURCE_TYPES

type ViewMode = 'gallery' | 'grid' | 'list'

const viewModes: { value: ViewMode; label: string; icon: string }[] = [
  { value: 'gallery', label: 'Gallery', icon: 'kind-icon:image' },
  { value: 'grid', label: 'Grid', icon: 'kind-icon:cards' },
  { value: 'list', label: 'List', icon: 'kind-icon:document' },
]

const VIEW_STORAGE_KEY = 'model-builder-source-view'
const viewMode = ref<ViewMode>('grid')

onMounted(() => {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY)
  if (saved && viewModes.some((mode) => mode.value === saved)) {
    viewMode.value = saved as ViewMode
  }
})

function setViewMode(mode: ViewMode): void {
  viewMode.value = mode
  localStorage.setItem(VIEW_STORAGE_KEY, mode)
}

const activeType = computed(() =>
  store.sourceType ? getSourceType(store.sourceType) : undefined,
)

function subtitle(record: SourceRecord): string {
  const field = activeType.value?.subtitleField
  if (!field) return ''
  const value = record[field]
  return typeof value === 'string' ? value : ''
}

// Resolve a record's existing art for the source thumbnail, checking the common
// direct fields then the linked ArtImage.
function recordImage(record: SourceRecord): string {
  const art = record.ArtImage as { thumbnailPath?: string; imagePath?: string } | undefined
  const candidate =
    (record.imagePath as string) ||
    (record.avatarImage as string) ||
    art?.thumbnailPath ||
    art?.imagePath ||
    ''
  return typeof candidate === 'string' ? candidate : ''
}
</script>
