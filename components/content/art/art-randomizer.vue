<!-- //components/content/art-art-randomizer.vue -->
<template>
  <div class="w-full max-w-full space-y-6 overflow-x-hidden">
    <!-- Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
      <label class="label cursor-pointer space-x-2 flex-shrink-0">
        <span class="label-text font-semibold">✨ Make Pretty</span>
        <input type="checkbox" class="toggle toggle-accent" v-model="makePretty" />
      </label>

      <div class="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        <button class="btn btn-sm btn-secondary w-full sm:w-auto">🎲 Surprise Me</button>
        <button class="btn btn-sm btn-ghost w-full sm:w-auto">🔄 Reset</button>
      </div>
    </div>

    <!-- Dynamic Presets -->
    <div
      v-for="entry in artListPresets"
      :key="entry.id"
      class="border p-4 rounded-xl bg-base-200 md:flex md:items-center md:gap-4 w-full max-w-full"
    >
      <h3 class="font-semibold mb-2 md:mb-0 md:w-32 shrink-0 flex items-center gap-2">
        {{ entry.title }}
        <button
          class="btn btn-xs btn-outline"
          @click="randomizeEntry(entry)"
          title="Random {{ entry.title }}"
        >
          🎯
        </button>
      </h3>

      <div class="w-full max-w-full">
        <!-- Dropdown -->
        <div v-if="resolvePresetType(entry) === 'dropdown'">
          <select
            class="select w-full md:max-w-xs max-w-full"
            :multiple="entry.allowMultiple"
            v-model="localSelections[entry.id]"
          >
            <option v-for="option in entry.content" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <!-- Radio -->
        <div
          v-else-if="resolvePresetType(entry) === 'radio'"
          class="flex flex-wrap gap-2"
        >
          <label
            v-for="option in entry.content"
            :key="option"
            class="flex items-center gap-1"
          >
            <input
              type="radio"
              :name="entry.id"
              :value="option"
              v-model="localSelections[entry.id]"
              class="radio radio-primary"
            />
            <span>{{ option }}</span>
          </label>
        </div>

        <!-- Selections Display -->
        <div
          v-if="Array.isArray(localSelections[entry.id]) && localSelections[entry.id].length"
          class="flex flex-wrap gap-2 mt-3"
        >
          <span
            v-for="(val, i) in localSelections[entry.id]"
            :key="i"
            class="badge badge-outline flex items-center gap-1"
          >
            {{ val }}
            <button @click="removeSelection(entry.id, val)">🗑️</button>
          </span>
          <button class="btn btn-xs btn-ghost ml-2" @click="clearEntry(entry.id)">
            ❌ Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Bonus Random Toggles -->
    <div class="border p-4 rounded-xl bg-base-200 space-y-4 w-full max-w-full">
      <h3 class="font-semibold">🎲 Bonus Random Prompts</h3>
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
import {
  artListPresets,
  type ArtListEntry,
  prettifierPhrases,
} from '@/stores/seeds/artList'
import { useArtStore } from '@/stores/artStore'
import { useRandomStore } from '@/stores/randomStore'

const artStore = useArtStore()
const randomStore = useRandomStore()

const makePretty = ref(false)

const localSelections = computed({
  get: () => artStore.artListSelections,
  set: (val) => {
    for (const [key, values] of Object.entries(val)) {
      artStore.updateArtListSelection(key, values)
    }
  },
})

const supportedRandomKeys = randomStore.supportedKeys

function toggleRandomKey(key: string) {
  randomStore.toggleSelection(key)
}

function removeRandomKey(key: string) {
  randomStore.clearSelection(key)
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
  artStore.updateArtListSelection('__pretty__', [])
}

function resolvePresetType(entry: ArtListEntry) {
  return entry.presetType === 'auto'
    ? entry.content.length <= 3
      ? 'radio'
      : 'dropdown'
    : entry.presetType
}

function randomizeEntry(entry: ArtListEntry) {
  const key = entry.id.toLowerCase()
  if (!supportedRandomKeys.includes(key)) return

  const results = randomStore.getRandom(key, entry.allowMultiple ? 3 : 1)
  artStore.updateArtListSelection(entry.id, results)
}

function removeSelection(entryId: string, value: string) {
  const updated =
    localSelections.value[entryId]?.filter((v) => v !== value) || []
  artStore.updateArtListSelection(entryId, updated)
}

function clearEntry(entryId: string) {
  artStore.updateArtListSelection(entryId, [])
}

watchEffect(() => {
  const pretty = makePretty.value
  const randoms = randomStore.randomSelections

  artStore.updateArtListSelection(
    '__pretty__',
    pretty ? randomStore.pickRandomFromArray(prettifierPhrases, 3) : [],
  )

  for (const key of Object.keys(randoms)) {
    artStore.updateArtListSelection(key, [randoms[key]])
  }
})


</script>
