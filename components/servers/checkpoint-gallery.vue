<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p class="truncate text-sm text-base-content/60">
            {{ summary }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span v-if="!isLoading" class="badge badge-ghost">
            {{ visibleCheckpoints.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="openAddCheckpoint"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto]"
      >
        <label
          v-if="userStore.isAdmin"
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Show Mature</span>

          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
          />
        </label>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search checkpoints..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search checkpoints"
        />

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading || checkpointStore.modelUpdating"
          @click="refreshModel"
        >
          <span
            v-if="isLoading || checkpointStore.modelUpdating"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showCheckpointForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <add-checkpoint
        :checkpoint="editingCheckpoint"
        @saved="handleCheckpointSaved"
        @close="closeCheckpointForm"
      />
    </section>

    <section
      v-if="isDropdownMode"
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
          >
            <Icon name="kind-icon:checkpoint" class="h-6 w-6 text-primary" />
          </div>

          <div class="min-w-0">
            <p class="text-xs font-bold uppercase text-base-content/50">
              Current Checkpoint
            </p>

            <h3 class="truncate text-base font-black text-base-content">
              {{ selectedCheckpointLabel }}
            </h3>

            <p class="truncate text-sm text-base-content/60">
              {{ activeModelLabel }}
            </p>
          </div>
        </div>

        <button
          v-if="canEditSelected"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          @click="openEditCheckpoint"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          <span class="hidden sm:inline">Edit</span>
        </button>
      </div>

      <select
        class="select select-bordered w-full bg-base-200"
        :value="selectedCheckpointName"
        :disabled="isLoading || checkpointStore.modelUpdating"
        aria-label="Select checkpoint"
        @change="selectCheckpointFromEvent"
      >
        <option disabled value="">Select a checkpoint...</option>

        <option
          v-for="checkpoint in visibleCheckpoints"
          :key="checkpoint.name || checkpoint.id"
          :value="safeText(checkpoint.name).trim()"
          :disabled="!safeText(checkpoint.name).trim()"
        >
          {{ getCheckpointLabel(checkpoint) }}
        </option>

        <option v-if="allowAdd" disabled>──────────</option>

        <option v-if="allowAdd" value="__add__">Add Checkpoint</option>
      </select>

      <select
        v-if="showSampler"
        v-model="selectedSamplerName"
        class="select select-bordered w-full bg-base-200"
        :disabled="isLoading || checkpointStore.modelUpdating"
        aria-label="Select sampler"
      >
        <option disabled value="">Select a sampler...</option>

        <option
          v-for="sampler in checkpointStore.allSamplers"
          :key="sampler.name"
          :value="safeText(sampler.name).trim()"
        >
          {{ sampler.name }}
        </option>
      </select>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs">
        <p>
          <span class="font-bold">Selected:</span>
          {{ selectedCheckpointLabel }}
        </p>

        <p class="mt-1">
          <span class="font-bold">Active API Model:</span>
          {{ activeModelLabel }}
        </p>

        <p v-if="mismatchWarning" class="mt-1 font-semibold text-warning">
          Selected model does not match the active backend model.
        </p>
      </div>

      <button
        v-if="allowRefresh"
        class="btn btn-outline btn-sm rounded-xl"
        type="button"
        :disabled="isLoading || checkpointStore.modelUpdating"
        @click="refreshModel"
      >
        <span
          v-if="isLoading || checkpointStore.modelUpdating"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        Refresh Model
      </button>

      <div
        v-if="localError"
        class="rounded-2xl bg-warning/10 p-2 text-xs text-warning"
      >
        {{ localError }}
      </div>
    </section>

    <section
      v-else-if="variant === 'compact' && compactCheckpoint && !isExpanded"
      class="shrink-0"
    >
      <checkpoint-card
        :checkpoint="compactCheckpoint"
        :show-mature="showMature"
        :cache-buster="cacheBuster"
        :compact="true"
        :show-select-button="false"
        :show-description="true"
        :show-meta="false"
        :show-reaction="false"
        image-height-class="h-24"
        @click="isExpanded = true"
      />
    </section>

    <section v-else class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full min-h-60 items-center justify-center"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="visibleCheckpoints.length === 0"
        class="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
      >
        <Icon name="kind-icon:checkpoint" class="h-12 w-12 text-primary" />

        <p class="mt-2 text-lg font-bold">No checkpoints found.</p>

        <p class="mt-1 text-sm">
          Either the models are hiding, or the filter gremlin is overachieving.
        </p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm mt-2 rounded-xl"
          type="button"
          @click="openAddCheckpoint"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Checkpoint
        </button>
      </div>

      <div v-else :class="layoutClass">
        <checkpoint-card
          v-for="checkpoint in visibleCheckpoints"
          :key="checkpoint.name || checkpoint.id"
          :checkpoint="checkpoint"
          :show-mature="showMature"
          :cache-buster="cacheBuster"
          :compact="isCompact"
          :show-image="showImages"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-select-button="showSelectButtons"
          :show-reaction="false"
          :show-debug="showDebug"
        />
      </div>
    </section>

    <section
      v-if="showSampler && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Sampler</span>
        </span>

        <select
          v-model="selectedSamplerName"
          class="select select-bordered w-full bg-base-200"
        >
          <option disabled value="">Select a sampler...</option>

          <option
            v-for="sampler in checkpointStore.allSamplers"
            :key="sampler.name"
            :value="safeText(sampler.name).trim()"
          >
            {{ sampler.name }}
          </option>
        </select>
      </label>
    </section>

    <footer
      v-if="showStatus && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs text-base-content/70"
    >
      <div
        class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <span class="font-semibold">
            {{
              isLiveModelCheckRelevant ? 'Active API Model:' : 'Server Model:'
            }}
          </span>

          <span class="ml-1 font-mono text-primary">
            <Icon
              v-if="checkpointStore.modelUpdating"
              name="kind-icon:loading"
              class="inline h-3 w-3 animate-spin text-warning"
            />

            <span v-else>
              {{ activeModelLabel }}
            </span>

            <span
              v-if="mismatchWarning"
              class="ml-1 font-semibold text-warning"
            >
              (≠ selected)
            </span>
          </span>
        </div>

        <button
          class="btn btn-xs btn-outline rounded-xl"
          type="button"
          :disabled="isLoading || checkpointStore.modelUpdating"
          @click="refreshModel"
        >
          Refresh
        </button>
      </div>

      <div
        v-if="localError"
        class="mt-2 rounded-xl bg-warning/10 p-2 text-warning"
      >
        {{ localError }}
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Resource } from '@/stores/resourceStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import {
  resourceSupportsServer,
  type ResourceServerLink,
} from '@/stores/helpers/resourceCompatibility'

