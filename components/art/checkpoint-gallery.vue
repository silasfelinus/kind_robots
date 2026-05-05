<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p class="text-sm text-base-content/60">
            {{ summary }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ visibleCheckpoints.length }}
        </span>
      </div>

      <div
        v-if="showControls && !isSelectMode"
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
      v-if="isSelectMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="grid grid-cols-1 gap-3">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Model</span>
          </span>

          <select
            v-model="selectedCheckpointName"
            class="select select-bordered w-full bg-base-200"
            :disabled="isLoading || checkpointStore.modelUpdating"
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
          </select>
        </label>

        <label v-if="showSampler" class="form-control">
          <span class="label">
            <span class="label-text font-bold">Sampler</span>
          </span>

          <select
            v-model="selectedSamplerName"
            class="select select-bordered w-full bg-base-200"
            :disabled="isLoading || checkpointStore.modelUpdating"
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
      </div>
    </section>

    <section
      v-if="variant === 'compact' && compactCheckpoint && !isExpanded"
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

    <section
      v-if="!isSelectMode && (variant !== 'compact' || isExpanded)"
      class="min-h-0 flex-1 overflow-auto"
    >
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
      v-if="showSampler && !isSelectMode"
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
      v-if="showStatus && !isSelectMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs text-base-content/70"
    >
      <div
        class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <span class="font-semibold">Active Model:</span>

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

    <div
      v-if="localError && isSelectMode"
      class="rounded-2xl bg-warning/10 p-2 text-xs text-warning"
    >
      {{ localError }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Resource } from '@/stores/resourceStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type CheckpointResource = Partial<Resource> & {
  id?: number
  name?: string | null
  customLabel?: string | null
  description?: string | null
  localPath?: string | null
  MediaPath?: string | null
  generation?: string | null
  isMature?: boolean | null
}

type CheckpointGalleryVariant = 'dashboard' | 'row' | 'compact' | 'select'

const props = withDefaults(
  defineProps<{
    variant?: CheckpointGalleryVariant
    title?: string
    subtitle?: string
    compact?: boolean
    showControls?: boolean
    showSampler?: boolean
    showStatus?: boolean
    showImages?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showSelectButtons?: boolean
    showDebug?: boolean
    allowRefresh?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Checkpoints',
    subtitle: 'Choose the art model used for image generation.',
    compact: false,
    showControls: true,
    showSampler: true,
    showStatus: true,
    showImages: true,
    showDescriptions: true,
    showMeta: true,
    showSelectButtons: false,
    showDebug: false,
    allowRefresh: true,
    autoLoad: true,
  },
)

const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const isExpanded = ref(false)
const isLoading = ref(false)
const searchQuery = ref('')
const cacheBuster = ref(Date.now())
const localError = ref('')

const isSelectMode = computed(() => props.variant === 'select')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || props.variant === 'compact'
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

const visibleCheckpoints = computed<CheckpointResource[]>(() => {
  let checkpoints = baseCheckpoints.value

  if (!showMature.value) {
    checkpoints = checkpoints.filter((checkpoint) => !checkpoint.isMature)
  }

  const query = safeText(searchQuery.value).trim().toLowerCase()

  if (query) {
    checkpoints = checkpoints.filter((checkpoint) => {
      const haystack = [
        checkpoint.name,
        checkpoint.customLabel,
        checkpoint.description,
        checkpoint.localPath,
        checkpoint.MediaPath,
        checkpoint.generation,
      ]
        .map((value) => safeText(value).trim())
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return checkpoints
})

const displayedCheckpoints = computed<CheckpointResource[]>(() => {
  const selected = safeText(checkpointStore.selectedCheckpoint?.name).trim()

  if (!isExpanded.value && selected) {
    const match = checkpointStore.findCheckpointByName(selected)

    return match ? [match as CheckpointResource] : []
  }

  return visibleCheckpoints.value
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

  return displayedCheckpoints.value[0] ?? null
})

const selectedCheckpointLabel = computed(() => {
  const selected = checkpointStore.selectedCheckpoint

  if (!selected) return 'No checkpoint selected'

  return getCheckpointLabel(selected as CheckpointResource)
})

const mismatchWarning = computed(() => {
  const selected = selectedCheckpointName.value
  const current = safeText(checkpointStore.currentApiModel).trim()

  return Boolean(selected && current && selected !== current)
})

const activeModelLabel = computed(() => {
  const selected = checkpointStore.selectedCheckpoint

  if (!showMature.value && selected?.isMature) {
    return 'Hidden Model'
  }

  return safeText(checkpointStore.currentApiModel).trim() || 'Loading...'
})

const summary = computed(() => {
  const selected =
    safeText(checkpointStore.selectedCheckpoint?.customLabel).trim() ||
    safeText(checkpointStore.selectedCheckpoint?.name).trim()

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

async function refreshModel() {
  isLoading.value = true

  try {
    await checkpointStore.fetchCurrentModelFromApi()
    await hydrateSelectedCheckpoint()
    updateCacheBuster()
    errorStore.clearError()
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Could not reach art server model status.'

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
  const found = currentName
    ? (checkpointStore.findCheckpointByName(currentName) as CheckpointResource)
    : null

  const foundName = safeText(found?.name).trim()

  if (foundName && (!found?.isMature || showMature.value)) {
    checkpointStore.selectCheckpointByName(foundName)
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

onMounted(async () => {
  if (!props.autoLoad) return

  isLoading.value = true
  localError.value = ''

  try {
    await refreshModel()
    hydrateSelectedSampler()
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to initialize checkpoints')

    localError.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
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
