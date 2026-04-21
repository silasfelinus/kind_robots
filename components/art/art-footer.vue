<!-- /components/navigation/art-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[1fr_auto] items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <textarea
          ref="promptMeasureRef"
          v-model="promptStore.promptField"
          class="textarea textarea-bordered h-full min-h-0 w-full resize-none overflow-y-auto bg-base-100 text-sm"
          placeholder="Enter your creative prompt..."
          :disabled="loading"
          @input="syncPrompt"
        />

        <button
          class="btn h-full min-h-0 w-24 font-semibold text-white"
          :class="
            isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
          "
          :disabled="isGenerating || !promptStore.promptField.trim()"
          @click="generateArt"
        >
          {{ isGenerating ? 'Working...' : 'Create Art' }}
        </button>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">🎨 Art Footer</h2>

          <button
            class="btn btn-sm font-semibold text-white"
            :class="
              isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
            "
            :disabled="isGenerating || !promptStore.promptField.trim()"
            @click="generateArt"
          >
            {{ isGenerating ? 'Working...' : '🖌️ Create Art' }}
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div
            class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <label class="mb-2 text-sm font-semibold text-base-content/80">
              Prompt
            </label>

            <textarea
              ref="promptMeasureRef"
              v-model="promptStore.promptField"
              class="textarea textarea-bordered min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 text-sm"
              placeholder="Enter your creative prompt..."
              :disabled="loading"
              @input="syncPrompt"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
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

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
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
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Prompt Preview
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 font-mono text-sm"
        >
          {{ promptStore.promptField || 'No prompt yet...' }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">🎨 Art Footer</h2>

          <button
            class="btn btn-sm font-semibold text-white"
            :class="
              isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
            "
            :disabled="isGenerating || !promptStore.promptField.trim()"
            @click="generateArt"
          >
            {{ isGenerating ? 'Working...' : '🖌️ Create Art' }}
          </button>
        </div>

        <div
          class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.9fr]"
        >
          <div class="flex min-h-0 flex-col gap-3">
            <div
              class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <label class="mb-2 text-sm font-semibold text-base-content/80">
                Prompt
              </label>

              <textarea
                v-model="promptStore.promptField"
                class="textarea textarea-bordered min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 text-sm"
                placeholder="Enter your creative prompt..."
                :disabled="loading"
                @input="syncPrompt"
              />
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div class="space-y-3">
                  <label
                    class="block text-sm font-semibold text-base-content/80"
                  >
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

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <div class="space-y-3">
                  <label
                    class="block text-sm font-semibold text-base-content/80"
                  >
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
                class="rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-base-content/80">
                    Negative Prompt
                  </label>
                  <textarea
                    v-model="artStore.artForm.negativePrompt"
                    class="textarea textarea-bordered min-h-24 w-full resize-none bg-base-100 text-sm"
                    placeholder="e.g. blurry, extra limbs..."
                    :disabled="loading"
                  />
                </div>
              </div>
            </Transition>
          </div>

          <div class="flex min-h-0 flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="mb-3 text-sm font-semibold uppercase tracking-wide text-base-content/70"
              >
                Quick Controls
              </div>

              <div class="space-y-3">
                <CollectionSelector />

                <div class="grid grid-cols-1 gap-2">
                  <label
                    class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
                  >
                    <span class="label-text font-semibold">✨ Make Pretty</span>
                    <input
                      v-model="makePretty"
                      type="checkbox"
                      class="toggle toggle-accent"
                    />
                  </label>

                  <label
                    class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
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
                    class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
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
        </div>
      </div>

      <div class="hidden min-h-0 xl:flex xl:flex-col">
        <div
          class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div
            class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Status
          </div>

          <div class="grid gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                CFG
              </div>
              <div class="mt-1 text-lg font-semibold">{{ localCfg }}</div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Steps
              </div>
              <div class="mt-1 text-lg font-semibold">
                {{ artStore.artForm.steps }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Public
              </div>
              <div class="mt-1 text-sm font-semibold">
                {{ artStore.artForm.isPublic ? 'Yes' : 'No' }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Negative Prompt
              </div>
              <div class="mt-1 text-sm font-semibold">
                {{ useNegative ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  watchEffect,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useRandomStore } from '@/stores/randomStore'
import { useDisplayStore } from '@/stores/displayStore'
import { negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const promptStore = usePromptStore()
const milestoneStore = useMilestoneStore()
const errorStore = useErrorStore()
const checkpointStore = useCheckpointStore()
const randomStore = useRandomStore()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const promptMeasureRef = ref<HTMLTextAreaElement | null>(null)
let promptResizeObserver: ResizeObserver | null = null

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
  queuePromptOffsetRefresh()
}

function toggleNegativePrompt() {
  artStore.updateArtListSelection(
    '__negative__',
    useNegative.value ? negativeList : [],
  )
  queuePromptOffsetRefresh()
}

function resetUIState() {
  randomStore.resetAll()
  makePretty.value = false
  useNegative.value = false
  artStore.artForm.negativePrompt = ''
  queuePromptOffsetRefresh()
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== 'art') {
    displayStore.clearPromptOffset('art')
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset('art')
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset('art')
    return
  }

  const el = promptMeasureRef.value
  if (!el) {
    displayStore.clearPromptOffset('art')
    return
  }

  displayStore.refreshPromptOffset(
    'art',
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}

watch(
  () => [
    footerState.value,
    promptStore.promptField,
    artStore.artForm.negativePrompt,
    useNegative.value,
    displayStore.footerComponent,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

onMounted(() => {
  queuePromptOffsetRefresh()

  promptResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (promptMeasureRef.value) {
    promptResizeObserver.observe(promptMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  promptResizeObserver?.disconnect()
  promptResizeObserver = null
  displayStore.clearPromptOffset('art')
})

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
  queuePromptOffsetRefresh()
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
