<!-- /components/content/art/art-generator.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">Art Interact</h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Build prompts, tune generation settings, choose model context, and send
        art requests through the active art server.
      </p>
    </header>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>

    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]"
    >
      <div
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-4">
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div class="min-w-0">
              <h2 class="truncate text-xl font-black text-base-content">
                Prompt Builder
              </h2>

              <p class="mt-1 text-sm text-base-content/65">
                {{ activeArtServerLabel }} · {{ selectedCheckpointLabel }} ·
                {{ selectedSamplerLabel }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2 lg:justify-end">
              <button
                class="btn btn-sm btn-ghost rounded-xl"
                type="button"
                :disabled="isGenerating"
                @click="applyPretty"
              >
                <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                Pretty
              </button>

              <button
                class="btn btn-sm btn-secondary rounded-xl"
                type="button"
                :disabled="isGenerating"
                @click="applySurprise"
              >
                <Icon name="kind-icon:dice" class="h-4 w-4" />
                Surprise
              </button>

              <button
                class="btn btn-sm btn-ghost rounded-xl"
                type="button"
                :disabled="isGenerating"
                @click="resetInteract"
              >
                <Icon name="kind-icon:refresh" class="h-4 w-4" />
                Reset
              </button>

              <button
                class="btn btn-sm btn-primary rounded-xl text-white"
                type="button"
                :disabled="!canGenerate"
                @click="generateArt"
              >
                <span
                  v-if="isGenerating"
                  class="loading loading-spinner loading-sm"
                />
                <Icon v-else name="kind-icon:image" class="h-4 w-4" />
                {{ isGenerating ? 'Generating...' : 'Create Art' }}
              </button>
            </div>
          </div>
        </div>

        <div class="min-h-0 overflow-auto bg-base-200 p-4">
          <div class="grid gap-4">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Prompt</span>

                <span class="label-text-alt text-base-content/50">
                  {{ promptLength }} chars
                </span>
              </span>

              <textarea
                v-model="promptStore.promptField"
                class="textarea textarea-bordered min-h-40 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                placeholder="A robot butterfly librarian arguing with a haunted teapot in a neon greenhouse..."
                :disabled="isGenerating || artStore.loading"
                @input="syncPrompt"
              />
            </label>

            <Transition name="fade-expand">
              <label v-if="useNegative" class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Negative Prompt</span>
                </span>

                <textarea
                  v-model="artStore.artForm.negativePrompt"
                  class="textarea textarea-bordered min-h-28 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                  placeholder="blurry, low quality, extra limbs, cursed anatomy..."
                  :disabled="isGenerating || artStore.loading"
                />
              </label>
            </Transition>

            <div
              class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <label class="form-control">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-sm font-bold text-base-content/70">
                    CFG Scale
                  </span>

                  <span class="font-mono text-sm font-bold text-primary">
                    {{ localCfg.toFixed(1) }}
                  </span>
                </div>

                <input
                  v-model.number="localCfg"
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  class="range range-primary range-sm"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>

              <label class="form-control">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-sm font-bold text-base-content/70">
                    Steps
                  </span>

                  <span class="font-mono text-sm font-bold text-secondary">
                    {{ artStore.artForm.steps ?? 25 }}
                  </span>
                </div>

                <input
                  v-model.number="artStore.artForm.steps"
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  class="range range-secondary range-sm"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Seed</span>
                </span>

                <input
                  v-model.number="seedModel"
                  type="number"
                  class="input input-bordered input-sm bg-base-200"
                  placeholder="-1"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Designer</span>
                </span>

                <input
                  v-model="artStore.artForm.designer"
                  type="text"
                  class="input input-bordered input-sm bg-base-200"
                  placeholder="Kind Designer"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>
            </div>

            <div
              class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
              >
                <span class="label-text font-bold">Public</span>

                <input
                  v-model="artStore.artForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-success"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
              >
                <span class="label-text font-bold">Mature</span>

                <input
                  v-model="artStore.artForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning"
                  :disabled="isGenerating || artStore.loading"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
              >
                <span class="label-text font-bold">Negative</span>

                <input
                  v-model="useNegative"
                  type="checkbox"
                  class="toggle toggle-error"
                  :disabled="isGenerating || artStore.loading"
                  @change="toggleNegativePrompt"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
              >
                <span class="label-text font-bold">Pretty</span>

                <input
                  v-model="makePretty"
                  type="checkbox"
                  class="toggle toggle-accent"
                  :disabled="isGenerating || artStore.loading"
                  @change="applyPretty"
                />
              </label>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 class="font-bold text-base-content">Randomizer</h3>

                  <p class="text-sm text-base-content/60">
                    Use list fragments and surprise controls to feed the prompt.
                  </p>
                </div>
              </div>

              <art-randomizer />
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/65"
            >
              <p>
                <span class="font-bold">Server:</span>
                {{ activeArtServerLabel }}
              </p>

              <p class="mt-1">
                <span class="font-bold">Model:</span>
                {{ selectedCheckpointLabel }}
              </p>

              <p class="mt-1">
                <span class="font-bold">Collection:</span>
                {{ selectedCollectionLabel }}
              </p>
            </div>

            <button
              class="btn btn-primary min-h-16 rounded-2xl text-white"
              type="button"
              :disabled="!canGenerate"
              @click="generateArt"
            >
              <span
                v-if="isGenerating"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-5 w-5" />
              {{ isGenerating ? 'Generating...' : 'Generate Art' }}
            </button>
          </div>
        </div>
      </div>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold text-base-content">Model Context</h2>

              <p class="text-sm text-base-content/60">
                Active engine and checkpoint.
              </p>
            </div>

            <Icon name="kind-icon:server" class="h-6 w-6 text-primary" />
          </div>

          <div class="grid gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Art Server
              </p>

              <p
                class="mt-1 truncate text-sm font-semibold text-base-content/80"
              >
                {{ activeArtServerLabel }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Checkpoint
              </p>

              <p
                class="mt-1 truncate text-sm font-semibold text-base-content/80"
              >
                {{ selectedCheckpointLabel }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Sampler
              </p>

              <p
                class="mt-1 truncate text-sm font-semibold text-base-content/80"
              >
                {{ selectedSamplerLabel }}
              </p>
            </div>

            <button
              class="btn btn-sm btn-outline rounded-xl"
              type="button"
              @click="navStore.setDashboardTab(artDashboardKey, 'checkpoints')"
            >
              Change Model
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="text-lg font-bold text-base-content">Collection Target</h2>

          <p class="mt-1 text-sm text-base-content/60">
            New art is added to generated art and, when selected, the active
            collection.
          </p>

          <div class="mt-3">
            <collection-gallery
              variant="row"
              title="Collections"
              subtitle="Pick a target."
              :show-controls="false"
              :show-toolbar="false"
              :show-card-actions="false"
              :show-stats="false"
              :compact="true"
              :auto-load="false"
            />
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-base-content">Prompt Preview</h2>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!promptPreview"
              @click="copyPromptPreview"
            >
              Copy
            </button>
          </div>

          <pre
            class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-xs text-base-content/70"
            >{{ promptPreview || 'No prompt yet.' }}</pre
          >
        </section>

        <section
          v-if="artStore.currentArt"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-lg font-bold text-base-content">
            Latest Result
          </h2>

          <art-card
            :art="artStore.currentArt"
            :art-image="artStore.currentArtImage"
            :selected="true"
            :show-actions="false"
            :show-prompt="false"
            :show-meta="true"
            :show-generation-meta="false"
            :compact="true"
          />
        </section>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useRandomStore } from '@/stores/randomStore'
import { useServerStore } from '@/stores/serverStore'
import { negativeList } from '@/stores/seeds/artList'

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const randomStore = useRandomStore()
const serverStore = useServerStore()

type DashboardKey =
  | 'footer'
  | 'scenario'
  | 'character'
  | 'reward'
  | 'user'
  | 'dream'
  | 'wonder'
  | 'server'

const artDashboardKey: DashboardKey = 'server'

const isGenerating = ref(false)
const makePretty = ref(false)
const useNegative = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const localCfg = ref(
  (artStore.artForm.cfg ?? 7) + (artStore.artForm.cfgHalf ? 0.5 : 0),
)

const activeArtServerLabel = computed(() => {
  return (
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'No art server selected'
  )
})

const selectedCheckpointLabel = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'No checkpoint selected'
  )
})

