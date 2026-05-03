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
        v-if="showControls"
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
      v-if="variant === 'compact' && compactCheckpoint && !isExpanded"
      class="shrink-0"
    >
      <checkpoint-card
        :checkpoint="compactCheckpoint"
        :art="getCheckpointArt(compactCheckpoint.name)"
        :show-mature="showMature"
        :cache-buster="cacheBuster"
        :compact="true"
        :show-select-button="false"
        :show-description="true"
        :show-meta="false"
        image-height-class="h-24"
        @click="isExpanded = true"
      />
    </section>

    <section
      v-if="variant !== 'compact' || isExpanded"
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
          :art="getCheckpointArt(checkpoint.name)"
          :show-mature="showMature"
          :cache-buster="cacheBuster"
          :compact="isCompact"
          :show-image="showImages"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-select-button="showSelectButtons"
          :show-debug="showDebug"
          :auto-load-art-image="autoLoadArtImages"
        />
      </div>
    </section>

    <section
      v-if="showSampler"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Sampler</span>
        </span>

        <select
          v-model="selectedSamplerName"
          class="select select-bordered w-full bg-base-200"
          @change="checkpointStore.selectSamplerByName(selectedSamplerName)"
        >
          <option disabled value="">Select a sampler...</option>

          <option
            v-for="sampler in checkpointStore.allSamplers"
            :key="sampler.name"
            :value="sampler.name"
          >
            {{ sampler.name }}
          </option>
        </select>
      </label>
    </section>

    <footer
      v-if="showStatus"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs text-base-content/70"
    >
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
        v-if="errorStore.getError"
        class="mt-2 rounded-xl bg-warning/10 p-2 text-warning"
      >
        {{ errorStore.getError }}
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { Resource } from '@/stores/resourceStore'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type CheckpointGalleryVariant = 'dashboard' | 'row' | 'compact'

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
    autoLoadArtImages?: boolean
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
    autoLoadArtImages: true,
  },
)

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const checkpointImages = ref<Record<string, Art | null>>({})
const isExpanded = ref(false)
const isLoading = ref(false)
const searchQuery = ref('')
const cacheBuster = ref(Date.now())

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || props.variant === 'compact'
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'checkpoint-row' : 'checkpoint-grid'
})

const selectedCheckpointName = computed({
  get: () => checkpointStore.selectedCheckpoint?.name ?? '',
  set: (value: string) => {
    if (value) {
      checkpointStore.selectCheckpointByName(value)
    }
  },
})

const selectedSamplerName = computed({
  get: () => checkpointStore.selectedSampler?.name ?? '',
  set: (value: string) => {
    if (value) {
      checkpointStore.selectSamplerByName(value)
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

const baseCheckpoints = computed<Resource[]>(() => {
  return checkpointStore.visibleCheckpoints ?? []
})

const visibleCheckpoints = computed<Resource[]>(() => {
  let checkpoints = baseCheckpoints.value

  if (!showMature.value) {
    checkpoints = checkpoints.filter((checkpoint) => !checkpoint.isMature)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    checkpoints = checkpoints.filter((checkpoint) => {
      const haystack = [
        checkpoint.name,
        checkpoint.customLabel,
        checkpoint.label,
        checkpoint.description,
        checkpoint.localPath,
        checkpoint.category,
        checkpoint.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return checkpoints
})

const displayedCheckpoints = computed<Resource[]>(() => {
  const selected = checkpointStore.selectedCheckpoint?.name

  if (!isExpanded.value && selected) {
    const match = checkpointStore.findCheckpointByName(selected)

    return match ? [match] : []
  }

  return visibleCheckpoints.value
})

const compactCheckpoint = computed<Resource | null>(() => {
  if (isExpanded.value) return null

  const selected = checkpointStore.selectedCheckpoint?.name

  if (selected) {
    return checkpointStore.findCheckpointByName(selected) ?? null
  }

  return displayedCheckpoints.value[0] ?? null
})

const mismatchWarning = computed(() => {
  const selected = selectedCheckpointName.value
  const current = checkpointStore.currentApiModel

  return Boolean(selected && current && selected !== current)
})

const activeModelLabel = computed(() => {
  const selected = checkpointStore.selectedCheckpoint

  if (!showMature.value && selected?.isMature) {
    return 'Hidden Model'
  }

  return checkpointStore.currentApiModel || 'Loading...'
})

const summary = computed(() => {
  const selected =
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.label ||
    checkpointStore.selectedCheckpoint?.name

  if (selected) {
    return `Selected: ${selected}`
  }

  return props.subtitle
})

function updateCacheBuster() {
  cacheBuster.value = Date.now()
}

function getCheckpointArt(name?: string | null): Art | null {
  if (!name) return null

  return checkpointImages.value[name] ?? null
}

async function refreshModel() {
  isLoading.value = true

  try {
    await checkpointStore.fetchCurrentModelFromApi()
    await hydrateSelectedCheckpoint()
    await hydrateCheckpointImages()
    updateCacheBuster()
    errorStore.clearError()
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Could not reach art server'

    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

async function hydrateSelectedCheckpoint() {
  const currentName = checkpointStore.currentApiModel
  const found = currentName
    ? checkpointStore.findCheckpointByName(currentName)
    : null

  if (found?.name && (!found.isMature || showMature.value)) {
    checkpointStore.selectCheckpointByName(found.name)
    return
  }

  const fallback = visibleCheckpoints.value[0]

  if (fallback?.name) {
    checkpointStore.selectCheckpointByName(fallback.name)
  }
}

function hydrateSelectedSampler() {
  if (checkpointStore.selectedSampler) return

  checkpointStore.selectSamplerByName('Euler a')
}

async function hydrateCheckpointImages() {
  const userId = userStore.user?.id ?? userStore.userId ?? 10

  await artStore.initialize({
    fetchRemote: true,
    hydrateImages: false,
    initializeServerStore: false,
    initializeCollections: false,
  })

  const allArt = artStore.art ?? []

  for (const checkpoint of baseCheckpoints.value) {
    const localPath = checkpoint.localPath || checkpoint.name

    if (!localPath || !checkpoint.name) continue

    const matchingArt = allArt
      .filter((art) => {
        return (
          art.checkpoint === localPath &&
          (Boolean(art.isPublic) || art.userId === userId)
        )
      })
      .sort((a, b) => {
        const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
        const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()

        return bDate - aDate
      })

    checkpointImages.value[checkpoint.name] = matchingArt[0] ?? null
  }
}

onMounted(async () => {
  if (!props.autoLoad) return

  isLoading.value = true

  try {
    await refreshModel()
    hydrateSelectedSampler()
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