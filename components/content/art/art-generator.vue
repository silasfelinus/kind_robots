// /components/content/art/art-generator.vue
<template>
  <div class="flex flex-col min-h-[100dvh] bg-base-200">
    <!-- Minimized Mode -->
    <div
      v-if="isMinimized"
      class="flex items-center gap-2 p-2 bg-base-100 shadow rounded-xl"
    >
      <input
        v-model="promptStore.promptField"
        class="input input-sm input-bordered flex-1"
        placeholder="Enter prompt..."
        @focus="isMinimized = false"
      />
      <button
        class="btn btn-primary btn-sm"
        :disabled="!promptStore.promptField || isGenerating"
        @click="generateArt"
      >
        🖌️
      </button>
    </div>

    <!-- Expanded Mode -->
    <template v-else>
      <!-- Scrollable Panel -->
      <div class="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">🎨 Art Generator</h2>
          <button class="btn btn-xs btn-ghost" @click="isMinimized = true">
            ⬆️ Minimize
          </button>
        </div>

        <!-- Prompt -->
        <div class="space-y-1">
          <label class="font-semibold">📝 Prompt</label>
          <input
            v-model="promptStore.promptField"
            placeholder="Enter your creative prompt..."
            class="input input-bordered w-full text-lg bg-base-100"
            :disabled="loading"
            @input="syncPrompt"
          />
        </div>

        <!-- Toggles -->
        <div class="flex flex-wrap gap-4 pt-2">
          <label class="label cursor-pointer space-x-2">
            <span class="label-text font-semibold">🚫 Negative Prompt</span>
            <input
              type="checkbox"
              class="toggle toggle-error"
              v-model="useNegative"
              @change="toggleNegativePrompt"
            />
          </label>
          <label class="label cursor-pointer space-x-2">
            <span class="label-text font-semibold">🔓 Public</span>
            <input
              type="checkbox"
              class="toggle toggle-success"
              v-model="artStore.artForm.isPublic"
            />
          </label>
        </div>

        <!-- Negative Prompt -->
        <div v-if="useNegative" class="space-y-1">
          <label class="font-semibold">Negative Prompt</label>
          <input
            v-model="artStore.artForm.negativePrompt"
            class="input input-bordered w-full text-lg bg-base-100"
            placeholder="e.g. blurry, extra limbs..."
            :disabled="loading"
          />
        </div>

        <!-- Sliders -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold mb-1"
              >🎚 CFG Scale: {{ localCfg }}</label
            >
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              v-model.number="localCfg"
              class="range range-primary"
            />
          </div>
          <div>
            <label class="block font-semibold mb-1"
              >🧮 Steps: {{ artStore.artForm.steps }}</label
            >
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              v-model.number="artStore.artForm.steps"
              class="range range-secondary"
            />
          </div>
        </div>
      </div>

      <!-- Sticky Footer -->
      <div
        class="sticky bottom-0 z-10 p-4 bg-base-100 border-t border-base-300 shadow-md"
      >
        <div class="flex flex-col md:flex-row gap-4 items-stretch">
          <!-- Preview -->
          <div class="flex-1 space-y-1">
            <label class="text-sm font-semibold">🎯 Prompt Preview</label>
            <div
              class="p-3 rounded bg-base-200 font-mono text-sm max-h-40 overflow-y-auto"
            >
              {{ promptStore.promptField || 'No prompt yet...' }}
            </div>
          </div>

          <!-- Controls -->
          <div class="w-full md:w-56 flex flex-col gap-3">
            <label class="label justify-between cursor-pointer">
              <span class="label-text font-semibold">✨ Make Pretty</span>
              <input
                type="checkbox"
                class="toggle toggle-accent"
                v-model="makePretty"
              />
            </label>

            <div class="flex flex-row md:flex-col gap-2">
              <button
                class="btn btn-sm btn-secondary w-full"
                @click="surpriseMe"
              >
                🎲 Surprise
              </button>
              <button class="btn btn-sm btn-warning w-full" @click="resetAll">
                ♻️ Reset
              </button>
            </div>

            <button
              class="btn w-full text-white font-semibold"
              :class="
                isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
              "
              :disabled="isGenerating || !promptStore.promptField"
              @click="generateArt"
            >
              🖌️ Create Art
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, watchEffect } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { artListPresets, negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
const checkpointStore = useCheckpointStore()
const randomStore = useRandomStore()

const isGenerating = ref(false)
const isMinimized = ref(true)
const makePretty = ref(false)
const useNegative = ref(false)
const loading = computed(() => artStore.loading)

const localCfg = ref<number>(
  (artStore.artForm.cfg ?? 3) + (artStore.artForm.cfgHalf ? 0.5 : 0),
)
watch(localCfg, (val) => {
  artStore.artForm.cfg = Math.floor(val)
  artStore.artForm.cfgHalf = val % 1 >= 0.5
})

watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = !!isMature
  },
  { immediate: true },
)

onMounted(() => {
  if (!artStore.artForm.promptString) {
    artStore.artForm.promptString = promptStore.promptField
  }
})

watchEffect(() => {
  if (makePretty.value) {
    const pretty = artListPresets.find((p) => p.id === '__pretty__')
    const negative = artListPresets.find((p) => p.id === '__negative__')
    if (pretty)
      artStore.updateArtListSelection(
        '__pretty__',
        randomStore.pickRandomFromArray(pretty.content, 4),
      )
    if (negative)
      artStore.updateArtListSelection(
        '__negative__',
        randomStore.pickRandomFromArray(negative.content, 4),
      )
  }
})

function syncPrompt() {
  promptStore.syncToLocalStorage()
  artStore.artForm.promptString = promptStore.promptField
}

function toggleNegativePrompt() {
  artStore.updateArtListSelection(
    '__negative__',
    useNegative.value ? negativeList : [],
  )
}

function resetAll() {
  Object.keys(artStore.artListSelections).forEach((k) =>
    artStore.updateArtListSelection(k, []),
  )
  randomStore.clearAllSelections()
  makePretty.value = false
  useNegative.value = false
}

function surpriseMe() {
  for (const entry of artListPresets) {
    const values = entry.allowMultiple
      ? randomStore.pickRandomFromArray(
          entry.content,
          Math.ceil(Math.random() * entry.content.length),
        )
      : randomStore.pickRandomFromArray(entry.content, 1)
    artStore.updateArtListSelection(entry.id, values)
  }
  makePretty.value = Math.random() > 0.3
}

async function generateArt() {
  const validKeys = [
    'checkpoint',
    'designer',
    'sampler',
    'promptString',
    'negativePrompt',
    'title',
    'collection',
  ] as const
  for (const key of validKeys) {
    const values = artStore.artListSelections[key]
    if (values !== undefined) {
      const joined = Array.isArray(values) ? values.join(', ') : String(values)
      ;(artStore.artForm as any)[key] = joined
    }
  }

  isGenerating.value = true
  displayStore.toggleRandomAnimation()
  const result = await artStore.generateArt()
  if (!result.success)
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  else await milestoneStore.rewardMilestone(11)
  displayStore.stopAnimation()
  isGenerating.value = false
}
</script>
