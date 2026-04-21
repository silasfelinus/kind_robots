<!-- /components/navigation/art-footer.vue -->
<template>
  <div
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/80 p-3 shadow-inner md:p-4"
  >
    <div class="grid grid-cols-1 gap-3 xl:grid-cols-[2fr_1fr]">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="flex h-full flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-semibold">🎨 Art Footer</h2>
            <button
              class="btn btn-sm font-semibold text-white"
              :class="
                isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
              "
              :disabled="isGenerating || !promptStore.promptField"
              @click="generateArt"
            >
              {{ isGenerating ? 'Working...' : '🖌️ Create Art' }}
            </button>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-base-content/80">
              Prompt
            </label>
            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered min-h-22 w-full resize-none bg-base-100 text-sm"
              placeholder="Enter your creative prompt..."
              :disabled="loading"
              @input="syncPrompt"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-base-content/80">
              Preview
            </label>
            <div
              class="max-h-32 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 font-mono text-sm"
            >
              {{ promptStore.promptField || 'No prompt yet...' }}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="flex h-full flex-col gap-3">
          <h3
            class="text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Quick Controls
          </h3>

          <CollectionSelector />

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <label
              class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text font-semibold">✨ Make Pretty</span>
              <input
                v-model="makePretty"
                type="checkbox"
                class="toggle toggle-accent"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text font-semibold">🚫 Negative</span>
              <input
                v-model="useNegative"
                type="checkbox"
                class="toggle toggle-error"
                @change="toggleNegativePrompt"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-200 px-3 py-2 sm:col-span-2 xl:col-span-1"
            >
              <span class="label-text font-semibold">🔓 Public</span>
              <input
                v-model="artStore.artForm.isPublic"
                type="checkbox"
                class="toggle toggle-success"
              />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-2">
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
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-base-content/80">
            🎚 CFG Scale: {{ localCfg }}
          </label>
          <input
            v-model.number="localCfg"
            type="range"
            min="0"
            max="30"
            step="0.5"
            class="range range-primary"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-base-content/80">
            🧮 Steps: {{ artStore.artForm.steps }}
          </label>
          <input
            v-model.number="artStore.artForm.steps"
            type="range"
            min="5"
            max="50"
            step="1"
            class="range range-secondary"
          />
        </div>
      </div>
    </div>

    <Transition name="fade-expand">
      <div
        v-if="useNegative"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="space-y-2">
          <label class="text-sm font-semibold text-base-content/80">
            Negative Prompt
          </label>
          <textarea
            v-model="artStore.artForm.negativePrompt"
            class="textarea textarea-bordered min-h-18 w-full resize-none bg-base-100 text-sm"
            placeholder="e.g. blurry, extra limbs..."
            :disabled="loading"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/art-footer.vue
import { computed, ref, watch, watchEffect } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
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
  if (makePretty.value) {
    randomStore.applyMakePretty()
  }
})

watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = !!isMature
  },
  { immediate: true },
)

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
  artStore.artForm.negativePrompt = ''
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
      ;(artStore.artForm as Record<string, unknown>)[key] = joined
    }
  }

  artStore.artForm.promptString = promptStore.promptField

  isGenerating.value = true
  const result = await artStore.generateArt()

  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  } else {
    await milestoneStore.rewardMilestone(11)
  }

  isGenerating.value = false
}
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  transform: translateY(0.35rem);
  max-height: 0;
}

.fade-expand-enter-to,
.fade-expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 16rem;
}
</style>