const selectedSamplerLabel = computed(() => {
  return checkpointStore.selectedSampler?.name || 'No sampler selected'
})

const selectedCollectionLabel = computed(() => {
  return (
    collectionStore.currentCollection?.label ||
    collectionStore.selectedCollections?.[0]?.label ||
    'Generated Art'
  )
})

const promptLength = computed(() => {
  return promptStore.promptField?.length || 0
})

const seedModel = computed({
  get: () => artStore.artForm.seed ?? -1,
  set: (value: number) => {
    artStore.artForm.seed = Number.isFinite(value) ? value : -1
  },
})

const canGenerate = computed(() => {
  return Boolean(
    !isGenerating.value &&
    !artStore.loading &&
    promptStore.promptField?.trim() &&
    serverStore.activeArtServer,
  )
})

const promptPreview = computed(() => {
  const lines = [
    `Prompt: ${promptStore.promptField || ''}`,
    artStore.artForm.negativePrompt
      ? `Negative: ${artStore.artForm.negativePrompt}`
      : '',
    `Checkpoint: ${
      checkpointStore.selectedCheckpoint?.name ||
      artStore.artForm.checkpoint ||
      ''
    }`,
    `Sampler: ${
      checkpointStore.selectedSampler?.name || artStore.artForm.sampler || ''
    }`,
    `Steps: ${artStore.artForm.steps ?? 25}`,
    `CFG: ${localCfg.value.toFixed(1)}`,
    `Seed: ${artStore.artForm.seed ?? -1}`,
    `Public: ${artStore.artForm.isPublic ? 'yes' : 'no'}`,
    `Mature: ${artStore.artForm.isMature ? 'yes' : 'no'}`,
  ]

  return lines.filter(Boolean).join('\n')
})

