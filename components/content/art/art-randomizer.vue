<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6"
    >
      <label class="label cursor-pointer space-x-2 flex-shrink-0">
        <span class="label-text font-semibold">✨ Make Pretty</span>
        <input
          type="checkbox"
          class="toggle toggle-accent"
          v-model="makePretty"
        />
      </label>

      <div class="flex gap-2 flex-wrap sm:flex-nowrap">
        <button class="btn btn-sm btn-secondary" @click="surpriseMe">
          🎲 Surprise Me
        </button>
        <button class="btn btn-sm btn-ghost" @click="resetAll">🔄 Reset</button>
      </div>
    </div>

    <!-- Dynamic Presets -->
    <div
      v-for="entry in artListPresets"
      :key="entry.id"
      class="border p-4 rounded-xl bg-base-200 md:flex md:items-center md:gap-4"
    >
      <h3 class="font-semibold mb-2 md:mb-0 md:w-32 shrink-0">
        {{ entry.title }}
      </h3>

      <div class="w-full">
        <div v-if="resolvePresetType(entry) === 'dropdown'">
          <select
            class="select w-full md:max-w-xs"
            :multiple="entry.allowMultiple"
            v-model="localSelections[entry.id]"
          >
            <option
              v-for="option in entry.content"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>

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
      </div>
    </div>

    <!-- Prompt Preview -->
    <div
      class="bg-base-100 border border-dashed border-base-300 p-4 rounded-xl text-sm text-base-content/70"
    >
      <span class="font-semibold text-base-content">Prompt Preview:</span>
      <div class="mt-1 italic">
        {{ promptPreview }}
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

const artStore = useArtStore()

const localSelections = ref<Record<string, string[]>>({})
const makePretty = ref(false)

const LS_KEY = 'artRandomizerSelections'
const LS_PRETTY = 'artRandomizerMakePretty'

if (process.client) {
  const saved = localStorage.getItem(LS_KEY)
  const parsed = saved ? JSON.parse(saved) : {}

  if (typeof parsed === 'object' && parsed !== null) {
    localSelections.value = parsed
  }

  const pretty = localStorage.getItem(LS_PRETTY)
  if (pretty) {
    makePretty.value = pretty === 'true'
  }
}

function getRandom<T>(arr: T[], count = 1): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count)
}

function surpriseMe() {
  for (const entry of artListPresets) {
    const { id, content, allowMultiple } = entry

    if (entry.presetType === 'all') {
      localSelections.value[id] = [...content]
    } else if (allowMultiple) {
      const count = Math.floor(Math.random() * content.length) + 1
      localSelections.value[id] = getRandom(content, count)
    } else {
      localSelections.value[id] = [getRandom(content, 1)[0]]
    }
  }

  makePretty.value = Math.random() > 0.3
}

function resetAll() {
  localSelections.value = {}
  makePretty.value = false
}

const resolvePresetType = (entry: ArtListEntry) => {
  if (entry.presetType === 'auto') {
    return entry.content.length <= 3 ? 'radio' : 'dropdown'
  }
  return entry.presetType
}

watchEffect(() => {
  for (const entry of artListPresets) {
    const val = localSelections.value[entry.id] || []
    artStore.updateArtListSelection(entry.id, Array.isArray(val) ? val : [val])
  }

  if (makePretty.value) {
    const randomPhrases = prettifierPhrases
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
    artStore.updateArtListSelection('__pretty__', randomPhrases)
  } else {
    artStore.updateArtListSelection('__pretty__', [])
  }

  if (import.meta.client) {
    localStorage.setItem(LS_KEY, JSON.stringify(localSelections.value))
    localStorage.setItem(LS_PRETTY, String(makePretty.value))
  }
})

const promptPreview = computed(() =>
  Object.entries(localSelections.value)
    .flatMap(([_, values]) => values)
    .concat(makePretty.value ? ['✨', ...prettifierPhrases.slice(0, 3)] : [])
    .join(', '),
)
</script>
