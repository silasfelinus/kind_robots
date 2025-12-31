<!-- /components/content/art/art-generator.vue -->
<template>
  <div
    class="w-full flex flex-col rounded-2xl flex-1 min-h-0 shadow-inner"
    :style="displayStore.footerStyle"
  >
    <!-- Content Area -->
    <div
      class="flex-1 min-h-0 overflow-y-auto space-y-4"
      :class="displayStore.sectionPaddingSize"
    >
      <!-- Prompt Preview + Generate Button -->
      <div
        class="px-4 py-2 rounded-2xl border border-base-300 bg-base-100 shadow"
      >
        <div
          class="flex flex-col md:flex-row items-start md:items-end justify-between gap-4"
        >
          <div class="flex-1 space-y-1">
            <label class="text-sm font-semibold text-base-content/80">
              🎯 Prompt Preview
            </label>
            <div
              class="p-3 rounded bg-base-200 font-mono text-sm max-h-32 overflow-y-auto border border-base-300"
            >
              {{ promptStore.promptField || 'No prompt yet...' }}
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <button
              class="btn font-semibold text-white"
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

      <!-- Expanded Controls -->
      <Transition name="fade-expand">
        <div
          v-if="['open', 'extended'].includes(displayStore.footerState)"
          key="expanded"
          class="space-y-6 bg-yellow-200/30 rounded-2xl shadow px-4 py-4"
        >
          <!-- 📁 Collection Selector -->
          <CollectionSelector />

          <!-- Prompt Input -->
          <input
            v-model="promptStore.promptField"
            placeholder="Enter your creative prompt..."
            class="input input-bordered w-full text-base bg-base-100"
            :disabled="loading"
            @input="syncPrompt"
          />

          <!-- Toggles -->
          <div
            class="flex flex-wrap md:flex-row gap-2 items-center bg-blue-200/20 p-3 rounded-xl"
          >
            <label
              class="label cursor-pointer justify-between w-full md:w-auto"
            >
              <span class="label-text font-semibold">✨ Make Pretty</span>
              <input
                type="checkbox"
                class="toggle toggle-accent"
                v-model="makePretty"
              />
            </label>

            <label class="label cursor-pointer space-x-2 w-full md:w-auto">
              <span class="label-text font-semibold"
                >🚫 Use Negative Prompt</span
              >
              <input
                type="checkbox"
                class="toggle toggle-error"
                v-model="useNegative"
                @change="toggleNegativePrompt"
              />
            </label>

            <button
              class="btn btn-sm btn-secondary"
              @click="randomStore.applySurprise"
            >
              🎲 Surprise
            </button>

            <button class="btn btn-sm btn-warning" @click="resetUIState">
              ♻️ Reset
            </button>
          </div>

          <!-- Negative Prompt -->
          <div v-if="useNegative" class="space-y-2">
            <label class="font-semibold">Negative Prompt</label>
            <input
              v-model="artStore.artForm.negativePrompt"
              class="input input-bordered w-full text-base bg-base-100"
              placeholder="e.g. blurry, extra limbs..."
              :disabled="loading"
            />
          </div>

          <!-- Public Toggle -->
          <div class="flex flex-wrap gap-4">
            <label class="label cursor-pointer space-x-2">
              <span class="label-text font-semibold">🔓 Public</span>
              <input
                type="checkbox"
                class="toggle toggle-success"
                v-model="artStore.artForm.isPublic"
              />
            </label>
          </div>

          <!-- Sliders -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold mb-1">
                🎚 CFG Scale: {{ localCfg }}
              </label>
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
              <label class="block font-semibold mb-1">
                🧮 Steps: {{ artStore.artForm.steps }}
              </label>
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
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
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

watchEffect(() => {
  if (makePretty.value) randomStore.applyMakePretty()
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

  if (displayStore.footerState === 'hidden') {
    displayStore.changeState('footerState', 'compact')
  }
})

onUnmounted(() => {
  displayStore.changeState('footerState', 'hidden')
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

function resetUIState() {
  randomStore.resetAll()
  makePretty.value = false
  useNegative.value = false
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

  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  } else {
    await milestoneStore.rewardMilestone(11)
  }

  displayStore.stopAnimation()
  isGenerating.value = false
}
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
  max-height: 0;
}
.fade-expand-enter-to,
.fade-expand-leave-from {
  opacity: 1;
  transform: scaleY(1);
  max-height: 1000px;
}
</style>
