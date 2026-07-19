<!-- /components/newsfeed/newsfeed-filters.vue -->
<!--
  Programmable feed filters (conductor projects/newsfeed t-008). A declarative
  configuration layer on top of feedPreferenceStore (t-004/t-007) -- include/
  exclude keywords, per-source toggles within the user's enabled feeds,
  category selection, and sort mode. No arbitrary executable user code per
  DESIGN-BRIEF.md; filtering happens in stores/helpers/newsfeed.ts's pure
  applyNewsfeedFilters(), consumed by newsfeed-feed.vue.
-->
<template>
  <div class="kr-panel-flat flex flex-col gap-4 p-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="font-black">Filters</h3>
        <p class="text-xs text-base-content/55">
          Program what shows up -- keywords, sources, categories, and sort.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-xl"
        @click="clearFilters()"
      >
        Clear filters
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="flex flex-col gap-1.5">
        <label for="newsfeed-include-keyword" class="text-xs font-bold">
          Only show items matching
        </label>
        <div class="flex gap-1.5">
          <input
            id="newsfeed-include-keyword"
            v-model="includeDraft"
            type="text"
            placeholder="e.g. robotics"
            class="input input-sm input-bordered w-full rounded-xl"
            @keydown.enter.prevent="submitInclude()"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary rounded-xl"
            :disabled="!includeDraft.trim()"
            @click="submitInclude()"
          >
            <Icon name="kind-icon:plus" class="size-4" />
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="word in feedPreferenceStore.includeKeywords"
            :key="word"
            class="badge badge-primary gap-1 rounded-xl"
          >
            {{ word }}
            <button
              type="button"
              aria-label="Remove include keyword"
              @click="feedPreferenceStore.removeIncludeKeyword(word)"
            >
              <Icon name="kind-icon:close" class="size-3" />
            </button>
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="newsfeed-exclude-keyword" class="text-xs font-bold">
          Hide items matching
        </label>
        <div class="flex gap-1.5">
          <input
            id="newsfeed-exclude-keyword"
            v-model="excludeDraft"
            type="text"
            placeholder="e.g. crypto"
            class="input input-sm input-bordered w-full rounded-xl"
            @keydown.enter.prevent="submitExclude()"
          />
          <button
            type="button"
            class="btn btn-sm btn-primary rounded-xl"
            :disabled="!excludeDraft.trim()"
            @click="submitExclude()"
          >
            <Icon name="kind-icon:plus" class="size-4" />
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="word in feedPreferenceStore.excludeKeywords"
            :key="word"
            class="badge badge-error gap-1 rounded-xl"
          >
            {{ word }}
            <button
              type="button"
              aria-label="Remove exclude keyword"
              @click="feedPreferenceStore.removeExcludeKeyword(word)"
            >
              <Icon name="kind-icon:close" class="size-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <div v-if="categories.length" class="flex flex-col gap-1.5">
      <span class="text-xs font-bold">Categories</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="btn btn-xs gap-1 rounded-xl"
          :class="
            isCategorySelected(category)
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="feedPreferenceStore.toggleCategory(category)"
        >
          <Icon name="kind-icon:tag" class="size-3" />
          {{ category }}
        </button>
      </div>
    </div>

    <div
      v-if="feedPreferenceStore.availableSources.length"
      class="flex flex-col gap-1.5"
    >
      <span class="text-xs font-bold">Sources</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="source in feedPreferenceStore.availableSources"
          :key="source.id"
          type="button"
          class="btn btn-xs rounded-xl"
          :class="
            feedPreferenceStore.isSourceDisabled(source.id)
              ? 'btn-ghost border border-base-300 opacity-50'
              : 'btn-ghost border border-primary/40 text-primary'
          "
          :aria-pressed="!feedPreferenceStore.isSourceDisabled(source.id)"
          @click="feedPreferenceStore.toggleSource(source.id)"
        >
          {{ source.name }}
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-bold">Perspective balance</span>
      <p class="text-xs text-base-content/55">
        Only reshapes feeds that carry political coverage (e.g. Activism) —
        other feeds are never affected.
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="mode in perspectiveModes"
          :key="mode.value"
          type="button"
          class="btn btn-xs rounded-xl"
          :class="
            feedPreferenceStore.perspectiveMode === mode.value
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          :aria-pressed="feedPreferenceStore.perspectiveMode === mode.value"
          @click="feedPreferenceStore.setPerspectiveMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
      <label class="flex w-fit items-center gap-2 pt-1 text-xs font-bold">
        <input
          type="checkbox"
          class="toggle toggle-primary toggle-sm"
          :checked="feedPreferenceStore.labelsVisible"
          @change="
            feedPreferenceStore.setLabelsVisible(
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        Show perspective labels
      </label>
    </div>

    <div class="flex items-center gap-2">
      <label for="newsfeed-sort-mode" class="text-xs font-bold">Sort by</label>
      <select
        id="newsfeed-sort-mode"
        class="select select-sm select-bordered rounded-xl"
        :value="feedPreferenceStore.sortMode"
        @change="
          feedPreferenceStore.setSortMode(
            ($event.target as HTMLSelectElement).value === 'relevance'
              ? 'relevance'
              : 'recent',
          )
        "
      >
        <option value="recent">Most recent</option>
        <option value="relevance">Most relevant to my keywords</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NewsFeedItem, PerspectiveMode } from '@/stores/helpers/newsfeed'
