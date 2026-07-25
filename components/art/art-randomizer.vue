<!-- /components/art/art-randomizer.vue -->
<template>
  <div class="w-full space-y-6">
    <div class="border rounded-xl bg-base-200 p-4 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-lg">🎲 Facet Randomizer</h3>
          <p class="text-sm opacity-70">
            Styles, themes, palettes, and bonus rolls come from the canonical Facet catalog.
          </p>
        </div>
        <NuxtLink to="/facets" class="btn btn-sm btn-outline">
          Manage Facets
        </NuxtLink>
      </div>
    </div>

    <div
      v-for="entry in artListPresets"
      :key="entry.id"
      class="border rounded-xl bg-base-200 p-4 space-y-3"
    >
      <button
        class="w-full flex justify-between items-center font-semibold text-left text-lg"
        @click="toggleExpanded(entry.id)"
      >
        <span class="flex items-center gap-2">{{ entry.title }}</span>
        <Icon
          :name="
            expandedPresets[entry.id]
              ? 'lucide:chevron-up'
              : 'lucide:chevron-down'
          "
        />
      </button>

      <Transition name="slide-fade" appear>
        <div v-show="expandedPresets[entry.id]" class="space-y-2 pt-2">
          <div v-if="entry.content.length" class="flex flex-wrap gap-2">
            <button
              v-for="option in visibleOptions(entry)"
              :key="option"
              class="btn btn-sm"
              :class="isSelected(entry.id, option) ? 'btn-primary' : 'btn-outline'"
              @click="toggleMultiSelection(entry.id, option)"
            >
              {{ option }}
            </button>
          </div>
          <p v-else class="text-sm opacity-60">
            No active Facets are available for this category yet.
          </p>

          <div v-if="entry.content.length > 20" class="mt-2">
            <button
              class="btn btn-xs btn-ghost underline"
              @click="toggleShowAll(entry.id)"
            >
              {{ showAll[entry.id] ? 'Show Less' : 'Show More' }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="border rounded-xl bg-base-200 p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-semibold">🎯 Bonus Facet Rolls</h3>
        <div class="flex gap-2">
          <button class="btn btn-xs btn-secondary" @click="randomStore.applyMakePretty()">
            Make Pretty
          </button>
          <button class="btn btn-xs btn-accent" @click="randomStore.applySurprise()">
            Surprise Me
          </button>
          <button class="btn btn-xs btn-ghost" @click="randomStore.resetAll()">
            Reset
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="key in supportedRandomKeys"
          :key="key"
          class="btn btn-sm"
          :class="randomStore.randomSelections[key] ? 'btn-primary' : 'btn-outline'"
          @click="randomStore.toggleSelection(key)"
        >
          {{ labelForKey(key) }}
        </button>
      </div>

      <div
        v-if="Object.keys(randomStore.randomSelections).length"
        class="text-sm mt-2 text-base-content/70"
      >
        <span class="font-semibold">Active random additions:</span>
        <div class="flex flex-wrap gap-2 mt-2">
          <span
            v-for="(value, key) in randomStore.randomSelections"
            :key="key"
            class="badge badge-outline flex items-center gap-1"
          >
            {{ labelForKey(String(key)) }} → {{ value }}
            <button
              class="ml-1 hover:text-error"
              :title="`Remove ${String(key)}`"
              @click="randomStore.clearSelection(String(key))"
            >
              ❌
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { ArtListEntry } from '@/stores/seeds/artList'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'

const artStore = useArtStore()
const randomStore = useRandomStore()

const artListPresets = computed(() => randomStore.catalogPresets)
const supportedRandomKeys = computed(() => randomStore.supportedKeys)
const expandedPresets = ref<Record<string, boolean>>({})
const showAll = ref<Record<string, boolean>>({})

watch(
  artListPresets,
  (entries) => {
    for (const entry of entries) {
      expandedPresets.value[entry.id] ??= false
      showAll.value[entry.id] ??= false
    }
  },
  { immediate: true },
)

onMounted(() => {
  void randomStore.initialize()
})

function labelForKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase())
}

function toggleMultiSelection(entryId: string, value: string): void {
  const current = artStore.artListSelections[entryId] ?? []
  const updated = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value]
  artStore.updateArtListSelection(entryId, updated)
}

function isSelected(entryId: string, value: string): boolean {
  return artStore.artListSelections[entryId]?.includes(value) ?? false
}

function visibleOptions(entry: ArtListEntry): string[] {
  const selected = artStore.artListSelections[entry.id] ?? []
  const firstSet = entry.content.slice(0, 20)
  const rest = entry.content.slice(20)
  return showAll.value[entry.id]
    ? entry.content
    : [...firstSet, ...rest.filter((value) => selected.includes(value))]
}

function toggleExpanded(id: string): void {
  expandedPresets.value[id] = !expandedPresets.value[id]
}

function toggleShowAll(id: string): void {
  showAll.value[id] = !showAll.value[id]
}

watchEffect(() => {
  for (const [key, value] of Object.entries(randomStore.randomSelections)) {
    if (value) artStore.updateArtListSelection(key, [value])
  }
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-active {
  max-height: 0;
  opacity: 0;
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
