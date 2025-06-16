<!-- /components/content/art/art-randomizer.vue -->
<template>
  <div class="w-full space-y-6">
    <!-- Top Row: Make Pretty, Surprise Me, Reset -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="flex flex-col items-start">
        <label class="label-text font-semibold">✨ Make Pretty</label>
        <input
          type="checkbox"
          class="toggle toggle-accent mt-1"
          v-model="makePretty"
          @change="handleMakePrettyToggle"
        />
      </div>
      <div class="flex flex-col items-start">
        <label class="label-text font-semibold">🎲 Surprise Me</label>
        <button class="btn btn-secondary mt-1 w-full" @click="surpriseMe">
          Surprise Me
        </button>
      </div>
      <div class="flex flex-col items-start">
        <label class="label-text font-semibold">🔄 Reset</label>
        <button class="btn btn-ghost mt-1 w-full" @click="resetAll">
          Reset All
        </button>
      </div>
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
          :name="expandedPresets[entry.id] ? 'lucide:chevron-up' : 'lucide:chevron-down'"
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
              :class="isSelected(entry.id, option) ? 'btn-primary' : 'btn-outline'"
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
          :class="randomStore.randomSelections[key] ? 'btn-primary' : 'btn-outline'"
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
import { ref, watchEffect, computed } from 'vue'
import { artListPresets, type ArtListEntry } from '@/stores/seeds/artList'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'

const artStore = useArtStore()
const randomStore = useRandomStore()

const makePretty = ref(false)
const supportedRandomKeys = randomStore.supportedKeys

const expandedPresets = ref<Record<string, boolean>>({})
const showAll = ref<Record<string, boolean>>({})

// Init collapsed + showAll = false
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

function handleMakePrettyToggle() {
  if (makePretty.value) {
    expandedPresets.value['__pretty__'] = true
    expandedPresets.value['__negative__'] = true
  }
}

function surpriseMe() {
  for (const entry of artListPresets) {
    const { id, content, allowMultiple, presetType } = entry
    if (presetType === 'all') {
      artStore.updateArtListSelection(id, [...content])
    } else if (allowMultiple) {
      const count = Math.floor(Math.random() * content.length) + 1
      const values = randomStore.pickRandomFromArray(content, count)
      artStore.updateArtListSelection(id, values)
    } else {
      const value = randomStore.pickRandomFromArray(content, 1)
      artStore.updateArtListSelection(id, value)
    }
  }

  makePretty.value = Math.random() > 0.3
}

function resetAll() {
  for (const key of Object.keys(localSelections.value)) {
    artStore.updateArtListSelection(key, [])
  }
  makePretty.value = false
  randomStore.clearAllSelections()
}

watchEffect(() => {
  if (makePretty.value) {
    const pretty = artListPresets.find((p) => p.id === '__pretty__')
    const negative = artListPresets.find((p) => p.id === '__negative__')

    if (pretty) {
      artStore.updateArtListSelection(
        '__pretty__',
        randomStore.pickRandomFromArray(pretty.content, 4),
      )
    }

    if (negative) {
      artStore.updateArtListSelection(
        '__negative__',
        randomStore.pickRandomFromArray(negative.content, 4),
      )
    }
  }

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