import { useFeedPreferenceStore } from '@/stores/feedPreferenceStore'

const props = defineProps<{
  /** Currently loaded items, used only to derive the category chip list. */
  items: NewsFeedItem[]
}>()

const feedPreferenceStore = useFeedPreferenceStore()

const includeDraft = ref('')
const excludeDraft = ref('')

// Custom (per-bucket weight sliders) is deferred per this task's own note --
// "Custom per-bucket weights ... may follow once the simple modes work
// cleanly." The store/type already support it for forward compatibility.
const perspectiveModes: Array<{ value: Exclude<PerspectiveMode, 'custom'>; label: string }> = [
  { value: 'focused', label: 'Focused' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'broad', label: 'Broad spectrum' },
]

const categories = computed<string[]>(() => {
  const seen = new Set<string>()
  const list: string[] = []
  for (const item of props.items) {
    for (const category of item.category) {
      const key = category.trim()
      if (!key || seen.has(key.toLowerCase())) continue
      seen.add(key.toLowerCase())
      list.push(key)
    }
  }
  return list.sort((a, b) => a.localeCompare(b)).slice(0, 24)
})

function isCategorySelected(category: string): boolean {
  return feedPreferenceStore.selectedCategories.some(
    (c) => c.toLowerCase() === category.toLowerCase(),
  )
}

function submitInclude(): void {
  const word = includeDraft.value.trim()
  if (!word) return
  feedPreferenceStore.addIncludeKeyword(word)
  includeDraft.value = ''
}

function submitExclude(): void {
  const word = excludeDraft.value.trim()
  if (!word) return
  feedPreferenceStore.addExcludeKeyword(word)
  excludeDraft.value = ''
}

function clearFilters(): void {
  for (const word of [...feedPreferenceStore.includeKeywords]) {
    feedPreferenceStore.removeIncludeKeyword(word)
  }
  for (const word of [...feedPreferenceStore.excludeKeywords]) {
    feedPreferenceStore.removeExcludeKeyword(word)
  }
  for (const category of [...feedPreferenceStore.selectedCategories]) {
    feedPreferenceStore.toggleCategory(category)
  }
  for (const sourceId of [...feedPreferenceStore.disabledSourceIds]) {
    feedPreferenceStore.toggleSource(sourceId)
  }
  feedPreferenceStore.setSortMode('recent')
}
</script>
