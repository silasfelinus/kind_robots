<!-- /components/content/art/art-interact.vue -->
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
        Pick the server, checkpoint, sampler, and collection before sending art
        requests.
      </p>
    </header>

    <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Art Server</span>
          </span>

          <select
            class="select select-bordered rounded-2xl bg-base-200"
            :value="selectedServerId ?? ''"
            :disabled="isGenerating || artStore.loading"
            @change="handleServerChange"
          >
            <option value="">Select an art server</option>

            <option
              v-for="server in artServerOptions"
              :key="server.id"
              :value="server.id"
              :title="getServerOptionTitle(server)"
            >
              {{ getServerDropdownLabel(server) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt break-all text-base-content/60">
              {{ selectedServerEndpointLabel }}
            </span>
          </span>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Checkpoint</span>
          </span>

          <select
            class="select select-bordered rounded-2xl bg-base-200"
            :value="selectedCheckpointKey"
            :disabled="isGenerating || artStore.loading"
            @change="handleCheckpointChange"
          >
            <option value="">Select a checkpoint</option>

            <option
              v-for="checkpoint in checkpointOptions"
              :key="getCheckpointKey(checkpoint)"
              :value="getCheckpointKey(checkpoint)"
              :title="getCheckpointOptionTitle(checkpoint)"
            >
              {{ getCheckpointDropdownLabel(checkpoint) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt break-all text-base-content/60">
              {{ requestedCheckpointName || 'No checkpoint selected' }}
            </span>
          </span>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Sampler</span>
          </span>

          <select
            class="select select-bordered rounded-2xl bg-base-200"
            :value="selectedSamplerName"
            :disabled="isGenerating || artStore.loading"
            @change="handleSamplerChange"
          >
            <option value="">Select a sampler</option>

            <option
              v-for="sampler in samplerOptions"
              :key="sampler.name"
              :value="sampler.name"
            >
              {{ sampler.name }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/60">
              {{ selectedSamplerLabel }}
            </span>
          </span>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Collection</span>
          </span>

          <select
            class="select select-bordered rounded-2xl bg-base-200"
            :value="selectedCollectionId ?? ''"
            :disabled="isGenerating || artStore.loading"
            @change="handleCollectionChange"
          >
            <option value="">Generated Art</option>

            <option
              v-for="collection in collectionOptions"
              :key="collection.id"
              :value="collection.id"
            >
              {{ getCollectionLabel(collection) }}
            </option>
          </select>

          <span class="label">
            <span class="label-text-alt text-base-content/60">
              {{ selectedCollectionLabel }}
            </span>
          </span>
        </label>
      </div>

      <div
        class="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">New Collection</span>
          </span>

          <input
            v-model="newCollectionTitle"
            type="text"
            class="input input-bordered rounded-2xl bg-base-100"
            placeholder="Create a new collection..."
            :disabled="isGenerating || artStore.loading || isCreatingCollection"
            @keydown.enter.prevent="createCollection"
          />
        </label>

        <button
          class="btn btn-secondary rounded-2xl md:self-end"
          type="button"
          :disabled="!canCreateCollection"
          @click="createCollection"
        >
          <span
            v-if="isCreatingCollection"
            class="loading loading-spinner loading-sm"
          />
          <Icon v-else name="kind-icon:plus" class="h-5 w-5" />
          Add Collection
        </button>
      </div>
    </section>

    <section class="rounded-2xl border p-4" :class="modelStatusPanelClass">
      <div class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Icon :name="modelStatusIcon" class="h-5 w-5 shrink-0" />

              <h2 class="text-lg font-black">Model Safety Check</h2>
            </div>

            <p class="mt-1 text-sm opacity-80">
              {{ modelStatusMessage }}
            </p>
          </div>

          <button
            class="btn btn-sm rounded-xl"
            :class="modelStatusButtonClass"
            type="button"
            :disabled="checkpointStore.modelStatusLoading || isGenerating"
            @click="checkActiveModel"
          >
            <span
              v-if="checkpointStore.modelStatusLoading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Check Model
          </button>
        </div>

        <div
          class="grid grid-cols-1 gap-2 text-xs md:grid-cols-2 xl:grid-cols-4"
        >
          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Server</p>
            <p class="mt-1 break-all font-mono">
              {{ activeArtServerLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Server ID</p>
            <p class="mt-1 break-all font-mono">
              {{ selectedArtServer?.id || 'none' }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Engine</p>
            <p class="mt-1 break-all font-mono">
              {{ activeEngineLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Transport</p>
            <p class="mt-1 break-all font-mono">
              {{ selectedTransportLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Selected Checkpoint</p>
            <p class="mt-1 break-all font-mono">
              {{ selectedCheckpointLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Loaded API Model</p>
            <p class="mt-1 break-all font-mono">
              {{ liveApiModelLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Sampler</p>
            <p class="mt-1 break-all font-mono">
              {{ selectedSamplerLabel }}
            </p>
          </div>

          <div class="rounded-2xl bg-base-100/70 p-3">
            <p class="font-bold uppercase opacity-60">Generate Gate</p>
            <p class="mt-1 break-all font-mono">
              {{ generationGateLabel }}
            </p>
          </div>
        </div>

        <div
          v-if="checkpointStore.modelStatusError"
          class="rounded-2xl bg-error/10 p-3 text-sm font-semibold text-error"
        >
          {{ checkpointStore.modelStatusError }}
        </div>
      </div>
    </section>

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
                <span class="font-bold">Server ID:</span>
                {{ selectedArtServer?.id || 'none' }}
              </p>

              <p class="mt-1 break-all">
                <span class="font-bold">Endpoint:</span>
                {{ selectedServerEndpointLabel }}
              </p>

              <p class="mt-1">
                <span class="font-bold">Model:</span>
                {{ selectedCheckpointLabel }}
              </p>

              <p class="mt-1">
                <span class="font-bold">Loaded:</span>
                {{ liveApiModelLabel }}
              </p>

              <p class="mt-1">
                <span class="font-bold">Collection:</span>
                {{ selectedCollectionLabel }}
              </p>

              <p
                v-if="!canGenerate && generationGateReason"
                class="mt-2 font-semibold text-warning"
              >
                {{ generationGateReason }}
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
                Selected model, loaded backend model, and generation routing.
              </p>
            </div>

            <Icon name="kind-icon:server" class="h-6 w-6 text-primary" />
          </div>

          <div class="grid gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Selected Server
              </p>

              <p class="mt-1 break-all text-xs font-semibold text-base-content/80">
                {{ activeArtServerLabel }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Selected Checkpoint Name
              </p>

              <p class="mt-1 break-all text-xs font-semibold text-base-content/80">
                {{ requestedCheckpointName || 'n/a' }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Loaded API Model
              </p>

              <p class="mt-1 break-all text-xs font-semibold text-base-content/80">
                {{ liveApiModelLabel }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Collection
              </p>

              <p class="mt-1 break-all text-xs font-semibold text-base-content/80">
                {{ selectedCollectionLabel }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                class="btn btn-sm btn-outline rounded-xl"
                type="button"
                @click="navStore.setDashboardTab('art', 'checkpoints')"
              >
                More Models
              </button>

              <button
                class="btn btn-sm rounded-xl"
                :class="modelStatusButtonClass"
                type="button"
                :disabled="checkpointStore.modelStatusLoading || isGenerating"
                @click="checkActiveModel"
              >
                <span
                  v-if="checkpointStore.modelStatusLoading"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
                Verify
              </button>
            </div>
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
import type { Resource, Server } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
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
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'

type ResourceLike = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  label?: string | null
  generation?: string | null
  resourceType?: string | null
  isMature?: boolean | null
}

type SamplerLike = {
  id?: number | string
  name: string
  label?: string | null
}

type CollectionLike = {
  id: number
  label?: string | null
  title?: string | null
  name?: string | null
  userId?: number | null
  isPublic?: boolean | null
  isMature?: boolean | null
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
}

type CheckpointReport = {
  tone: 'safe' | 'warning' | 'error' | 'unknown'
  message: string
}

type CheckpointStoreShape = {
  checkpoints?: ResourceLike[]
  resources?: ResourceLike[]
  validCheckpoints?: ResourceLike[]
  checkpointResources?: ResourceLike[]
  selectedCheckpoint?: ResourceLike | null
  selectedSampler?: SamplerLike | null
  samplers?: SamplerLike[]
  samplerOptions?: SamplerLike[]
  modelStatus?: {
    activeModel?: string | null
    tone?: string | null
    message?: string | null
  } | null
  lastGenerationStatus?: {
    requestedCheckpoint?: string | null
    actualGenerationModel?: string | null
    tone?: string | null
    message?: string | null
  } | null
  currentApiModel?: string | null
  activeEngine?: string | null
  hasModelMismatch?: boolean
  modelStatusLoading?: boolean
  modelStatusError?: string
  initialize?: () => Promise<unknown>
  checkActiveModel?: () => Promise<CheckpointReport>
  clearModelStatus?: () => void
  selectSamplerByName?: (name: string) => unknown
  selectCheckpointById?: (id: number) => unknown
  selectCheckpointByName?: (name: string) => unknown
}

type ServerStoreShape = {
  servers?: Server[]
  activeArtServer?: Server | null
  initialize?: (options?: {
    fetchRemote?: boolean
    force?: boolean
  }) => Promise<unknown>
  setActiveServer?: (server: Server) => unknown
  setActiveArtServer?: (server: Server) => unknown
  selectServer?: (id: number) => unknown
  selectServerById?: (id: number) => unknown
}

type CollectionStoreShape = {
  collections?: CollectionLike[]
  currentCollection?: CollectionLike | null
  selectedCollections?: CollectionLike[]
  selectedCollectionIds?: number[]
  fetchCollections?: (force?: boolean) => Promise<unknown>
  setCurrentCollection?: (collectionId: number | null) => void
  setSelectedCollectionIds?: (ids: number[]) => void
  toggleSelectedCollectionId?: (collectionId: number) => void
  clearSelectedCollections?: () => void
  createCollection?: (
    label: string,
    userId: number,
    isPublic?: boolean,
    isMature?: boolean,
  ) => Promise<CollectionLike>
  getOrCreateGeneratedArtCollection?: (userId: number) => Promise<CollectionLike>
}


const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const randomStore = useRandomStore()
const serverStore = useServerStore()

const checkpointApi = checkpointStore as unknown as CheckpointStoreShape
const serverApi = serverStore as unknown as ServerStoreShape
const collectionApi = collectionStore as unknown as CollectionStoreShape

const isGenerating = ref(false)
const isCreatingCollection = ref(false)
const makePretty = ref(false)
const useNegative = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const selectedServerId = ref<number | null>(null)
const selectedCheckpointKey = ref('')
const selectedSamplerName = ref('')
const selectedCollectionId = ref<number | null>(null)
const newCollectionTitle = ref('')

const localCfg = ref(
  (artStore.artForm.cfg ?? 7) + (artStore.artForm.cfgHalf ? 0.5 : 0),
)

const allServers = computed<Server[]>(() => {
  return Array.isArray(serverApi.servers) ? serverApi.servers : []
})

const artServerOptions = computed<Server[]>(() => {
  return allServers.value
    .filter((server) => {
      return Boolean(
        server.isActive &&
          (server.serverType === 'A1111' ||
            server.serverType === 'ART' ||
            server.generationEngine === 'A1111' ||
            server.supportsTxt2Img ||
            server.supportsImg2Img),
      )
    })
    .sort((a, b) => {
      const aOrder = a.sortOrder ?? 0
      const bOrder = b.sortOrder ?? 0

      if (aOrder !== bOrder) return aOrder - bOrder

      return getServerDropdownLabel(a).localeCompare(getServerDropdownLabel(b))
    })
})

const checkpointOptions = computed<ResourceLike[]>(() => {
  const candidates = [
    checkpointApi.checkpoints,
    checkpointApi.resources,
    checkpointApi.validCheckpoints,
    checkpointApi.checkpointResources,
    validCheckpoints as ResourceLike[],
  ]

  const found =
    candidates.find((items) => Array.isArray(items) && items.length) || []

  return [...found]
    .filter((checkpoint) => {
      return Boolean(
        checkpoint?.name &&
          (!checkpoint.resourceType || checkpoint.resourceType === 'CHECKPOINT'),
      )
    })
    .sort((a, b) => {
      return getCheckpointDropdownLabel(a).localeCompare(
        getCheckpointDropdownLabel(b),
      )
    })
})

const samplerOptions = computed<SamplerLike[]>(() => {
  const candidates = [checkpointApi.samplers, checkpointApi.samplerOptions]
  const found =
    candidates.find((items) => Array.isArray(items) && items.length) || []

  if (found.length) {
    return [...found]
      .filter((sampler) => Boolean(sampler?.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  return [
    { name: 'Euler a' },
    { name: 'Euler' },
    { name: 'DPM++ 2M' },
    { name: 'DPM++ 2M Karras' },
    { name: 'DPM++ SDE Karras' },
  ]
})

const collectionOptions = computed<CollectionLike[]>(() => {
  return [...(collectionApi.collections || [])].sort((a, b) => {
    return getCollectionLabel(a).localeCompare(getCollectionLabel(b))
  })
})

const selectedArtServer = computed<Server | null>(() => {
  if (selectedServerId.value) {
    const selected = getServerById(selectedServerId.value)

    if (selected) return selected
  }

  if (serverApi.activeArtServer?.id) {
    return serverApi.activeArtServer
  }

  const formServerId = artStore.artForm.serverId

  if (typeof formServerId === 'number' && formServerId > 0) {
    const formServer = getServerById(formServerId)

    if (formServer) return formServer
  }

  return artServerOptions.value[0] || null
})

const selectedCheckpoint = computed<ResourceLike | null>(() => {
  if (selectedCheckpointKey.value) {
    const match = checkpointOptions.value.find((checkpoint) => {
      return getCheckpointKey(checkpoint) === selectedCheckpointKey.value
    })

    if (match) return match
  }

  return checkpointApi.selectedCheckpoint || null
})

const selectedCollection = computed<CollectionLike | null>(() => {
  if (selectedCollectionId.value) {
    return (
      collectionOptions.value.find((entry) => {
        return entry.id === selectedCollectionId.value
      }) || null
    )
  }

  return collectionApi.currentCollection || collectionApi.selectedCollections?.[0] || null
})

const requestedCheckpointName = computed(() => {
  return selectedCheckpoint.value?.name || ''
})

const selectedCheckpointLabel = computed(() => {
  const label =
    selectedCheckpoint.value?.customLabel ||
    selectedCheckpoint.value?.label ||
    selectedCheckpoint.value?.name ||
    'No checkpoint selected'

  const name = selectedCheckpoint.value?.name || ''

  if (!name || label === name) return label

  return `${label} (${name})`
})

const activeArtServerLabel = computed(() => {
  return (
    selectedArtServer.value?.label ||
    selectedArtServer.value?.title ||
    'No art server selected'
  )
})

const activeEngineLabel = computed(() => {
  return (
    selectedArtServer.value?.generationEngine ||
    selectedArtServer.value?.serverType ||
    checkpointApi.activeEngine ||
    'UNKNOWN'
  )
})

const selectedTransportLabel = computed(() => {
  return selectedArtServer.value?.defaultTransport || 'AUTO'
})

const selectedServerEndpointLabel = computed(() => {
  const server = selectedArtServer.value

  if (!server) return 'n/a'

  const base =
    server.defaultTransport === 'BROWSER'
      ? server.browserBaseUrl || server.baseUrl
      : server.backendBaseUrl || server.baseUrl

  const cleanBase = String(base || '').replace(/\/+$/, '')
  const path = String(server.endpointPath || '').replace(/^\/+/, '')

  return path ? `${cleanBase}/${path}` : cleanBase || 'n/a'
})

const selectedSamplerLabel = computed(() => {
  return (
    selectedSamplerName.value ||
    checkpointApi.selectedSampler?.name ||
    artStore.artForm.sampler ||
    'No sampler selected'
  )
})

const selectedCollectionLabel = computed(() => {
  return selectedCollection.value
    ? getCollectionLabel(selectedCollection.value)
    : 'Generated Art'
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

const currentModelReport = computed(() => {
  return checkpointApi.lastGenerationStatus || checkpointApi.modelStatus
})

const liveApiModelLabel = computed(() => {
  return (
    checkpointApi.modelStatus?.activeModel ||
    checkpointApi.currentApiModel ||
    'Not checked'
  )
})

const lastRequestedModelLabel = computed(() => {
  return (
    checkpointApi.lastGenerationStatus?.requestedCheckpoint ||
    'No generation yet'
  )
})

const lastActualModelLabel = computed(() => {
  return (
    checkpointApi.lastGenerationStatus?.actualGenerationModel ||
    'No generation yet'
  )
})

const modelStatusTone = computed(() => {
  return currentModelReport.value?.tone || 'unknown'
})

const modelStatusMessage = computed(() => {
  if (checkpointApi.modelStatusLoading) {
    return 'Checking the live model state...'
  }

  return currentModelReport.value?.message || 'Model has not been checked yet.'
})

const modelStatusPanelClass = computed(() => {
  if (modelStatusTone.value === 'safe') {
    return 'border-success/40 bg-success/10 text-success'
  }

  if (modelStatusTone.value === 'warning') {
    return 'border-warning/40 bg-warning/10 text-warning'
  }

  if (modelStatusTone.value === 'error') {
    return 'border-error/40 bg-error/10 text-error'
  }

  return 'border-base-300 bg-base-100 text-base-content'
})

const modelStatusButtonClass = computed(() => {
  if (modelStatusTone.value === 'safe') return 'btn-success'
  if (modelStatusTone.value === 'warning') return 'btn-warning'
  if (modelStatusTone.value === 'error') return 'btn-error'

  return 'btn-outline'
})

const modelStatusIcon = computed(() => {
  if (modelStatusTone.value === 'safe') return 'kind-icon:check'
  if (modelStatusTone.value === 'warning') return 'kind-icon:warning'
  if (modelStatusTone.value === 'error') return 'kind-icon:close'

  return 'kind-icon:server'
})

const selectedCheckpointIsMature = computed(() => {
  return Boolean(selectedCheckpoint.value?.isMature)
})

const modelMismatchBlocksGeneration = computed(() => {
  return Boolean(
    checkpointApi.hasModelMismatch && checkpointApi.lastGenerationStatus,
  )
})

const generationGateReason = computed(() => {
  if (isGenerating.value) return 'Generation is already running.'
  if (artStore.loading) return 'Art store is loading.'
  if (!promptStore.promptField?.trim()) return 'Prompt is required.'

  if (!selectedArtServer.value) {
    const requestedId = selectedServerId.value || artStore.artForm.serverId || 'none'

    return `No art server found for selected ID ${requestedId}. Refresh servers or pick another server.`
  }

  if (!isA1111Server(selectedArtServer.value)) {
    return `Selected server #${selectedArtServer.value.id} "${getServerDisplayName(selectedArtServer.value)}" is ${selectedArtServer.value.serverType}/${selectedArtServer.value.generationEngine}. Choose an A1111 Stable Diffusion txt2img server.`
  }

  if (!requestedCheckpointName.value) {
    return 'No checkpoint selected.'
  }

  if (modelMismatchBlocksGeneration.value) {
    return 'Last generation reported a model mismatch. Re-check or change model before generating again.'
  }

  if (selectedCheckpointIsMature.value && !artStore.artForm.isMature) {
    return 'Selected checkpoint is marked mature, but this request is not marked mature.'
  }

  return ''
})

const canGenerate = computed(() => {
  return Boolean(!generationGateReason.value)
})

const generationGateLabel = computed(() => {
  return canGenerate.value ? 'Ready' : generationGateReason.value || 'Blocked'
})

const canCreateCollection = computed(() => {
  return Boolean(
    newCollectionTitle.value.trim() &&
      !isCreatingCollection.value &&
      !isGenerating.value,
  )
})

const promptPreview = computed(() => {
  const lines = [
    `Prompt: ${promptStore.promptField || ''}`,
    artStore.artForm.negativePrompt
      ? `Negative: ${artStore.artForm.negativePrompt}`
      : '',
    `Selected Server ID: ${selectedArtServer.value?.id ?? 'none'}`,
    `Selected Server: ${activeArtServerLabel.value}`,
    `Selected Endpoint: ${selectedServerEndpointLabel.value}`,
    `Selected Checkpoint Key: ${selectedCheckpointKey.value || 'none'}`,
    `Selected Checkpoint Label: ${
      selectedCheckpoint.value?.customLabel ||
      selectedCheckpoint.value?.label ||
      'none'
    }`,
    `Selected Checkpoint Name: ${requestedCheckpointName.value || 'none'}`,
    `Art Form Checkpoint: ${artStore.artForm.checkpoint || 'none'}`,
    `Loaded API Model: ${liveApiModelLabel.value}`,
    `Last Requested: ${lastRequestedModelLabel.value}`,
    `Last Actual: ${lastActualModelLabel.value}`,
    `Sampler: ${selectedSamplerLabel.value}`,
    `Collection: ${selectedCollectionLabel.value}`,
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
  () => serverApi.activeArtServer?.id,
  (id) => {
    if (!id) return

    const server = getServerById(id) || serverApi.activeArtServer

    if (!server) return

    selectedServerId.value = server.id
    artStore.artForm.serverId = server.id
    artStore.artForm.serverName = server.label || server.title
    checkpointApi.clearModelStatus?.()
  },
  { immediate: true },
)

watch(
  () => selectedArtServer.value?.id,
  (id) => {
    if (!id) return

    syncSelectedServerToForm()
    checkpointApi.clearModelStatus?.()
  },
)

watch(
  () => selectedCheckpoint.value?.name,
  () => {
    syncSelectedCheckpointToForm()
  },
  { immediate: true },
)

watch(
  () => selectedSamplerLabel.value,
  (name) => {
    artStore.artForm.sampler = name || ''
  },
  { immediate: true },
)

watch(
  () => selectedCheckpoint.value?.isMature,
  (isMature) => {
    artStore.artForm.isMature = Boolean(isMature)
  },
  { immediate: true },
)

function getServerById(id: number): Server | null {
  return allServers.value.find((server) => server.id === id) || null
}

function getServerDisplayName(server: Server): string {
  const label = server.label || ''
  const title = server.title || ''

  if (label && title && label !== title) {
    return `${label} / ${title}`
  }

  return label || title || `Server ${server.id}`
}

function getServerDropdownLabel(server: Server): string {
  const name = getServerDisplayName(server)
  const engine = server.generationEngine || server.serverType || 'UNKNOWN'
  const transport = server.defaultTransport || 'AUTO'
  const url = server.backendBaseUrl || server.browserBaseUrl || server.baseUrl

  return `#${server.id} · ${name} · ${engine} · ${transport} · ${url}`
}

function getServerOptionTitle(server: Server): string {
  return [
    `ID: ${server.id}`,
    `Title: ${server.title || 'n/a'}`,
    `Label: ${server.label || 'n/a'}`,
    `Type: ${server.serverType || 'n/a'}`,
    `Engine: ${server.generationEngine || 'n/a'}`,
    `Transport: ${server.defaultTransport || 'n/a'}`,
    `Access: ${server.accessMode || 'n/a'}`,
    `Base: ${server.baseUrl || 'n/a'}`,
    `Backend: ${server.backendBaseUrl || 'n/a'}`,
    `Browser: ${server.browserBaseUrl || 'n/a'}`,
    `Endpoint: ${server.endpointPath || 'n/a'}`,
  ].join('\n')
}

function getCheckpointKey(checkpoint: ResourceLike): string {
  return checkpoint.id ? String(checkpoint.id) : String(checkpoint.name || '')
}

function getCheckpointOptionTitle(checkpoint: ResourceLike): string {
  return [
    `ID: ${checkpoint.id || 'n/a'}`,
    `Label: ${checkpoint.customLabel || checkpoint.label || 'n/a'}`,
    `Name: ${checkpoint.name || 'n/a'}`,
    `Generation: ${checkpoint.generation || 'n/a'}`,
    `Mature: ${checkpoint.isMature ? 'yes' : 'no'}`,
  ].join('\n')
}

function getCheckpointDropdownLabel(checkpoint: ResourceLike): string {
  const label =
    checkpoint.customLabel || checkpoint.label || checkpoint.name || 'Checkpoint'
  const generation = checkpoint.generation ? ` · ${checkpoint.generation}` : ''
  const maturity = checkpoint.isMature ? ' · mature' : ''

  return `${label}${generation}${maturity}`
}

function getCollectionLabel(collection: CollectionLike): string {
  return (
    collection.label ||
    collection.title ||
    collection.name ||
    `Collection ${collection.id}`
  )
}

function isA1111Server(server: unknown): boolean {
  if (!server || typeof server !== 'object') return false

  const data = server as {
    serverType?: string | null
    generationEngine?: string | null
    supportsTxt2Img?: boolean | null
    supportsComfyWorkflow?: boolean | null
  }

  return Boolean(
    (data.serverType === 'A1111' || data.generationEngine === 'A1111') &&
      data.supportsTxt2Img &&
      !data.supportsComfyWorkflow,
  )
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function syncPrompt() {
  promptStore.syncToLocalStorage?.()
  artStore.artForm.promptString = promptStore.promptField
}

function syncSelectedCollectionToStore() {
  if (!selectedCollection.value) {
    collectionApi.setCurrentCollection?.(null)
    collectionApi.clearSelectedCollections?.()
    return
  }

  collectionApi.setCurrentCollection?.(selectedCollection.value.id)
  collectionApi.setSelectedCollectionIds?.([selectedCollection.value.id])
}

function syncSelectedCheckpointToForm() {
  const checkpoint = selectedCheckpoint.value

  if (!checkpoint?.name) return

  artStore.artForm.checkpoint = checkpoint.name

  if (checkpoint.isMature) {
    artStore.artForm.isMature = true
  }

  syncCheckpointStoreSelection(checkpoint)
}

function syncSelectedCollectionToStore() {
  if (!selectedCollection.value) {
    collectionApi.setCurrentCollection?.(null)
    return
  }

  if (collectionApi.selectCollection) {
    collectionApi.selectCollection(selectedCollection.value)
    return
  }

  if (collectionApi.selectCollectionById) {
    collectionApi.selectCollectionById(selectedCollection.value.id)
    return
  }

  if (collectionApi.setCurrentCollection) {
    collectionApi.setCurrentCollection(selectedCollection.value)
    return
  }

  collectionApi.currentCollection = selectedCollection.value
}

function syncSamplerToStore(name: string) {
  if (!name) return

  artStore.artForm.sampler = name

  if (checkpointApi.selectSamplerByName) {
    checkpointApi.selectSamplerByName(name)
    return
  }

  const sampler = samplerOptions.value.find((entry) => entry.name === name)

  if (sampler) {
    checkpointApi.selectedSampler = sampler
  }
}

function syncServerStoreSelection(server: Server) {
  if (serverApi.setActiveArtServer) {
    serverApi.setActiveArtServer(server)
    return
  }

  if (serverApi.setActiveServer) {
    serverApi.setActiveServer(server)
    return
  }

  if (serverApi.selectServerById) {
    serverApi.selectServerById(server.id)
    return
  }

  if (serverApi.selectServer) {
    serverApi.selectServer(server.id)
    return
  }

  serverApi.activeArtServer = server
}

function syncCheckpointStoreSelection(checkpoint: ResourceLike) {
  if (checkpoint.id && checkpointApi.selectCheckpointById) {
    checkpointApi.selectCheckpointById(checkpoint.id)
    return
  }

  if (checkpoint.name && checkpointApi.selectCheckpointByName) {
    checkpointApi.selectCheckpointByName(checkpoint.name)
    return
  }

  checkpointApi.selectedCheckpoint = checkpoint
}

function handleServerChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const id = Number(value)

  selectedServerId.value = Number.isInteger(id) && id > 0 ? id : null

  if (!selectedServerId.value) return

  const server = getServerById(selectedServerId.value)

  if (!server) return

  syncServerStoreSelection(server)
  syncSelectedServerToForm()
  checkpointApi.clearModelStatus?.()
  setStatus(`Using #${server.id} ${getServerDisplayName(server)}.`)
}

function handleCheckpointChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  selectedCheckpointKey.value = value

  if (!value) {
    artStore.artForm.checkpoint = ''
    return
  }

  syncSelectedCheckpointToForm()
  checkpointApi.clearModelStatus?.()
  setStatus(`Selected ${selectedCheckpointLabel.value}.`)
}

function handleSamplerChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value

  selectedSamplerName.value = value
  syncSamplerToStore(value)
}

function handleCollectionChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const id = Number(value)

  selectedCollectionId.value = Number.isInteger(id) && id > 0 ? id : null
  syncSelectedCollectionToStore()
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
  checkpointApi.clearModelStatus?.()
  artStore.updateArtListSelection('__negative__', [])
}

async function copyPromptPreview() {
  if (!promptPreview.value) return

  await navigator.clipboard.writeText(promptPreview.value)
  setStatus('Prompt preview copied.')
}

async function checkActiveModel() {
  syncSelectedServerToForm()

  if (!selectedArtServer.value) {
    setStatus('Select an art server before checking the model.', 'error')
    return
  }

  if (!checkpointApi.checkActiveModel) {
    setStatus('Model check is not available in checkpointStore.', 'error')
    return
  }

  const report = await checkpointApi.checkActiveModel()

  if (report.tone === 'safe') {
    setStatus('Model check passed.')
    return
  }

  setStatus(report.message, 'error')
}

async function createCollection() {
  if (!canCreateCollection.value) return

  isCreatingCollection.value = true

  try {
    const title = newCollectionTitle.value.trim()
    const userId = artStore.artForm.userId || 9

    let created: CollectionLike | null = null

    if (collectionApi.createCollection) {
      created = await collectionApi.createCollection(title, userId, false, false)
    } else if (collectionApi.getOrCreateGeneratedArtCollection) {
      created = await collectionApi.getOrCreateGeneratedArtCollection(userId)
    } else {
      const response = await performFetch<CollectionLike>('/api/art/collection', {
        method: 'POST',
        body: JSON.stringify({
          label: title,
          userId,
          isPublic: false,
          isMature: false,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create collection.')
      }

      created = response.data
    }

    await collectionApi.fetchCollections?.(true)

    if (created?.id) {
      selectedCollectionId.value = created.id
      collectionApi.setCurrentCollection?.(created.id)
      collectionApi.setSelectedCollectionIds?.([created.id])
    }

    newCollectionTitle.value = ''
    setStatus(`Created collection "${title}".`)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create collection.'

    setStatus(message, 'error')
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
  } finally {
    isCreatingCollection.value = false
  }
}m

async function generateArt() {
  if (!canGenerate.value) {
    setStatus(generationGateReason.value || 'Generation is blocked.', 'error')
    return
  }

  isGenerating.value = true
  statusMessage.value = ''

  const activeServer = selectedArtServer.value

  try {
    if (!activeServer) {
      throw new Error('No art server selected.')
    }

    if (!requestedCheckpointName.value) {
      throw new Error('No checkpoint selected.')
    }

    syncPrompt()
    syncSelectedServerToForm()
    syncSelectedCheckpointToForm()
    syncSamplerToStore(selectedSamplerLabel.value)
    syncSelectedCollectionToStore()

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
      checkpoint: requestedCheckpointName.value,
      sampler: selectedSamplerLabel.value,
      designer: artStore.artForm.designer,
      userId: artStore.artForm.userId,
      pitch: artStore.artForm.pitch,
      engine:
        activeServer.generationEngine === 'A1111' ||
        activeServer.serverType === 'A1111'
          ? 'a1111'
          : undefined,
      transport:
        activeServer.defaultTransport === 'BACKEND'
          ? 'backend'
          : activeServer.defaultTransport === 'BROWSER'
            ? 'browser'
            : undefined,
    })

    if (!result.success) {
      throw new Error(result.message || 'Generation failed.')
    }

    setStatus(result.message || 'Art generated.')

    await checkpointApi.checkActiveModel?.()
    await milestoneStore.rewardMilestone(11)

    navStore.setDashboardTab('art', 'selected')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Generation failed.'

    setStatus(message, 'error')
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
  } finally {
    isGenerating.value = false
  }
}

function initializeSelections() {
  const initialServer =
    serverApi.activeArtServer ||
    getServerById(artStore.artForm.serverId || 0) ||
    artServerOptions.value[0] ||
    null

  if (initialServer) {
    selectedServerId.value = initialServer.id
    syncServerStoreSelection(initialServer)
    syncSelectedServerToForm()
  }

  const initialCheckpoint =
    checkpointApi.selectedCheckpoint ||
    checkpointOptions.value.find((checkpoint) => {
      return checkpoint.name === artStore.artForm.checkpoint
    }) ||
    checkpointOptions.value[0] ||
    null

  if (initialCheckpoint) {
    selectedCheckpointKey.value = getCheckpointKey(initialCheckpoint)
    syncCheckpointStoreSelection(initialCheckpoint)
    syncSelectedCheckpointToForm()
  }

  const initialSampler =
    checkpointApi.selectedSampler?.name ||
    artStore.artForm.sampler ||
    samplerOptions.value[0]?.name ||
    'Euler a'

  selectedSamplerName.value = initialSampler
  syncSamplerToStore(initialSampler)

  const initialCollection =
    collectionApi.currentCollection ||
    collectionApi.selectedCollections?.[0] ||
    null

  if (initialCollection?.id) {
    selectedCollectionId.value = initialCollection.id
    syncSelectedCollectionToStore()
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

  initializeSelections()
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