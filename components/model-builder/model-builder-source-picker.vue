<!-- /components/model-builder/model-builder-source-picker.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div>
      <h3 class="text-base font-black text-base-content">1. Pick a source model</h3>
      <p class="mt-1 text-xs text-base-content/60">
        Choose the existing record to upgrade or expand from. Every run keeps a
        snapshot of this source.
      </p>
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
    <div class="min-h-0 flex-1">
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

      <div
        v-else
        class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        <button
          v-for="record in store.sources"
          :key="record.id"
          type="button"
          class="flex flex-col items-start gap-0.5 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-base-200"
          @click="store.selectSource(record)"
        >
          <span class="truncate text-sm font-bold text-base-content">
            {{ store.sourceLabel(record) }}
          </span>
          <span
            v-if="subtitle(record)"
            class="line-clamp-2 text-xs text-base-content/55"
          >
            {{ subtitle(record) }}
          </span>
          <span class="mt-1 text-[10px] uppercase tracking-wide text-base-content/35">
            #{{ record.id }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { SourceRecord } from '@/stores/modelBuilderStore'
import { SOURCE_TYPES, getSourceType } from '@/stores/helpers/modelBuilderRecipes'

const store = useModelBuilderStore()
const sourceTypes = SOURCE_TYPES

const activeType = computed(() =>
  store.sourceType ? getSourceType(store.sourceType) : undefined,
)

function subtitle(record: SourceRecord): string {
  const field = activeType.value?.subtitleField
  if (!field) return ''
  const value = record[field]
  return typeof value === 'string' ? value : ''
}
</script>
