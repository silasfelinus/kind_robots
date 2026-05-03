<!-- /components/art/art-manager.vue -->
<template>
  <dashboard-shell
    title="Art Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading art, collections, checkpoints, and pixel goblin infrastructure..."
    nav-grid-class="xl:grid-cols-6"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)_minmax(280px,1fr)]"
        >
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <checkpoint-gallery
              variant="compact"
              title="Model"
              subtitle="Choose the art model."
              :show-controls="false"
              :show-status="true"
              :show-sampler="true"
              :show-images="true"
              :show-descriptions="false"
              :show-meta="false"
              :show-select-buttons="false"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <section
              class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
            >
              <header
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center"
              >
                <h2 class="text-xl font-bold text-primary">Prompt Lab</h2>

                <p class="mt-1 text-sm text-base-content/70">
                  Build a prompt, pick a model, and commit pixel alchemy.
                </p>
              </header>

              <div
                v-if="generationMessage"
                class="rounded-2xl border p-3 text-sm"
                :class="
                  generationTone === 'error'
                    ? 'border-error/40 bg-error/10 text-error'
                    : 'border-success/40 bg-success/10 text-success'
                "
              >
                {{ generationMessage }}
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
                <label class="form-control">
                  <span class="label">
                    <span class="label-text font-bold">Prompt</span>
                  </span>

                  <textarea
                    v-model="promptStore.promptField"
                    class="textarea textarea-bordered min-h-28 resize-none rounded-2xl bg-base-200"
                    placeholder="Enter your creative prompt..."
                    :disabled="isGenerating"
                  />
                </label>

                <div
                  class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div
                    class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/65"
                  >
                    <p>
                      <span class="font-bold">Model:</span>
                      {{ selectedCheckpointLabel }}
                    </p>

                    <p class="mt-1">
                      <span class="font-bold">Server:</span>
                      {{ activeArtServerLabel }}
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
                    {{ isGenerating ? 'Working...' : 'Create Art' }}
                  </button>
                </div>
              </div>

              <div class="min-h-0 flex-1 overflow-auto">
                <art-randomizer />
              </div>
            </section>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <collection-gallery
              variant="row"
              title="Collections"
              subtitle="Choose where the art lands."
              :show-controls="false"
              :show-toolbar="false"
              :show-card-actions="false"
              :show-stats="false"
              :compact="true"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <art-gallery
            variant="row"
            title="Recent Art"
            subtitle="Fresh pixels from the machine."
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="true"
            :show-prompts="false"
            :show-meta="false"
            :show-selected-panel="true"
            :show-footer="false"
            :compact="true"
            :display-limit="30"
          />
        </div>
      </section>

      <section
        v-else-if="currentTab === 'generate'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <checkpoint-gallery
            title="Model and Sampler"
            subtitle="Pick the image engine."
            :show-controls="true"
            :show-status="true"
            :show-sampler="true"
            :show-images="true"
            :show-descriptions="true"
            :show-meta="true"
            :show-select-buttons="false"
          />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <section
            class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-3"
          >
            <header
              class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center"
            >
              <h2 class="text-2xl font-bold text-primary">Generate Art</h2>

              <p class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70">
                Write a prompt, use randomizer pieces, then generate through the
                active art server.
              </p>
            </header>

            <div
              v-if="generationMessage"
              class="rounded-2xl border p-3 text-sm"
              :class="
                generationTone === 'error'
                  ? 'border-error/40 bg-error/10 text-error'
                  : 'border-success/40 bg-success/10 text-success'
              "
            >
              {{ generationMessage }}
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Prompt</span>
                </span>

                <textarea
                  v-model="promptStore.promptField"
                  class="textarea textarea-bordered min-h-32 resize-none rounded-2xl bg-base-200"
                  placeholder="A robot butterfly librarian arguing with a haunted teapot..."
                  :disabled="isGenerating"
                />
              </label>

              <div
                class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
              >
                <label class="form-control">
                  <span class="label">
                    <span class="label-text font-bold">Steps</span>
                  </span>

                  <input
                    v-model.number="artStore.artForm.steps"
                    type="number"
                    min="1"
                    max="150"
                    class="input input-bordered bg-base-200"
                  />
                </label>

                <label class="form-control">
                  <span class="label">
                    <span class="label-text font-bold">CFG</span>
                  </span>

                  <input
                    v-model.number="artStore.artForm.cfg"
                    type="number"
                    min="1"
                    max="30"
                    class="input input-bordered bg-base-200"
                  />
                </label>

                <label
                  class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
                >
                  <span class="label-text font-bold">Half CFG</span>

                  <input
                    v-model="artStore.artForm.cfgHalf"
                    type="checkbox"
                    class="toggle toggle-primary"
                  />
                </label>

                <label
                  class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
                >
                  <span class="label-text font-bold">Public</span>

                  <input
                    v-model="artStore.artForm.isPublic"
                    type="checkbox"
                    class="toggle toggle-success"
                  />
                </label>
              </div>

              <label class="form-control mt-4">
                <span class="label">
                  <span class="label-text font-bold">Negative Prompt</span>
                </span>

                <textarea
                  v-model="artStore.artForm.negativePrompt"
                  class="textarea textarea-bordered min-h-20 resize-none rounded-2xl bg-base-200"
                  placeholder="blurry, low quality, cursed spaghetti fingers..."
                />
              </label>

              <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  class="btn btn-ghost rounded-xl"
                  type="button"
                  :disabled="isGenerating"
                  @click="clearPrompt"
                >
                  Clear
                </button>

                <button
                  class="btn btn-secondary rounded-xl"
                  type="button"
                  :disabled="isGenerating"
                  @click="useActiveServer"
                >
                  Use Active Art Server
                </button>

                <button
                  class="btn btn-primary rounded-xl text-white"
                  type="button"
                  :disabled="!canGenerate"
                  @click="generateArt"
                >
                  <span
                    v-if="isGenerating"
                    class="loading loading-spinner loading-sm"
                  />
                  {{ isGenerating ? 'Generating...' : 'Generate Art' }}
                </button>
              </div>
            </div>

            <div class="min-h-0 flex-1 overflow-auto">
              <art-randomizer />
            </div>
          </section>
        </div>
      </section>

      <art-gallery
        v-else-if="currentTab === 'gallery'"
        variant="dashboard"
        title="Art Gallery"
        subtitle="Browse, select, upload, collect, and inspect generated art."
        :show-selected-panel="true"
      />

      <collection-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        title="Collections"
        subtitle="Organize art into reusable sets."
      />

      <checkpoint-gallery
        v-else-if="currentTab === 'checkpoints'"
        variant="dashboard"
        title="Checkpoints"
        subtitle="Choose models, samplers, and verify the active backend model."
      />

      <server-manager v-else-if="currentTab === 'servers'" />

      <section
        v-else-if="currentTab === 'selected'"
        class="rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <div
          v-if="artStore.currentArt"
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]"
        >
          <art-card
            :art="artStore.currentArt"
            :art-image="artStore.currentArtImage"
            :selected="true"
            :show-actions="true"
            :show-prompt="false"
            :show-meta="true"
            :show-generation-meta="true"
            :show-select-button="false"
          />

          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="text-xl font-bold text-primary">Selected Art</h2>

            <div class="mt-4 grid gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Prompt
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/80"
                >
                  {{ artStore.currentArt.promptString }}
                </p>
              </div>

              <div
                v-if="artStore.currentArt.negativePrompt"
                class="rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Negative Prompt
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/80"
                >
                  {{ artStore.currentArt.negativePrompt }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Checkpoint
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.checkpoint || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Sampler
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.sampler || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Server
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.serverName || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Seed
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.seed ?? 'n/a' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

          <p class="mt-2 text-lg font-bold">No art selected.</p>

          <p class="mt-1 text-sm">
            Select something from the gallery first. The pixels demand
            attention.
          </p>
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown art tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useCollectionStore } from '@/stores/collectionStore'

