<!-- /components/navigation/art-footer.vue -->
@ts-nocheck
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="isCompact ? 'px-2 py-2' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div
        class="grid h-full min-h-0 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-stretch gap-2 overflow-hidden"
      >
        <textarea
          ref="promptMeasureRef"
          v-model="promptStore.promptField"
          class="textarea textarea-bordered h-full min-h-0 min-w-0 resize-none overflow-y-auto rounded-2xl bg-base-100 px-3 py-2 text-sm leading-snug"
          placeholder="Prompt the pixel goblin..."
          :disabled="isGenerating || artStore.loading"
          @input="syncPrompt"
          @keydown.enter.exact.prevent="generateArt"
        />

        <button
          class="btn btn-sm btn-primary h-full shrink-0 rounded-2xl text-white"
          type="button"
          :disabled="!canGenerate"
          @click="generateArt"
        >
          <span
            v-if="isGenerating"
            class="loading loading-spinner loading-xs"
          />
          <span v-else>Create</span>
        </button>

        <button
          class="btn btn-sm btn-secondary h-full shrink-0 rounded-2xl"
          type="button"
          @click="openArtWorkshop"
        >
          Open
        </button>
      </div>
    </template>

    <template v-else-if="isOpen">
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]"
      >
        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-3 py-2"
          >
            <div class="min-w-0">
              <h2 class="truncate text-sm font-bold text-base-content">
                Art Prompt
              </h2>

              <p class="truncate text-xs text-base-content/50">
                {{ activeArtServerLabel }} · {{ selectedCheckpointLabel }}
              </p>
            </div>

            <div class="flex shrink-0 gap-1.5">
              <button
                class="btn btn-xs btn-ghost rounded-xl"
                type="button"
                @click="applyPretty"
              >
                Pretty
              </button>

              <button
                class="btn btn-xs btn-ghost rounded-xl"
                type="button"
                @click="randomStore.applySurprise"
              >
                Surprise
              </button>

              <button
                class="btn btn-xs btn-ghost rounded-xl"
                type="button"
                @click="resetFooter"
              >
                Clear
              </button>

              <button
                class="btn btn-xs btn-primary rounded-xl text-white"
                type="button"
                :disabled="!canGenerate"
                @click="generateArt"
              >
                <span
                  v-if="isGenerating"
                  class="loading loading-spinner loading-xs"
                />
                <span v-else>Create</span>
              </button>
            </div>
          </div>

          <textarea
            ref="promptMeasureRef"
            v-model="promptStore.promptField"
            class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-3 py-2.5 text-sm leading-relaxed"
            placeholder="Describe the image..."
            :disabled="isGenerating || artStore.loading"
            @input="syncPrompt"
            @keydown.enter.exact.prevent="generateArt"
          />

          <div
            class="grid shrink-0 grid-cols-2 gap-2 border-t border-base-300 bg-base-200/60 p-3"
          >
            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold text-base-content/60">CFG</span>
                <span class="font-mono text-xs font-bold text-primary">
                  {{ localCfg.toFixed(1) }}
                </span>
              </div>

              <input
                v-model.number="localCfg"
                type="range"
                min="0"
                max="30"
                step="0.5"
                class="range range-primary range-xs"
              />
            </label>

            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold text-base-content/60">
                  Steps
                </span>
                <span class="font-mono text-xs font-bold text-secondary">
                  {{ artStore.artForm.steps ?? 25 }}
                </span>
              </div>

              <input
                v-model.number="artStore.artForm.steps"
                type="range"
                min="5"
                max="80"
                step="1"
                class="range range-secondary range-xs"
              />
            </label>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="grid gap-2">
            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Public</span>

              <input
                v-model="artStore.artForm.isPublic"
                type="checkbox"
                class="toggle toggle-success toggle-sm"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Mature</span>

              <input
                v-model="artStore.artForm.isMature"
                type="checkbox"
                class="toggle toggle-warning toggle-sm"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Negative</span>

              <input
                v-model="useNegative"
                type="checkbox"
                class="toggle toggle-error toggle-sm"
                @change="toggleNegativePrompt"
              />
            </label>
          </div>

          <Transition name="fade-expand">
            <textarea
              v-if="useNegative"
              v-model="artStore.artForm.negativePrompt"
              class="textarea textarea-bordered min-h-0 flex-1 resize-none rounded-2xl bg-base-200 text-sm"
              placeholder="blurry, extra limbs, cursed anatomy..."
              :disabled="isGenerating || artStore.loading"
              @input="queuePromptOffsetRefresh"
            />
          </Transition>

          <div
            v-if="statusMessage"
            class="rounded-2xl border p-2 text-xs"
            :class="
              statusTone === 'error'
                ? 'border-error/40 bg-error/10 text-error'
                : 'border-success/40 bg-success/10 text-success'
            "
          >
            {{ statusMessage }}
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full min-h-0 w-full grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)_minmax(260px,0.6fr)]"
      >
        <section
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-4 py-3"
          >
            <div class="min-w-0">
              <h2 class="truncate text-base font-bold text-base-content">
                Art Generator
              </h2>

              <p class="truncate text-xs text-base-content/50">
                {{ activeArtServerLabel }} · {{ selectedCheckpointLabel }}
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <button
                class="btn btn-xs btn-ghost rounded-xl"
                type="button"
                @click="openArtWorkshop"
              >
                Workshop
              </button>

              <button
                class="btn btn-sm btn-primary rounded-2xl text-white"
                type="button"
                :disabled="!canGenerate"
                @click="generateArt"
              >
                <span
                  v-if="isGenerating"
                  class="loading loading-spinner loading-sm"
                />
                <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
                {{ isGenerating ? 'Working...' : 'Create Art' }}
              </button>
            </div>
          </div>

          <textarea
            ref="promptMeasureRef"
            v-model="promptStore.promptField"
            class="textarea min-h-0 flex-1 resize-none overflow-y-auto bg-base-100 px-4 py-3 text-sm leading-relaxed"
            placeholder="A cozy robot greenhouse where butterflies debug the moon..."
            :disabled="isGenerating || artStore.loading"
            @input="syncPrompt"
            @keydown.enter.exact.prevent="generateArt"
          />

          <div
            class="grid shrink-0 grid-cols-1 gap-3 border-t border-base-300 bg-base-200/60 p-3 md:grid-cols-2"
          >
            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold text-base-content/60">CFG</span>
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
              />
            </label>

            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold text-base-content/60">
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
                max="80"
                step="1"
                class="range range-secondary range-sm"
              />
            </label>
          </div>
        </section>

        <section
          class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div
            class="text-xs font-bold uppercase tracking-wide text-base-content/50"
          >
            Quick Controls
          </div>

          <div class="grid gap-2">
            <collection-selector />

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Pretty</span>

              <input
                v-model="makePretty"
                type="checkbox"
                class="toggle toggle-accent toggle-sm"
                @change="applyPretty"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Negative</span>

              <input
                v-model="useNegative"
                type="checkbox"
                class="toggle toggle-error toggle-sm"
                @change="toggleNegativePrompt"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Public</span>

              <input
                v-model="artStore.artForm.isPublic"
                type="checkbox"
                class="toggle toggle-success toggle-sm"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Mature</span>

              <input
                v-model="artStore.artForm.isMature"
                type="checkbox"
                class="toggle toggle-warning toggle-sm"
              />
            </label>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="randomStore.applySurprise"
            >
              Surprise
            </button>

            <button
              class="btn btn-sm btn-warning rounded-xl"
              type="button"
              @click="resetFooter"
            >
              Reset
            </button>
          </div>
        </section>

        <section
          class="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 xl:flex"
        >
          <div
            class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
          >
            Preview
          </div>

          <div
            class="min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p v-if="promptStore.promptField" class="whitespace-pre-wrap">
              {{ promptStore.promptField }}
            </p>

            <p v-else class="text-base-content/35">
              Your prompt preview will show here.
            </p>

            <div
              v-if="useNegative && artStore.artForm.negativePrompt"
              class="mt-3 border-t border-base-300 pt-3"
            >
              <p class="font-bold text-error">Negative</p>

              <p class="mt-1 whitespace-pre-wrap">
                {{ artStore.artForm.negativePrompt }}
              </p>
            </div>
          </div>

          <div
            v-if="statusMessage"
            class="mt-3 rounded-2xl border p-2 text-xs"
            :class="
              statusTone === 'error'
                ? 'border-error/40 bg-error/10 text-error'
                : 'border-success/40 bg-success/10 text-success'
            "
          >
            {{ statusMessage }}
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useDisplayStore } from '@/stores/displayStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useRandomStore } from '@/stores/randomStore'
import { useServerStore } from '@/stores/serverStore'
import { negativeList } from '@/stores/seeds/artList'
import { type DashboardKey } from '@/stores/helpers/dashboardHelper'

