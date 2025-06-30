<template>
  <div class="w-full space-y-6">
    <!-- List Manager (Styled Like Presets) -->
    <div class="border rounded-xl bg-base-200 p-4 space-y-3">
      <button
        class="w-full flex justify-between items-center font-semibold text-left text-lg"
        @click="showManager = !showManager"
      >
        <span class="flex items-center gap-2">🛠️ Manage Custom Lists</span>
        <Icon
          :name="showManager ? 'lucide:chevron-up' : 'lucide:chevron-down'"
        />
      </button>

      <Transition name="slide-fade" appear>
        <div v-show="showManager" class="space-y-2 pt-2">
          <div class="flex flex-wrap gap-4 items-center">
            <label class="label cursor-pointer gap-2">
              <span class="label-text">👤 Show Only Mine</span>
              <input
                type="checkbox"
                class="toggle toggle-primary"
                v-model="onlyMine"
              />
            </label>
            <label class="label cursor-pointer gap-2">
              <span class="label-text">🌐 Show Public Too</span>
              <input
                type="checkbox"
                class="toggle toggle-accent"
                v-model="includePublic"
              />
            </label>
          </div>

          <list-manager
            :only-mine="onlyMine"
            :include-public="includePublic"
          />
        </div>
      </Transition>
    </div>

    <!-- Randomized Presets -->
    <div
      v-for="entry in artListPresets"
      :key="entry.id"
      class="border rounded-xl bg-base-200 p-4 space-y-3"
    >
      <button
        class="w-full flex justify-between items-center font-semibold text-left text-lg"
        @click="toggleExpanded(entry.id)"
      >
        <span class="flex items-center gap-2">
          {{ entry.title }}
        </span>
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
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in visibleOptions(entry)"
              :key="option"
              @click="toggleMultiSelection(entry.id, option)"
              class="btn btn-sm"
              :class="
                isSelected(entry.id, option) ? 'btn-primary' : 'btn-outline'
              "
            >
              {{ option }}
            </button>
          </div>

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

    <!-- Bonus Randoms -->
    <div class="border rounded-xl bg-base-200 p-4 space-y-3">
      <h3 class="font-semibold">🎯 Bonus Randoms</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="key in supportedRandomKeys"
          :key="key"
          @click="toggleRandomKey(key)"
          class="btn btn-sm"
          :class="
            randomStore.randomSelections[key] ? 'btn-primary' : 'btn-outline'
          "
        >
          {{ key }}
        </button>
      </div>

      <div
        v-if="Object.keys(randomStore.randomSelections).length"
        class="text-sm mt-2 text-base-content/70"
      >
        <span class="font-semibold">Active Random Additions:</span>
        <div class="flex flex-wrap gap-2 mt-2">
          <span
            v-for="(val, key) in randomStore.randomSelections"
            :key="key"
            class="badge badge-outline flex items-center gap-1"
          >
            {{ key }} → {{ val }}
            <button
              @click="removeRandomKey(key)"
              class="ml-1 hover:text-error"
              title="Remove {{ key }}"
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
// /components/content/art/art-randomizer.vue
import { ref, watchEffect, computed } from 'vue'
import { artListPresets, type ArtListEntry } from '@/stores/seeds/artList'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'
import ListManager from './list-manager.vue'

const artStore = useArtStore()
const randomStore = useRandomStore()

const supportedRandomKeys = randomStore.supportedKeys
const expandedPresets = ref<Record<string, boolean>>({})
const showAll = ref<Record<string, boolean>>({})
const showManager = ref(false)
const onlyMine = ref(true)
const includePublic = ref(true)

for (const entry of artListPresets) {
  expandedPresets.value[entry.id] = false
  showAll.value[entry.id] = false
}

const localSelections = computed({
  get: () => artStore.artListSelections,
  set: (val) => {
    for (const [key, values] of Object.entries(val)) {
      artStore.updateArtListSelection(key, values)
    }
  },
})

function toggleMultiSelection(entryId: string, val: string) {
  const current = localSelections.value[entryId] || []
  const updated = current.includes(val)
    ? current.filter((v) => v !== val)
    : [...current, val]
  artStore.updateArtListSelection(entryId, updated)
}

function isSelected(entryId: string, val: string) {
  return localSelections.value[entryId]?.includes(val)
}

function visibleOptions(entry: ArtListEntry) {
  const selected = localSelections.value[entry.id] || []
  const firstSet = entry.content.slice(0, 20)
  const rest = entry.content.slice(20)
  return showAll.value[entry.id]
    ? entry.content
    : [...firstSet, ...rest.filter((val) => selected.includes(val))]
}

function toggleExpanded(id: string) {
  expandedPresets.value[id] = !expandedPresets.value[id]
}

function toggleShowAll(id: string) {
  showAll.value[id] = !showAll.value[id]
}

function toggleRandomKey(key: string) {
  randomStore.toggleSelection(key)
}

function removeRandomKey(key: string) {
  randomStore.clearSelection(key)
}

watchEffect(() => {
  for (const key of Object.keys(randomStore.randomSelections)) {
    artStore.updateArtListSelection(key, [randomStore.randomSelections[key]])
  }
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
