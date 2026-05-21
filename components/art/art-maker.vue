<!-- /components/art/art-maker.vue -->
<template>
  <section class="h-full w-full">
    <div
      class="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
    >
      <!-- ── Header ───────────────────────────────────────────────────── -->
      <header class="rounded-2xl border border-base-300 bg-base-100 p-4 sm:p-5">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15"
            >
              <icon name="kind-icon:paintbrush" class="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 class="text-2xl font-black text-primary sm:text-3xl">
                Image Generator
              </h1>
              <p class="mt-0.5 text-sm text-base-content/60 sm:text-base">
                Server → model → prompt → pixels. Politely threaten the machine.
              </p>
            </div>
          </div>

          <generate-button
            class="lg:w-64"
            :compact="true"
            :show-result="false"
          />
        </div>
      </header>

      <!-- Generation message -->
      <div
        v-if="artStore.generationMessage"
        class="flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
        :class="
          artStore.generationMessageTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        <icon
          :name="
            artStore.generationMessageTone === 'error'
              ? 'kind-icon:alert'
              : 'kind-icon:check'
          "
          class="mt-0.5 h-4 w-4 shrink-0"
        />
        {{ artStore.generationMessage }}
      </div>

      <!-- ── Step 1-3: Server / Model / Collection ─────────────────────── -->
      <section
        class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 lg:grid-cols-3"
      >
        <!-- Step badge helper: reused via local style -->
        <label class="form-control">
          <span class="label">
            <span class="label-text flex items-center gap-2 font-bold">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-black text-primary-content"
                >1</span
              >
              Server
            </span>
          </span>

          <select
            v-model.number="selectedServerId"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="artStore.isGenerating || artStore.loading"
          >
            <option :value="null" disabled>Select image server…</option>
            <option
              v-for="server in artStore.generationServers"
              :key="server.id"
              :value="server.id"
            >
              {{ getServerLabel(server) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/55">{{
              selectedServerSummary
            }}</span>
          </span>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text flex items-center gap-2 font-bold">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-black text-secondary-content"
                >2</span
              >
              Model
            </span>
          </span>

          <select
            v-model="selectedCheckpointName"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="
              artStore.isGenerating ||
              artStore.loading ||
              checkpointStore.modelUpdating
            "
          >
            <option value="" disabled>Select checkpoint…</option>
            <option
              v-for="checkpoint in checkpointOptions"
              :key="checkpoint.name || checkpoint.id"
              :value="safeText(checkpoint.name).trim()"
            >
              {{ getCheckpointLabel(checkpoint) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/55">
              Active: {{ checkpointStore.currentApiModel || 'unknown' }}
            </span>
          </span>
        </label>

        <div class="form-control">
          <span class="label">
            <span class="label-text flex items-center gap-2 font-bold">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[0.65rem] font-black text-accent-content"
                >3</span
              >
              Collection
            </span>
          </span>

          <select
            v-model.number="selectedCollectionId"
            class="select select-bordered w-full rounded-2xl bg-base-200"
            :disabled="artStore.isGenerating || artStore.loading"
          >
            <option :value="null">Generated images only</option>
            <option
              v-for="collection in artStore.generationCollections"
              :key="collection.id"
              :value="collection.id"
            >
              {{ collection.label || `Collection #${collection.id}` }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/55">
              Images always saved. This adds a second destination.
            </span>
          </span>

          <add-collection
            class="mt-2"
            :compact="true"
            :disabled="artStore.isGenerating || artStore.loading"
            :show-flags="false"
            @created="handleCollectionCreated"
            @selected="handleCollectionSelected"
          />
        </div>
      </section>

      <!-- ── Prompt + Options ──────────────────────────────────────────── -->
      <section
        class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <!-- Left: prompts + randomizers -->
        <div class="flex min-h-0 flex-col gap-4">
          <label class="form-control">
            <span class="label">
              <span
                class="label-text flex items-center gap-1.5 text-lg font-bold text-primary"
              >
                <icon name="kind-icon:prompt" class="h-4 w-4" />
                Prompt
              </span>
              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                :disabled="artStore.isGenerating"
                @click="clearPrompt"
              >
                Clear
              </button>
            </span>

            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered min-h-40 resize-none rounded-2xl bg-base-200 text-base leading-relaxed"
              placeholder="A clockwork fox knight guarding a neon greenhouse, cinematic lighting, richly detailed…"
              :disabled="artStore.isGenerating"
            />
          </label>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold text-base-content/70"
                >Negative Prompt</span
              >
            </span>

            <textarea
              v-model="artStore.artForm.negativePrompt"
              class="textarea textarea-bordered min-h-24 resize-none rounded-2xl bg-base-200 text-sm"
              placeholder="blurry, low quality, bad hands, watermark, text…"
              :disabled="artStore.isGenerating"
            />
          </label>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="flex items-center gap-1.5 font-bold text-primary">
                <icon name="kind-icon:dice" class="h-4 w-4" />
                Randomizers
              </span>
              <span class="text-xs text-base-content/50"
                >Optional prompt seasoning</span
              >
            </div>
            <art-randomizer />
          </div>
        </div>

        <!-- Right: generation options -->
        <aside class="flex flex-col gap-4">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2
              class="flex items-center gap-1.5 text-base font-bold text-primary"
            >
              <icon name="kind-icon:settings" class="h-4 w-4" />
              Generation Options
            </h2>

            <div class="mt-3 grid grid-cols-1 gap-3">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Sampler</span>
                </span>
                <select
                  v-model="selectedSamplerName"
                  class="select select-bordered rounded-2xl bg-base-100"
                  :disabled="artStore.isGenerating"
                >
                  <option value="" disabled>Select sampler…</option>
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
                  <span class="label"
                    ><span class="label-text font-bold">Steps</span></span
                  >
                  <input
                    v-model.number="artStore.artForm.steps"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="1"
                    max="150"
                    :disabled="artStore.isGenerating"
                  />
                </label>
                <label class="form-control">
                  <span class="label"
                    ><span class="label-text font-bold">CFG</span></span
                  >
                  <input
                    v-model.number="artStore.artForm.cfg"
                    class="input input-bordered rounded-2xl bg-base-100"
                    type="number"
                    min="1"
                    max="30"
                    :disabled="artStore.isGenerating"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label"
                  ><span class="label-text font-bold">Seed</span></span
                >
                <input
                  v-model.number="seedInput"
                  class="input input-bordered rounded-2xl bg-base-100"
                  type="number"
                  placeholder="-1 for random"
                  :disabled="artStore.isGenerating"
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
                  :disabled="artStore.isGenerating"
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
                  :disabled="artStore.isGenerating"
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
                  :disabled="artStore.isGenerating"
                />
              </label>
            </div>
          </div>

          <details class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <summary
              class="flex cursor-pointer list-none items-center gap-2 text-base font-bold text-primary"
            >
              <icon name="kind-icon:image" class="h-4 w-4" />
              Remix Image
            </summary>
            <p class="mt-2 text-sm text-base-content/65">
              Upload only when you want a source image for remix or edit
              workflows.
            </p>
            <div class="mt-3">
              <image-upload @uploaded="handleRemixUploaded" />
            </div>
          </details>

          <generate-button />
        </aside>
      </section>

      <!-- ── Latest Result ─────────────────────────────────────────────── -->
      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-2">
            <icon name="kind-icon:sparkles" class="h-5 w-5 text-primary" />
            <div>
              <h2 class="text-lg font-bold text-primary">Latest Result</h2>
              <p class="text-sm text-base-content/55">
                Generated image appears here after the pixel goblin clocks out.
              </p>
            </div>
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

        <image-card
          v-if="artStore.lastGeneratedArtImage"
          :art-image="artStore.lastGeneratedArtImage"
        />
        <art-display v-else />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Server } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { Resource } from '@/stores/resourceStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUploadStore } from '@/stores/uploadStore'

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
const errorStore = useErrorStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const uploadStore = useUploadStore()

const selectedServerId = computed<number | null>({
  get: () => artStore.artForm.serverId ?? null,
  set: (serverId) => {
    artStore.selectGenerationServer(serverId)
  },
})

const selectedCheckpointName = computed({
  get: () => artStore.selectedCheckpointName,
  set: (name: string) => {
    artStore.selectGenerationCheckpoint(name)
  },
})

const selectedSamplerName = computed({
  get: () => artStore.selectedSamplerName,
  set: (name: string) => {
    artStore.selectGenerationSampler(name)
  },
})

const selectedCollectionId = computed<number | null>({
  get: () => artStore.selectedGenerationCollectionId,
  set: (collectionId) => {
    artStore.selectGenerationCollection(collectionId)
  },
})

const seedInput = computed<number | null>({
  get: () => artStore.artForm.seed ?? null,
  set: (value) => {
    artStore.setArtForm({
      seed: typeof value === 'number' && Number.isFinite(value) ? value : null,
    })
  },
})

const selectedServerSummary = computed(() => {
  const server = artStore.activeGenerationServer
  if (!server) return 'No server selected.'
  const mode = server.allowBrowserRequests ? 'browser-capable' : 'backend'
  return `${server.serverType} · ${mode}`
})

const checkpointOptions = computed<CheckpointResource[]>(() => {
  const checkpoints = checkpointStore.visibleCheckpoints
  if (!Array.isArray(checkpoints)) return []
  return (checkpoints as CheckpointResource[]).filter((checkpoint) => {
    if (checkpoint.isMature && !artStore.showMature) return false
    return Boolean(safeText(checkpoint.name).trim())
  })
})

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

function handleCollectionCreated(collection: ArtCollection) {
  artStore.selectGenerationCollection(collection.id)
  artStore.setGenerationMessage(
    'success',
    `Created collection: ${collection.label || collection.id}`,
  )
}

function handleCollectionSelected(collection: ArtCollection) {
  artStore.selectGenerationCollection(collection.id)
}

function clearPrompt() {
  promptStore.promptField = ''
  artStore.setArtForm({ promptString: '', negativePrompt: '' })
  artStore.clearGenerationMessage()
}

function goToSelectedTab() {
  navStore.setDashboardTab(dashboardKey, 'selected')
}

function handleRemixUploaded() {
  artStore.setGenerationMessage(
    'success',
    'Remix image uploaded. Opening selected image.',
  )
  goToSelectedTab()
}

onMounted(async () => {
  const result = await artStore.prepareArtGenerator()
  configureArtImageUpload()
  if (!result.success) {
    errorStore.addError(
      ErrorType.GENERAL_ERROR,
      result.message || 'Failed to load image generator.',
    )
  }
})
</script>
