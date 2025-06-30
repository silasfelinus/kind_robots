<template>
  <div
    class="w-full p-4 bg-base-100 border border-base-300 rounded-xl shadow-lg"
  >
    <div class="flex flex-col md:flex-row gap-4 items-stretch w-full">
      <!-- Left: Prompt Preview -->
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

      <!-- Right: Controls -->
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch, watchEffect } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { artListPresets } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const checkpointStore = useCheckpointStore()
const randomStore = useRandomStore()

const isGenerating = ref(false)
const makePretty = ref(false)

const generateArt = async () => {
  // Safely apply selections to known artForm fields
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

// Sync isMature from checkpoint
watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = !!isMature
  },
  { immediate: true },
)

// Init prompt
onMounted(() => {
  if (!artStore.artForm.promptString) {
    artStore.artForm.promptString = promptStore.promptField
  }
})

// Apply Make Pretty + Random Selections
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

// Trigger on toggle
function handleMakePrettyToggle() {
  // optional logic; currently handled by watchEffect
}

// Surprise Me logic
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

// Reset logic
function resetAll() {
  for (const key of Object.keys(artStore.artListSelections)) {
    artStore.updateArtListSelection(key, [])
  }
  makePretty.value = false
  randomStore.clearAllSelections()
}
</script>