type CheckpointResource = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  description?: string | null
  localPath?: string | null
  MediaPath?: string | null
  customUrl?: string | null
  civitaiUrl?: string | null
  huggingUrl?: string | null
  generation?: string | null
  supportedServer?: string | null
  Servers?: ResourceServerLink[] | number[] | null
  isMature?: boolean | null
  userId?: number | null
}

type CheckpointGalleryVariant = 'dashboard' | 'row' | 'compact' | 'dropdown'
type CheckpointModelFamily = 'all' | 'sdxl' | 'flux'

const props = withDefaults(
  defineProps<{
    variant?: CheckpointGalleryVariant
    modelFamily?: CheckpointModelFamily
    title?: string
    subtitle?: string
    compact?: boolean
    showHeader?: boolean
    showControls?: boolean
    showSampler?: boolean
    showStatus?: boolean
    showImages?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showSelectButtons?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowRefresh?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    modelFamily: 'all',
    title: 'Checkpoints',
    subtitle: 'Choose the art model used for image generation.',
    compact: false,
    showHeader: true,
    showControls: true,
    showSampler: true,
    showStatus: true,
    showImages: true,
    showDescriptions: true,
    showMeta: true,
    showSelectButtons: false,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowRefresh: true,
    autoLoad: true,
  },
)

const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()
const userStore = useUserStore()
const serverStore = useServerStore()

const isExpanded = ref(false)
const isLoading = ref(false)
const searchQuery = ref('')
const cacheBuster = ref(Date.now())
const localError = ref('')
const showCheckpointForm = ref(false)
const editingCheckpoint = ref<CheckpointResource | null>(null)

const activeServer = computed(() => {
  return serverStore.currentServer || serverStore.activeArtServer
})

const isDropdownMode = computed(() => {
  return props.variant === 'dropdown'
})

const isCompact = computed(() => {
  return (
    props.compact ||
    props.variant === 'row' ||
    props.variant === 'compact' ||
    isDropdownMode.value
  )
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'checkpoint-row' : 'checkpoint-grid'
})

const selectedCheckpointName = computed({
  get: () => safeText(checkpointStore.selectedCheckpoint?.name).trim(),
  set: (value: string) => {
    const name = safeText(value).trim()

    if (name) {
      checkpointStore.selectCheckpointByName(name)
    }
  },
})

const selectedSamplerName = computed({
  get: () => safeText(checkpointStore.selectedSampler?.name).trim(),
  set: (value: string) => {
    const name = safeText(value).trim()

    if (name) {
      checkpointStore.selectSamplerByName(name)
    }
  },
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return

    await userStore.updateUser({ showMature: value })
  },
})

