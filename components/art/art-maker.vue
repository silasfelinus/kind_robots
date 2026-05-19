<!-- /components/art/art-maker.vue -->
<template>
  <section class="h-full w-full">
    <div
      class="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
    >
      <header class="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 class="text-2xl font-black text-primary sm:text-3xl">
              🖼️ Image Generator
            </h1>

            <p class="mt-1 max-w-3xl text-sm text-base-content/70 sm:text-base">
              Choose a server, choose a model, write the prompt, pick an
              optional collection, then bully pixels into existence.
            </p>
          </div>

          <button
            class="btn btn-primary rounded-2xl text-white"
            type="button"
            :disabled="!canGenerate"
            @click="generateArt"
          >
            <span
              v-if="isGenerating"
              class="loading loading-spinner loading-sm"
            />
            <icon v-else name="kind-icon:sparkles" class="h-5 w-5" />
            {{ isGenerating ? 'Generating...' : 'Generate' }}
          </button>
        </div>
      </header>

      <div
        v-if="message"
        class="rounded-2xl border p-3 text-sm font-semibold"
        :class="
          messageTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ message }}
      </div>

      <section
        class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 lg:grid-cols-3"
      >
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">1. Server</span>
          </span>

          <select
            v-model.number="selectedServerId"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="isGenerating || isLoading"
          >
            <option :value="null" disabled>Select image server...</option>

            <option
              v-for="server in artServers"
              :key="server.id"
              :value="server.id"
            >
              {{ getServerLabel(server) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/60">
              {{ selectedServerSummary }}
            </span>
          </span>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">2. Model</span>
          </span>

          <select
            v-model="selectedCheckpointName"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="
              isGenerating || isLoading || checkpointStore.modelUpdating
            "
          >
            <option value="" disabled>Select checkpoint...</option>

            <option
              v-for="checkpoint in checkpointOptions"
              :key="checkpoint.name || checkpoint.id"
              :value="safeText(checkpoint.name).trim()"
            >
              {{ getCheckpointLabel(checkpoint) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/60">
              Active API model:
              {{ checkpointStore.currentApiModel || 'unknown' }}
            </span>
          </span>
        </label>

        <div class="form-control">
          <span class="label">
            <span class="label-text font-bold">3. Collection</span>
          </span>

          <select
            v-model.number="selectedCollectionId"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="isGenerating || isLoading"
          >
            <option :value="null">Generated images only</option>

            <option
              v-for="collection in collectionOptions"
              :key="collection.id"
              :value="collection.id"
            >
              {{ collection.label || `Collection #${collection.id}` }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/60">
              Generated images are always saved. This adds a second destination.
            </span>
          </span>

          <add-collection
            class="mt-2"
            :compact="true"
            :disabled="isGenerating || isLoading"
            :show-flags="false"
            @created="handleCollectionCreated"
            @selected="handleCollectionSelected"
          />
        </div>
      </section>

      <section
        class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div class="flex min-h-0 flex-col gap-4">
          <label class="form-control">
            <span class="label">
              <span class="label-text text-lg font-bold text-primary">
                Prompt
              </span>

              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                :disabled="isGenerating"
                @click="clearPrompt"
              >
                Clear
              </button>
            </span>

            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered min-h-40 resize-none rounded-2xl bg-base-200 text-base"
              placeholder="A clockwork fox knight guarding a neon greenhouse, cinematic lighting, richly detailed..."
              :disabled="isGenerating"
            />
          </label>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Negative Prompt</span>
            </span>

            <textarea
              v-model="artStore.artForm.negativePrompt"
              class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-200"
              placeholder="blurry, low quality, bad hands, watermark, text..."
              :disabled="isGenerating"
            />
          </label>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h2 class="font-bold text-primary">Randomizers</h2>

              <span class="text-xs text-base-content/60">
                Optional prompt seasoning
              </span>
            </div>

            <art-randomizer />
          </div>
        </div>

        <aside class="flex flex-col gap-4">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2 class="text-lg font-bold text-primary">Generation Options</h2>

            <div class="mt-3 grid grid-cols-1 gap-3">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Sampler</span>
                </span>

                <select
                  v-model="selectedSamplerName"
                  class="select select-bordered rounded-2xl bg-base-100"
                  :disabled="isGenerating"
                >
                  <option value="" disabled>Select sampler...</option>

                  <option
                    v-for="sampler in checkpointStore.allSamplers"
                    :key="sampler.name"
                    :value="sampler.name"
                  >
                    {{ sampler.name }}
                  </option>
                </select>
              </label>

              <div class="grid grid-cols-2 gap-3">
                <label class="form-control">
                  <span class="label">
                    <span class="label-text font-bold">Steps</span>
                  </span>

                  <input
                    v-model.number="artStore.artForm.steps"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="1"
                    max="150"
                    :disabled="isGenerating"
                  />
                </label>

                <label class="form-control">
                  <span class="label">
                    <span class="label-text font-bold">CFG</span>
                  </span>

                  <input
                    v-model.number="artStore.artForm.cfg"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="1"
                    max="30"
                    :disabled="isGenerating"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Seed</span>
                </span>

                <input
                  v-model.number="seedInput"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  placeholder="-1 for random"
                  :disabled="isGenerating"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Half CFG</span>

                <input
                  v-model="artStore.artForm.cfgHalf"
                  type="checkbox"
                  class="toggle toggle-primary"
                  :disabled="isGenerating"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Public</span>

                <input
                  v-model="artStore.artForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-success"
                  :disabled="isGenerating"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Mature</span>

                <input
                  v-model="artStore.artForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning"
                  :disabled="isGenerating"
                />
              </label>
            </div>
          </div>

          <details class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <summary class="cursor-pointer text-lg font-bold text-primary">
              Remix Image
            </summary>

            <p class="mt-2 text-sm text-base-content/70">
              Upload only when you want a source image for remix/edit workflows.
              This stays out of the main generation path because it is optional,
              not the main character.
            </p>

            <div class="mt-3">
              <image-upload @uploaded="handleRemixUploaded" />
            </div>
          </details>

          <button
            class="btn btn-primary min-h-16 rounded-2xl text-lg text-white"
            type="button"
            :disabled="!canGenerate"
            @click="generateArt"
          >
            <span
              v-if="isGenerating"
              class="loading loading-spinner loading-sm"
            />
            <icon v-else name="kind-icon:sparkles" class="h-6 w-6" />
            {{ isGenerating ? 'Generating...' : 'Generate Image' }}
          </button>
        </aside>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-lg font-bold text-primary">Latest Result</h2>

            <p class="text-sm text-base-content/60">
              Generated image appears here after the pixel goblin clocks out.
            </p>
          </div>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="goToSelectedTab"
          >
            <icon name="kind-icon:image" class="h-4 w-4" />
            Selected
          </button>
        </div>

        <art-display />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { Resource } from '@/stores/resourceStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUploadStore } from '@/stores/uploadStore'
import { useUserStore } from '@/stores/userStore'

type CheckpointResource = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  description?: string | null
  isMature?: boolean | null
}

const dashboardKey = 'art' as const

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()
const userStore = useUserStore()

const isLoading = ref(false)
const isGenerating = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const selectedCollectionId = ref<number | null>(null)

const artServers = computed<Server[]>(() => {
  const servers = Array.isArray(serverStore.servers)
    ? (serverStore.servers as Server[])
    : []

  return servers.filter((server) => {
    return Boolean(
      server.isActive &&
      server.supportsTxt2Img &&
      server.serverType === 'A1111',
    )
  })
})

const selectedServerId = computed<number | null>({
  get: () => {
    return artStore.artForm.serverId ?? serverStore.activeArtServer?.id ?? null
  },
  set: (serverId) => {
    const server = serverId ? serverStore.getServerById(serverId) : null

    artStore.setArtForm({
      serverId,
      serverName: server ? getServerLabel(server) : null,
    })
  },
})

const selectedServer = computed(() => {
  if (!selectedServerId.value) return null
  return serverStore.getServerById(selectedServerId.value) ?? null
})

const selectedServerSummary = computed(() => {
  const server = selectedServer.value

  if (!server) return 'No server selected.'

  const mode = server.allowBrowserRequests ? 'browser-capable' : 'backend'
  return `${server.serverType} · ${mode}`
})

const checkpointOptions = computed<CheckpointResource[]>(() => {
  const checkpoints = checkpointStore.visibleCheckpoints

  if (!Array.isArray(checkpoints)) return []

  return (checkpoints as CheckpointResource[]).filter((checkpoint) => {
    if (checkpoint.isMature && !showMature.value) return false
    return Boolean(safeText(checkpoint.name).trim())
  })
})

const selectedCheckpointName = computed({
  get: () => {
    return (
      safeText(checkpointStore.selectedCheckpoint?.name).trim() ||
      artStore.artForm.checkpoint ||
      ''
    )
  },
  set: (name: string) => {
    const value = safeText(name).trim()

    if (!value) return

    checkpointStore.selectCheckpointByName(value)
    artStore.setArtForm({ checkpoint: value })
  },
})

const selectedSamplerName = computed({
  get: () => {
    return (
      safeText(checkpointStore.selectedSampler?.name).trim() ||
      artStore.artForm.sampler ||
      ''
    )
  },
  set: (name: string) => {
    const value = safeText(name).trim()

    if (!value) return

    checkpointStore.selectSamplerByName(value)
    artStore.setArtForm({ sampler: value })
  },
})

const collectionOptions = computed<ArtCollection[]>(() => {
  const collections = Array.isArray(collectionStore.collections)
    ? collectionStore.collections
    : []

  return collections.filter((collection: ArtCollection) => {
    if (collection.isMature && !showMature.value) return false
    if (collection.userId === userStore.userId) return true
    return Boolean(collection.isPublic)
  })
})

const showMature = computed(() => {
  return userStore.user?.showMature ?? userStore.showMature ?? false
})

const seedInput = computed<number | null>({
  get: () => artStore.artForm.seed ?? null,
  set: (value) => {
    artStore.setArtForm({
      seed: typeof value === 'number' && Number.isFinite(value) ? value : null,
    })
  },
})

const finalPrompt = computed(() => {
  return (
    promptStore.promptField?.trim() ||
    artStore.getPromptString?.trim() ||
    artStore.artForm.promptString?.trim() ||
    ''
  )
})

const canGenerate = computed(() => {
  return Boolean(
    !isLoading.value &&
    !isGenerating.value &&
    selectedServerId.value &&
    selectedCheckpointName.value &&
    finalPrompt.value,
  )
})

function handleCollectionCreated(collection: ArtCollection) {
  selectedCollectionId.value = collection.id
  syncSelectedCollection(collection.id)
  setMessage(
    'success',
    `Created collection: ${collection.label || collection.id}`,
  )
}

function handleCollectionSelected(collection: ArtCollection) {
  selectedCollectionId.value = collection.id
  syncSelectedCollection(collection.id)
}

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function getServerLabel(server: Server): string {
  return server.label || server.title || `Server #${server.id}`
}

function getCheckpointLabel(checkpoint: CheckpointResource): string {
  return (
    safeText(checkpoint.customLabel).trim() ||
    safeText(checkpoint.name).trim() ||
    `Checkpoint #${checkpoint.id ?? 'unknown'}`
  )
}

function configureArtImageUpload() {
  uploadStore.setTarget({
    model: 'ArtImage',
    modelId: null,
    galleryName: 'artImageUploads',
    collectionLabel: 'image uploads',
    promptString: '[UploadedArtImage]',
    path: '[UploadedArtImage]',
    buttonLabel: 'Upload remix image',
    icon: 'kind-icon:image',
    showPreview: true,
  })
}

function syncSelectedCollection(collectionId: number | null) {
  if (!collectionId) {
    collectionStore.currentCollection = null
    collectionStore.clearSelectedCollections()
    return
  }

  collectionStore.setCurrentCollection(collectionId)
  collectionStore.setSelectedCollectionIds([collectionId])
}

function clearPrompt() {
  promptStore.promptField = ''
  artStore.setArtForm({
    promptString: '',
    negativePrompt: '',
  })
  message.value = ''
}

function setMessage(tone: 'success' | 'error', value: string) {
  messageTone.value = tone
  message.value = value
}

function goToSelectedTab() {
  navStore.setDashboardTab(dashboardKey, 'selected')
}

function handleRemixUploaded() {
  setMessage('success', 'Remix image uploaded. Opening selected image.')
  goToSelectedTab()
}

async function loadGenerator() {
  isLoading.value = true
  message.value = ''

  try {
    await Promise.all([
      navStore.initialize(),
      ...(serverStore.hasLoaded
        ? []
        : [serverStore.initialize({ fetchRemote: true })]),
      artStore.initialize({
        fetchRemote: false,
        hydrateImages: false,
        initializeServerStore: false,
      }),
      collectionStore.fetchCollections?.(),
    ])

    if (!selectedServerId.value && serverStore.activeArtServer?.id) {
      selectedServerId.value = serverStore.activeArtServer.id
    }

    if (!selectedSamplerName.value) {
      selectedSamplerName.value = 'Euler a'
    }

    if (!artStore.artForm.userId) {
      artStore.setArtForm({
        userId: userStore.userId || userStore.user?.id || 10,
        designer:
          userStore.username || userStore.user?.username || 'Kind Designer',
      })
    }

    configureArtImageUpload()
  } catch (error) {
    const value =
      error instanceof Error ? error.message : 'Failed to load image generator.'

    setMessage('error', value)
    errorStore.addError(ErrorType.GENERAL_ERROR, value)
  } finally {
    isLoading.value = false
  }
}

async function generateArt() {
  if (!canGenerate.value) return

  isGenerating.value = true
  message.value = ''

  try {
    syncSelectedCollection(selectedCollectionId.value)

    const result = await artStore.generateArt({
      promptString: finalPrompt.value,
      negativePrompt: artStore.artForm.negativePrompt,
      steps: artStore.artForm.steps,
      cfg: artStore.artForm.cfg,
      cfgHalf: artStore.artForm.cfgHalf,
      isMature: artStore.artForm.isMature,
      isPublic: artStore.artForm.isPublic,
      seed: artStore.artForm.seed,
      promptId: artStore.artForm.promptId,
      pitchId: artStore.artForm.pitchId,
      serverId: selectedServerId.value,
      serverName: selectedServer.value
        ? getServerLabel(selectedServer.value)
        : null,
      checkpoint: selectedCheckpointName.value,
      sampler: selectedSamplerName.value,
      designer:
        artStore.artForm.designer ||
        userStore.username ||
        userStore.user?.username ||
        'Kind Designer',
      userId: artStore.artForm.userId || userStore.userId || 10,
      pitch: artStore.artForm.pitch,
    })

    if (!result.success) {
      throw new Error(result.message || 'Generation failed.')
    }

    setMessage('success', result.message || 'Image generated.')
    goToSelectedTab()
  } catch (error) {
    const value = error instanceof Error ? error.message : 'Generation failed.'

    setMessage('error', value)
    errorStore.addError(ErrorType.GENERAL_ERROR, value)
  } finally {
    isGenerating.value = false
  }
}

watch(selectedCollectionId, (collectionId) => {
  syncSelectedCollection(collectionId)
})

onMounted(async () => {
  await loadGenerator()
})
</script>
