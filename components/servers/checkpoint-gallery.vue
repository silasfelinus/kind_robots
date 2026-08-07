<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <!--
      ONE TITLE ROW, THEN THE SHELL'S TOOLBAR.

      This stacked FIVE always-on bands before the first checkpoint: a
      title/subtitle header, a full-width search+family+refresh grid, a
      maturity-toggle band, a sampler panel, and then kr-gallery's mode bar.
      Search, family, refresh, maturity and sampler are all filters over the
      same list, so they belong on the shell's toolbar line rather than owning
      four rows between the user and the thing they came to look at.

      `add-checkpoint` and `server-status` stay as their own bands because they
      are conditional and are not filters -- one is a form, the other is status.
    -->
    <header
      v-if="showHeader"
      class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
    >
      <div class="min-w-0">
        <h2 class="truncate text-sm font-bold text-base-content">
          {{ title }}
        </h2>
        <!-- Orientation text, not instruction: it costs a whole row on the
             screens where rows are scarcest, so it appears only once there is
             room for it. -->
        <p class="hidden truncate text-xs text-base-content/60 md:block">
          {{ subtitleText }}
        </p>
      </div>

      <button
        v-if="allowAdd"
        class="btn btn-xs btn-primary shrink-0 rounded-xl"
        type="button"
        @click="showAdd = !showAdd"
      >
        <Icon name="kind-icon:plus" class="h-3.5 w-3.5" />
        Add
      </button>
    </header>

    <add-checkpoint v-if="showAdd" />

    <server-status v-if="showStatus" compact />

    <!-- The shared shell owns the grid, the mode bar, and the empty state;
         checkpoint-card stays the card. The compact variant is a PICKER, so it
         passes `:modes="[]"` to hide the bar and pins to `icons`, the
         row-shaped grid — the same call server-gallery makes. -->
    <kr-gallery
      :items="galleryItems"
      :mode="compact ? 'icons' : galleryMode"
      :modes="compact ? [] : [...GALLERY_MODES]"
      empty-label="checkpoints"
      @update:mode="galleryMode = $event"
    >
      <template v-if="showControls || showSampler" #toolbar>
        <div class="flex flex-wrap items-center gap-1.5">
          <input
            v-if="showControls"
            v-model="searchQuery"
            class="input input-bordered input-xs w-32 rounded-xl sm:w-44"
            placeholder="Search checkpoints"
            aria-label="Search checkpoints"
          />

          <select
            v-if="showControls"
            v-model="selectedFamily"
            class="select select-bordered select-xs rounded-xl"
            aria-label="Filter by model family"
          >
            <option value="all">All</option>
            <option value="A1111">A1111</option>
            <option value="COMFY">COMFY</option>
            <option value="FLUX">FLUX</option>
            <option value="KONTEXT">KONTEXT</option>
            <option value="SDXL">SDXL</option>
          </select>

          <select
            v-if="showSampler"
            :value="checkpointStore.selectedSampler?.name || ''"
            class="select select-bordered select-xs rounded-xl"
            aria-label="Sampler"
            @change="selectSampler"
          >
            <option value="">No sampler</option>
            <option
              v-for="sampler in checkpointStore.allSamplers"
              :key="sampler.name || sampler.id"
              :value="sampler.name || ''"
            >
              {{ sampler.customLabel || sampler.name }}
            </option>
          </select>

          <!-- `icon`, not `resource`. The resource variant is a labelled block
               with an explanatory sentence under it -- a whole band, which is
               the band this change is removing. The icon variant is the same
               control as a single square toggle, and it keeps the wording as
               its accessible name and tooltip rather than as body text. -->
          <maturity-toggle
            variant="icon"
            label="Mature checkpoint models"
            visible-text="Mature checkpoint models are available for selection."
            hidden-text="Mature checkpoint models are hidden from selection."
          />

          <button
            v-if="showControls && allowRefresh"
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            @click="refreshStatus"
          >
            <Icon name="kind-icon:refresh-cw" class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </template>

      <template #item="{ item }">
        <checkpoint-card
          v-if="checkpointByKey.get(String(item.id))"
          :checkpoint="checkpointByKey.get(String(item.id))!"
          :compact="compact"
          :show-image="showImages"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-select-button="showSelectButtons"
          :can-react="false"
          @open="openCheckpoint"
        />
      </template>

      <template #empty>
        <div
          class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
        >
          <p class="font-bold">No checkpoints found.</p>
          <p class="text-sm text-base-content/60">
            Try another filter or add a checkpoint.
          </p>
        </div>
      </template>
    </kr-gallery>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Resource } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { GALLERY_MODES, type GalleryMode } from '@/utils/galleryVocabulary'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useServerStore } from '@/stores/serverStore'

type CheckpointGalleryVariant = 'dashboard' | 'compact' | 'selector'
type CheckpointModelFamily =
  'all' | 'A1111' | 'COMFY' | 'FLUX' | 'KONTEXT' | 'SDXL'

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
  return server
    ? `Active server: ${server.label || server.title} · ${server.serverType}`
    : 'Checkpoint choices are resources, not server capabilities.'
})

const compact = computed(() => props.compact || props.variant === 'compact')

/*
 * checkpoint-card used to call checkpointStore.selectCheckpointByName()
 * itself and had no emits at all, so a parent could neither intercept the
 * choice nor reuse the card as a picker. The gallery owns it now.
 */
function openCheckpoint(checkpointName: string) {
  checkpointStore.selectCheckpointByName(checkpointName)
}

const filteredCheckpoints = computed<Partial<Resource>[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return checkpointStore.visibleCheckpoints.filter((checkpoint) => {
    const family = selectedFamily.value
    const supportedServer = String(
      checkpoint.supportedServer || checkpoint.generation || '',
    ).toUpperCase()

    if (
      family !== 'all' &&
      supportedServer &&
      !supportedServer.includes(family)
    ) {
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

const galleryMode = ref<GalleryMode>('cards')

/*
 * Checkpoints are Partial<Resource>, so an id can be missing -- the old grid
 * keyed on `checkpoint.id || checkpoint.name` for exactly that reason. The
 * GalleryItem id keeps that fallback and the lookup is keyed by string so the
 * two halves cannot drift apart.
 */
const checkpointKey = (checkpoint: Partial<Resource>): string =>
  String(checkpoint.id ?? checkpoint.name ?? '')

const galleryItems = computed<GalleryItem[]>(() =>
  filteredCheckpoints.value.map((checkpoint) => ({
    id: checkpointKey(checkpoint),
    title: checkpoint.customLabel || checkpoint.name || 'Checkpoint',
    description: checkpoint.description || undefined,
  })),
)

const checkpointByKey = computed(
  () =>
    new Map(
      filteredCheckpoints.value.map((checkpoint) => [
        checkpointKey(checkpoint),
        checkpoint,
      ]),
    ),
)

function selectSampler(event: Event): void {
  const target = event.target as HTMLSelectElement
  checkpointStore.selectSamplerByName(target.value)
}

async function refreshStatus(): Promise<void> {
  await checkpointStore.checkActiveModel()
}

onMounted(() => {
  if (props.autoLoad) {
    checkpointStore.initialize()
  }
})
</script>