const baseCheckpoints = computed<CheckpointResource[]>(() => {
  const checkpoints = checkpointStore.visibleCheckpoints

  return Array.isArray(checkpoints) ? (checkpoints as CheckpointResource[]) : []
})

const accessibleCheckpoints = computed<CheckpointResource[]>(() => {
  if (userStore.isAdmin) return baseCheckpoints.value

  return baseCheckpoints.value.filter((checkpoint) => {
    return !checkpoint.userId || checkpoint.userId === currentUserId.value
  })
})

const visibleCheckpoints = computed<CheckpointResource[]>(() => {
  let checkpoints = accessibleCheckpoints.value.filter((checkpoint) => {
    return resourceSupportsServer(checkpoint, activeServer.value)
  })

  checkpoints = checkpoints.filter((checkpoint) => {
    return matchesModelFamily(checkpoint, props.modelFamily)
  })

  if (!showMature.value) {
    checkpoints = checkpoints.filter((checkpoint) => !checkpoint.isMature)
  }

  const query = safeText(searchQuery.value).trim().toLowerCase()

  if (query) {
    checkpoints = checkpoints.filter((checkpoint) => {
      return checkpointHaystack(checkpoint).includes(query)
    })
  }

  return checkpoints
})

const compactCheckpoint = computed<CheckpointResource | null>(() => {
  if (isExpanded.value) return null

  const selected = safeText(checkpointStore.selectedCheckpoint?.name).trim()

  if (selected) {
    return (
      (checkpointStore.findCheckpointByName(selected) as CheckpointResource) ??
      null
    )
  }

  return visibleCheckpoints.value[0] ?? null
})

const selectedCheckpoint = computed(() => {
  return checkpointStore.selectedCheckpoint as CheckpointResource | null
})

const canEditSelected = computed(() => {
  const checkpoint = selectedCheckpoint.value

  if (!props.allowEdit || !checkpoint?.id) return false
  if (userStore.isAdmin) return true

  return checkpoint.userId === currentUserId.value
})

const selectedCheckpointLabel = computed(() => {
  const selected = selectedCheckpoint.value

  if (!selected) return 'No checkpoint selected'

  return getCheckpointLabel(selected)
})

const isLiveModelCheckRelevant = computed(() => {
  const server = activeServer.value

  return Boolean(
    server &&
    (server.serverType === 'A1111' || server.generationEngine === 'A1111'),
  )
})

const mismatchWarning = computed(() => {
  if (!isLiveModelCheckRelevant.value) return false

  const selected = selectedCheckpointName.value
  const current = safeText(checkpointStore.currentApiModel).trim()

  return Boolean(selected && current && selected !== current)
})

const activeModelLabel = computed(() => {
  const selected = selectedCheckpoint.value

  if (!showMature.value && selected?.isMature) {
    return 'Hidden Model'
  }

  const currentApiModel = safeText(checkpointStore.currentApiModel).trim()

  if (currentApiModel) return currentApiModel

  const server = activeServer.value

  return (
    safeText(server?.model).trim() ||
    safeText(server?.workflowVersion).trim() ||
    safeText(server?.label).trim() ||
    safeText(server?.title).trim() ||
    'No active model'
  )
})

const summary = computed(() => {
  const selected =
    safeText(selectedCheckpoint.value?.customLabel).trim() ||
    safeText(selectedCheckpoint.value?.name).trim()

  if (selected) {
    return `Selected: ${selected}`
  }

  return props.subtitle
})

function safeText(value: unknown): string {
  if (typeof value === 'string') return value

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function checkpointHaystack(checkpoint: CheckpointResource): string {
  return [
    checkpoint.name,
    checkpoint.customLabel,
    checkpoint.description,
    checkpoint.localPath,
    checkpoint.MediaPath,
    checkpoint.customUrl,
    checkpoint.civitaiUrl,
    checkpoint.huggingUrl,
    checkpoint.generation,
    checkpoint.supportedServer,
  ]
    .map((value) => safeText(value).trim())
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function matchesModelFamily(
  checkpoint: CheckpointResource,
  family: CheckpointModelFamily,
): boolean {
  if (family === 'all') return true

  const haystack = checkpointHaystack(checkpoint)

  if (family === 'flux') {
    return (
      haystack.includes('flux') ||
      haystack.includes(' schnell') ||
      haystack.includes(' dev') ||
      haystack.includes('kontext')
    )
  }

  return (
    haystack.includes('sdxl') ||
    haystack.includes('xl') ||
    haystack.includes('stable diffusion') ||
    haystack.includes('checkpoint') ||
    haystack.includes('a1111')
  )
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const possibleMessage =
      'message' in error
        ? safeText((error as { message?: unknown }).message)
        : ''

    if (possibleMessage.trim()) {
      return possibleMessage
    }

    const possibleStatusMessage =
      'statusMessage' in error
        ? safeText((error as { statusMessage?: unknown }).statusMessage)
        : ''

    if (possibleStatusMessage.trim()) {
      return possibleStatusMessage
    }
  }

  return fallback
}

function getCheckpointLabel(checkpoint: CheckpointResource): string {
  if (checkpoint.isMature && !showMature.value) return 'Hidden Checkpoint'

  return (
    safeText(checkpoint.customLabel).trim() ||
    safeText(checkpoint.name).trim() ||
    `Checkpoint #${checkpoint.id ?? 'unknown'}`
  )
}

function updateCacheBuster() {
  cacheBuster.value = Date.now()
}

function selectCheckpointFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    openAddCheckpoint()
    return
  }

  const name = safeText(target.value).trim()

  if (name) {
    checkpointStore.selectCheckpointByName(name)
  }
}