watch(localCfg, (value) => {
  artStore.artForm.cfg = Math.floor(value)
  artStore.artForm.cfgHalf = value % 1 >= 0.5
})

watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = Boolean(isMature)
  },
  { immediate: true },
)

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function syncPrompt() {
  promptStore.syncToLocalStorage?.()
  artStore.artForm.promptString = promptStore.promptField
}

function applyPretty() {
  if (!makePretty.value) {
    makePretty.value = true
  }

  randomStore.applyMakePretty()
  syncPrompt()
}

function applySurprise() {
  randomStore.applySurprise()
  syncPrompt()
}

function toggleNegativePrompt() {
  artStore.updateArtListSelection(
    '__negative__',
    useNegative.value ? negativeList : [],
  )

  if (!useNegative.value) {
    artStore.artForm.negativePrompt = ''
  }
}

function resetInteract() {
  randomStore.resetAll()
  makePretty.value = false
  useNegative.value = false
  statusMessage.value = ''
  promptStore.promptField = ''
  artStore.artForm.promptString = ''
  artStore.artForm.negativePrompt = ''
  artStore.artForm.seed = null
  artStore.updateArtListSelection('__negative__', [])
}

async function copyPromptPreview() {
  if (!promptPreview.value) return

  await navigator.clipboard.writeText(promptPreview.value)
  setStatus('Prompt preview copied.')
}

async function generateArt() {
  if (!canGenerate.value) return

  isGenerating.value = true
  statusMessage.value = ''

  const activeServer = serverStore.activeArtServer

  try {
    if (!activeServer) {
      throw new Error('No active art server selected.')
    }

    syncPrompt()

    const result = await artStore.generateArt({
      promptString: promptStore.promptField,
      negativePrompt: artStore.artForm.negativePrompt,
      steps: artStore.artForm.steps,
      cfg: artStore.artForm.cfg,
      cfgHalf: artStore.artForm.cfgHalf,
      isMature: artStore.artForm.isMature,
      isPublic: artStore.artForm.isPublic,
      seed: artStore.artForm.seed,
      galleryId: artStore.artForm.galleryId,
      promptId: artStore.artForm.promptId,
      pitchId: artStore.artForm.pitchId,
      serverId: activeServer.id,
      serverName: activeServer.label || activeServer.title,
      checkpoint:
        checkpointStore.selectedCheckpoint?.name || artStore.artForm.checkpoint,
      sampler:
        checkpointStore.selectedSampler?.name || artStore.artForm.sampler,
      designer: artStore.artForm.designer,
      userId: artStore.artForm.userId,
      pitch: artStore.artForm.pitch,
    })

    if (!result.success) {
      throw new Error(result.message || 'Generation failed.')
    }

    setStatus(result.message || 'Art generated.')
    await milestoneStore.rewardMilestone(11)
    navStore.setDashboardTab(artDashboardKey, 'selected')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed.'

    setStatus(message, 'error')
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
  } finally {
    isGenerating.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    navStore.initialize(),
    serverStore.initialize({
      fetchRemote: true,
    }),
    artStore.initialize({
      fetchRemote: false,
      hydrateImages: false,
    }),
    checkpointStore.initialize(),
    collectionStore.fetchCollections?.(),
  ])

  if (!checkpointStore.selectedSampler) {
    checkpointStore.selectSamplerByName('Euler a')
  }

  syncPrompt()
})
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    max-height 0.2s ease;
  overflow: hidden;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(0.35rem);
}

.fade-expand-enter-to,
.fade-expand-leave-from {
  max-height: 16rem;
  opacity: 1;
  transform: translateY(0);
}
</style>
