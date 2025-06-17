// /components/content/art/art-generator-panel.vue
<template>
  <div class="w-full flex flex-col space-y-4">
    <!-- Prompt Handler -->
    <div
      class="flex-grow overflow-y-auto max-h-[70vh] p-4 bg-base-200 rounded-xl"
    >
      <!-- Prompt Input -->
      <div class="space-y-2">
        <label class="font-semibold text-base-content">📝 Prompt</label>
        <input
          v-model="promptStore.promptField"
          placeholder="Enter your creative prompt..."
          class="input input-bordered w-full text-lg bg-base-100 placeholder-gray-500 shadow-inner"
          :disabled="loading"
          @input="syncPrompt"
        />
      </div>

      <!-- Negative Toggle -->
      <div class="flex items-center space-x-3 pt-4">
        <label class="label cursor-pointer space-x-2 flex-shrink-0">
          <span class="label-text font-semibold">🚫 Negative Auto</span>
          <input
            type="checkbox"
            class="toggle toggle-error"
            v-model="useNegative"
            @change="toggleNegativePrompt"
          />
        </label>
      </div>

      <!-- Negative Prompt Field -->
      <div class="space-y-2 pt-4">
        <label class="font-semibold text-base-content">Negative Prompt</label>
        <input
          v-model="artStore.artForm.negativePrompt"
          placeholder="Things to avoid (e.g. blurry, extra limbs...)"
          class="input input-bordered w-full text-lg bg-base-100 placeholder-gray-500 shadow-inner"
          :disabled="loading"
        />
      </div>

      <!-- CFG & Steps -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div class="space-y-2">
          <label class="block font-semibold"
            >🎚 CFG Scale: {{ localCfg }}</label
          >
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            v-model.number="localCfg"
            class="range range-primary w-full"
          />
        </div>
        <div class="space-y-2">
          <label class="block font-semibold"
            >🧮 Steps: {{ artStore.artForm.steps }}</label
          >
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            v-model.number="artStore.artForm.steps"
            class="range range-secondary w-full"
          />
        </div>
      </div>

      <!-- Public Toggle -->
      <div class="flex items-center justify-start space-x-4 pt-4">
        <span class="font-semibold">🔓 Public?</span>
        <input
          type="checkbox"
          class="toggle toggle-success"
          v-model="artStore.artForm.isPublic"
        />
      </div>
    </div>

    <!-- Generate Button Layer -->
    <div
      class="sticky bottom-0 z-20 bg-base-100 border border-base-300 p-4 rounded-xl shadow-xl"
    >
      <div class="flex flex-col md:flex-row gap-4 items-stretch w-full">
        <!-- Prompt Preview -->
        <div class="flex-1 space-y-2">
          <label class="text-sm font-semibold text-base-content"
            >🎯 Prompt Preview</label
          >
          <div
            class="text-sm p-3 rounded-md bg-base-200 text-base-content max-h-40 overflow-y-auto font-mono whitespace-pre-line"
          >
            {{ promptStore.promptField || 'No prompt yet...' }}
          </div>
        </div>

        <!-- Controls -->
        <div class="w-full md:w-56 flex flex-col gap-3">
          <!-- Make Pretty Toggle -->
          <div class="form-control">
            <label class="label cursor-pointer justify-between">
              <span class="label-text font-semibold">✨ Make Pretty</span>
              <input
                type="checkbox"
                class="toggle toggle-accent"
                v-model="makePretty"
                @change="handleMakePrettyToggle"
              />
            </label>
          </div>

          <!-- Surprise + Reset -->
          <div class="flex flex-row md:flex-col gap-2">
            <button class="btn btn-sm btn-secondary w-full" @click="surpriseMe">
              🎲 Surprise
            </button>
            <button class="btn btn-sm btn-warning w-full" @click="resetAll">
              ♻️ Reset
            </button>
          </div>

          <!-- Generate Button -->
          <button
            class="btn w-full font-semibold text-white transition duration-300"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, watchEffect, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { artListPresets, negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const checkpointStore = useCheckpointStore()
const randomStore = useRandomStore()

const isGenerating = ref(false)
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

function handleMakePrettyToggle() {}

function toggleNegativePrompt() {
  const list = useNegative.value ? negativeList : []
  artStore.updateArtListSelection('__negative__', list)
}

function syncPrompt() {
  promptStore.syncToLocalStorage()
  artStore.artForm.promptString = promptStore.promptField
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
  for (const key of Object.keys(artStore.artListSelections)) {
    artStore.updateArtListSelection(key, [])
  }
  makePretty.value = false
  randomStore.clearAllSelections()
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
  type ArtFormKey = (typeof validKeys)[number]

  for (const [key, values] of Object.entries(artStore.artListSelections)) {
    if (validKeys.includes(key as ArtFormKey)) {
      const formKey = key as ArtFormKey
      const joined = Array.isArray(values) ? values.join(', ') : String(values)
      artStore.artForm[formKey] = joined
    }
  }

  isGenerating.value = true
  displayStore.toggleRandomAnimation()

  const result = await artStore.generateArt()
  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  } else {
    await callOnce(async () => {
      await milestoneStore.rewardMilestone(11)
    })
  }

  displayStore.stopAnimation()
  isGenerating.value = false
}
</script>