function openAddCheckpoint() {
  editingCheckpoint.value = null
  showCheckpointForm.value = true
}

function openEditCheckpoint() {
  if (!selectedCheckpoint.value) return

  editingCheckpoint.value = selectedCheckpoint.value
  showCheckpointForm.value = true
}

function closeCheckpointForm() {
  showCheckpointForm.value = false
  editingCheckpoint.value = null
}

function isCheckpointResource(value: unknown): value is Partial<Resource> {
  return Boolean(value && typeof value === 'object')
}

async function handleCheckpointSaved(resource: unknown) {
  if (isCheckpointResource(resource) && resource.name) {
    checkpointStore.selectCheckpointByName(resource.name)
  }

  closeCheckpointForm()
  await hydrateSelectedCheckpoint()
  updateCacheBuster()
}

async function refreshModel() {
  isLoading.value = true
  localError.value = ''

  try {
    const server = activeServer.value

    if (!server) {
      await hydrateSelectedCheckpoint()
      hydrateSelectedSampler()
      return
    }

    if (server.generationEngine === 'A1111' || server.serverType === 'A1111') {
      await serverStore.fetchA1111Options(server)
    }

    await checkpointStore.fetchCurrentModelFromApi(server)
    await hydrateSelectedCheckpoint()
    updateCacheBuster()
    errorStore.clearError()
  } catch (error) {
    const server = activeServer.value

    if (
      server &&
      server.generationEngine !== 'A1111' &&
      server.serverType !== 'A1111'
    ) {
      await hydrateSelectedCheckpoint()
      updateCacheBuster()
      return
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Could not reach art server model status.'

    localError.value = message

    errorStore.setError(
      ErrorType.NETWORK_ERROR,
      `Model status unavailable: ${message}`,
    )
  } finally {
    isLoading.value = false
  }
}

async function hydrateSelectedCheckpoint() {
  const currentName = safeText(checkpointStore.currentApiModel).trim()

  if (currentName) {
    const found = checkpointStore.findCheckpointByName(
      currentName,
    ) as CheckpointResource | null

    if (found) {
      const foundName = safeText(found.name).trim()

      if (
        foundName &&
        (!found.isMature || showMature.value) &&
        resourceSupportsServer(found, activeServer.value)
      ) {
        checkpointStore.selectCheckpointByName(foundName)
        return
      }
    }
  }

  const selected = selectedCheckpoint.value

  if (
    selected &&
    selected.name &&
    resourceSupportsServer(selected, activeServer.value) &&
    (!selected.isMature || showMature.value)
  ) {
    return
  }

  const fallbackName = safeText(visibleCheckpoints.value[0]?.name).trim()

  if (fallbackName) {
    checkpointStore.selectCheckpointByName(fallbackName)
  }
}

function hydrateSelectedSampler() {
  if (checkpointStore.selectedSampler) return

  checkpointStore.selectSamplerByName('Euler a')
}

async function doInitialModelRefresh() {
  isLoading.value = true
  localError.value = ''

  try {
    await refreshModel()
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to initialize checkpoints')
    localError.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!props.autoLoad) return

  hydrateSelectedSampler()

  if (!props.showStatus) return

  // If servers are already loaded (kind-loader ran first), go immediately.
  // Otherwise watch for them — don't race the loader.
  if (serverStore.hasLoaded) {
    await doInitialModelRefresh()
  } else {
    const unwatch = watch(
      () => serverStore.hasLoaded,
      async (loaded) => {
        if (!loaded) return
        unwatch()
        await doInitialModelRefresh()
      },
    )
  }
})
</script>

<style scoped>
.checkpoint-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}

.checkpoint-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.checkpoint-row > * {
  min-width: min(220px, 85vw);
  max-width: 340px;
}
</style>