const dashboardKey = 'art' as const

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const isGenerating = ref(false)
const generationMessage = ref('')
const generationTone = ref<'success' | 'error'>('success')

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

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
const managerSummary = computed(() => {
  const artCount = artStore.art.length
  const collectionCount = collectionStore.collections.length
  const selectedArt = artStore.currentArt
    ? `Art #${artStore.currentArt.id}`
    : 'no art selected'

  return `${artCount} art records, ${collectionCount} collections. Current model: ${selectedCheckpointLabel.value}. Server: ${activeArtServerLabel.value}. Selected: ${selectedArt}.`
})

const canGenerate = computed(() => {
  return Boolean(
    !isGenerating.value &&
    promptStore.promptField?.trim() &&
    serverStore.activeArtServer,
  )
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
      artStore.initialize({
        force,
        fetchRemote: true,
        hydrateImages: false,
      }),
      checkpointStore.initialize(),
      collectionStore.fetchCollections?.(),
    ])

    if (!checkpointStore.selectedSampler) {
      checkpointStore.selectSamplerByName('Euler a')
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load art manager.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

function clearPrompt() {
  promptStore.promptField = ''
  generationMessage.value = ''
}

function useActiveServer() {
  const server = serverStore.activeArtServer

  if (!server) {
    generationTone.value = 'error'
    generationMessage.value = 'No active art server selected.'
    return
  }

  artStore.artForm.serverId = server.id
  artStore.artForm.serverName = server.label || server.title

  generationTone.value = 'success'
  generationMessage.value = `Using ${server.label || server.title}.`
}

async function generateArt() {
  if (!canGenerate.value) return

  isGenerating.value = true
  generationMessage.value = ''

  const activeServer = serverStore.activeArtServer

  try {
    if (!activeServer) {
      throw new Error('No active art server selected.')
    }

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

    generationTone.value = result.success ? 'success' : 'error'
    generationMessage.value =
      result.message ||
      (result.success ? 'Art generated.' : 'Generation failed.')

    if (!result.success) {
      errorStore.addError(
        ErrorType.GENERAL_ERROR,
        result.message || 'Generation failed.',
      )
      return
    }

    navStore.setDashboardTab(dashboardKey, 'selected')
  } catch (error) {
    generationTone.value = 'error'
    generationMessage.value =
      error instanceof Error ? error.message : 'Generation failed.'

    errorStore.addError(ErrorType.GENERAL_ERROR, generationMessage.value)
  } finally {
    isGenerating.value = false
  }
}

onMounted(async () => {
  await loadManagerData()
})
</script>
