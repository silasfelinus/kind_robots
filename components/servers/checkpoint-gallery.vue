<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header v-if="showHeader" class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>
          <p class="text-sm text-base-content/60">
            {{ subtitleText }}
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-sm btn-primary rounded-xl"
          type="button"
          @click="showAdd = !showAdd"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>
      </div>

      <div v-if="showControls" class="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          v-model="searchQuery"
          class="input input-bordered rounded-xl"
          placeholder="Search checkpoints"
        />

        <select v-model="selectedFamily" class="select select-bordered rounded-xl">
          <option value="all">All</option>
          <option value="A1111">A1111</option>
          <option value="COMFY">COMFY</option>
          <option value="FLUX">FLUX</option>
          <option value="KONTEXT">KONTEXT</option>
          <option value="SDXL">SDXL</option>
        </select>

        <button
          v-if="allowRefresh"
          class="btn rounded-xl"
          type="button"
          @click="refreshStatus"
        >
          <Icon name="kind-icon:refresh-cw" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <add-checkpoint v-if="showAdd" />

    <server-status v-if="showStatus" compact />

    <div v-if="showSampler" class="rounded-2xl border border-base-300 bg-base-100 p-3">
      <label class="form-control">
        <span class="label-text font-bold">Sampler</span>
        <select
          :value="checkpointStore.selectedSampler?.name || ''"
          class="select select-bordered rounded-xl"
          @change="selectSampler"
        >
          <option value="">No sampler selected</option>
          <option
            v-for="sampler in checkpointStore.allSamplers"
            :key="sampler.name || sampler.id"
            :value="sampler.name || ''"
          >
            {{ sampler.customLabel || sampler.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="grid gap-3" :class="compact ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-3'">
      <checkpoint-card
        v-for="checkpoint in filteredCheckpoints"
        :key="checkpoint.id || checkpoint.name"
        :checkpoint="checkpoint"
        :compact="compact"
        :show-image="showImages"
        :show-description="showDescriptions"
        :show-meta="showMeta"
        :show-select-button="showSelectButtons"
        :can-react="false"
      />
    </div>

    <div v-if="!filteredCheckpoints.length" class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center">
      <p class="font-bold">No checkpoints found.</p>
      <p class="text-sm text-base-content/60">
        Try another filter or add a checkpoint.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useServerStore } from '@/stores/serverStore'

type CheckpointGalleryVariant = 'dashboard' | 'compact' | 'selector'
type CheckpointModelFamily = 'all' | 'A1111' | 'COMFY' | 'FLUX' | 'KONTEXT' | 'SDXL'

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
    subtitle: '',
    compact: false,
    showHeader: true,
    showControls: true,
    showSampler: true,
    showStatus: true,
    showImages: true,
    showDescriptions: true,
    showMeta: true,
    showSelectButtons: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowRefresh: true,
    autoLoad: true,
  },
)

const checkpointStore = useCheckpointStore()
const serverStore = useServerStore()
const searchQuery = ref('')
const selectedFamily = ref<CheckpointModelFamily>(props.modelFamily)
const showAdd = ref(false)

const title = computed(() => props.title)
const subtitleText = computed(() => {
  if (props.subtitle) return props.subtitle
  const server = serverStore.activeArtServer
  return server ? `Active server: ${server.label || server.title} · ${server.serverType}` : 'Checkpoint choices are resources, not server capabilities.'
})

const compact = computed(() => props.compact || props.variant === 'compact')

const filteredCheckpoints = computed<Partial<Resource>[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return checkpointStore.visibleCheckpoints.filter((checkpoint) => {
    const family = selectedFamily.value
    const supportedServer = String(checkpoint.supportedServer || checkpoint.generation || '').toUpperCase()

    if (family !== 'all' && supportedServer && !supportedServer.includes(family)) {
      return false
    }

    if (!query) return true

    return [
      checkpoint.name,
      checkpoint.customLabel,
      checkpoint.description,
      checkpoint.localPath,
      checkpoint.supportedServer,
      checkpoint.generation,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

function selectSampler(event: Event) {
  const target = event.target as HTMLSelectElement
  checkpointStore.selectSamplerByName(target.value)
}

async function refreshStatus() {
  await checkpointStore.checkActiveModel()
}

onMounted(() => {
  if (props.autoLoad) {
    checkpointStore.initialize()
  }
})
</script>