const router = useRouter()
const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const randomStore = useRandomStore()
const serverStore = useServerStore()

const footerOffsetKey = 'art'

const artDashboardKey: DashboardKey = 'server'

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const promptMeasureRef = ref<HTMLTextAreaElement | null>(null)
let promptResizeObserver: ResizeObserver | null = null

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
    'No art server'
  )
})

const selectedCheckpointLabel = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'No checkpoint'
  )
})
const canGenerate = computed(() => {
  return Boolean(
    !isGenerating.value &&
    !artStore.loading &&
    promptStore.promptField?.trim() &&
    serverStore.activeArtServer,
  )
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

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function syncPrompt() {
  promptStore.syncToLocalStorage?.()
  artStore.artForm.promptString = promptStore.promptField
  queuePromptOffsetRefresh()
}

function applyPretty() {
  if (!makePretty.value) return

  randomStore.applyMakePretty()
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

  queuePromptOffsetRefresh()
}

function resetFooter() {
  randomStore.resetAll()
  makePretty.value = false
  useNegative.value = false
  statusMessage.value = ''
  promptStore.promptField = ''
  artStore.artForm.promptString = ''
  artStore.artForm.negativePrompt = ''
  artStore.updateArtListSelection('__negative__', [])
  queuePromptOffsetRefresh()
}

async function openArtWorkshop() {
  navStore.setDashboardTab(artDashboardKey, 'overview')
  await router.push('/art')
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== footerOffsetKey) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  const el = promptMeasureRef.value

  if (!el) {
    displayStore.clearPromptOffset(footerOffsetKey)
    return
  }

  displayStore.refreshPromptOffset(
    footerOffsetKey,
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
    queuePromptOffsetRefresh()
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
  ])

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
  displayStore.clearPromptOffset(footerOffsetKey)
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
