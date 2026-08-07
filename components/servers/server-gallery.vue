<!-- /components/server/server-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <!-- ONE ROW. This was a title/subtitle row plus a full-width controls grid
         (`grid gap-2 md:grid-cols-[1fr_auto_auto]`, so one column and three
         rows below md). Filter, type and refresh are all filters over the same
         list, so they ride the shell's toolbar line instead. -->
    <header
      v-if="showHeader"
      class="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
    >
      <div class="min-w-0">
        <h2 class="truncate text-sm font-bold text-base-content">
          {{ resolvedTitle }}
        </h2>
        <p class="hidden truncate text-xs text-base-content/60 md:block">
          {{ resolvedSubtitle }}
        </p>
      </div>

      <button
        v-if="showCardActions"
        class="btn btn-xs btn-primary shrink-0 rounded-xl"
        type="button"
        @click="startAddServer"
      >
        <Icon name="kind-icon:plus" class="h-3.5 w-3.5" />
        Add Server
      </button>
    </header>

    <add-server v-if="showAddServer" />

    <!-- The shared shell owns the grid, the mode bar, and the loading and empty
         states; server-card stays the card.

         The compact variants pass `:modes="[]"`, which hides the bar: a row or
         a dropdown is a PICKER, not a gallery, and offering Cards/Heroes/Icons
         inside one would be offering a choice that has nowhere to land. They
         are pinned to `icons`, whose grid is the row-shaped one — and because
         every MODE_GRID_CLASS is auto-fill over `minmax(min(X,100%),1fr)`, it
         collapses to a single column in a narrow container on its own. -->
    <kr-gallery
      :items="galleryItems"
      :mode="isCompact ? 'icons' : galleryMode"
      :modes="isCompact ? [] : [...GALLERY_MODES]"
      :loading="serverStore.loading || isLoading"
      empty-label="servers"
      @update:mode="galleryMode = $event"
    >
      <template v-if="showControls" #toolbar>
        <div class="flex flex-wrap items-center gap-1.5">
          <input
            v-model="searchQuery"
            class="input input-bordered input-xs w-32 rounded-xl sm:w-44"
            placeholder="Filter servers"
            aria-label="Filter servers"
          />

          <select
            v-model="selectedType"
            class="select select-bordered select-xs rounded-xl"
            aria-label="Filter by server type"
          >
            <option value="all">All types</option>
            <option value="A1111">A1111</option>
            <option value="COMFY">COMFY</option>
            <option value="OPENAI">OPENAI</option>
            <option value="ANTHROPIC">ANTHROPIC</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>

          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            @click="refreshServers"
          >
            <Icon name="kind-icon:refresh-cw" class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </template>
      <template #item="{ item }">
        <server-card
          v-if="serverById.get(Number(item.id))"
          :server="serverById.get(Number(item.id))!"
          :compact="isCompact"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-use-buttons="showUseButtons"
          :show-actions="showCardActions"
          :allow-edit="showCardActions"
          :allow-test="showCardActions"
        />
      </template>

      <template #empty>
        <div
          class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
        >
          <Icon
            name="kind-icon:server-off"
            class="mx-auto mb-2 h-8 w-8 text-base-content/40"
          />
          <p class="font-bold">No matching servers.</p>
          <p class="text-sm text-base-content/60">
            Add a configured A1111, Comfy, OpenAI, Anthropic, or Custom
            endpoint.
          </p>
        </div>
      </template>
    </kr-gallery>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { GALLERY_MODES, type GalleryMode } from '@/utils/galleryVocabulary'
import { useServerStore } from '@/stores/serverStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ServerGalleryMode = 'art' | 'text' | 'all'
type ServerVisibility = 'owned' | 'owned-and-public' | 'all'
type FamilyValue = 'sd' | 'comfy' | 'openai' | 'anthropic' | 'custom' | 'all'

const props = withDefaults(
  defineProps<{
    mode?: ServerGalleryMode
    variant?: GalleryVariant
    visibility?: ServerVisibility
    title?: string
    subtitle?: string
    selectedFamily?: FamilyValue
    useDefault?: boolean | null
    showHeader?: boolean
    showControls?: boolean
    showFamilySelect?: boolean
    showUseDefaultToggle?: boolean
    showAdvancedToggle?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showCapabilities?: boolean
    showUseButtons?: boolean
    autoLoad?: boolean
  }>(),
  {
    mode: 'all',
    variant: 'dashboard',
    visibility: 'owned-and-public',
    title: '',
    subtitle: '',
    selectedFamily: 'all',
    useDefault: null,
    showHeader: true,
    showControls: true,
    showFamilySelect: true,
    showUseDefaultToggle: true,
    showAdvancedToggle: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showCapabilities: false,
    showUseButtons: true,
    autoLoad: true,
  },
)

const emit = defineEmits<{
  'update:useDefault': [value: boolean]
  'update:selectedFamily': [value: FamilyValue]
}>()

const serverStore = useServerStore()
const searchQuery = ref('')
const selectedType = ref<ServerType | 'all'>('all')
const isLoading = ref(false)
const showAddServer = ref(false)

const resolvedTitle = computed(() => {
  return (
    props.title ||
    (props.mode === 'art'
      ? 'Art Servers'
      : props.mode === 'text'
        ? 'Text Servers'
        : 'Servers')
  )
})

const resolvedSubtitle = computed(() => {
  return (
    props.subtitle ||
    'Configured access points only. Route behavior lives in endpoints now.'
  )
})

/*
 * The grid moved to kr-gallery. What used to be `md:grid-cols-2 xl:grid-cols-3`
 * is now MODE_GRID_CLASS, which is container-responsive rather than
 * viewport-responsive -- this gallery is mounted inside manager panels, where
 * `xl:` fired on a wide screen while the actual container was narrow.
 */
const isCompact = computed(
  () => props.variant === 'row' || props.variant === 'dropdown',
)

const galleryMode = ref<GalleryMode>('cards')

const galleryItems = computed<GalleryItem[]>(() =>
  filteredServers.value.map((server) => ({
    id: server.id,
    title: server.title || server.label || `Server ${server.id}`,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const serverById = computed(
  () => new Map(filteredServers.value.map((server) => [server.id, server])),
)

const serversByMode = computed<Server[]>(() => {
  const servers = Array.isArray(serverStore.servers) ? serverStore.servers : []

  if (props.mode === 'art') {
    return servers.filter(
      (server) =>
        server.serverType === 'A1111' || server.serverType === 'COMFY',
    )
  }

  if (props.mode === 'text') {
    return servers.filter((server) => {
      return ['OPENAI', 'ANTHROPIC', 'CUSTOM'].includes(server.serverType)
    })
  }

  return servers
})

const filteredServers = computed<Server[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return serversByMode.value.filter((server) => {
    if (!server.isActive) return false
    if (
      selectedType.value !== 'all' &&
      server.serverType !== selectedType.value
    )
      return false

    if (!query) return true

    return [
      server.title,
      server.label,
      server.description,
      server.category,
      server.baseUrl,
      server.endpointPath,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

async function refreshServers() {
  isLoading.value = true

  try {
    await serverStore.initialize({
      force: true,
      fetchRemote: true,
    })
  } finally {
    isLoading.value = false
  }
}

function startAddServer() {
  serverStore.createNewServer?.(props.mode === 'text' ? 'OPENAI' : 'COMFY')
  serverStore.openServerForm?.()
  showAddServer.value = true
}

watch(
  () => props.selectedFamily,
  (value) => {
    emit('update:selectedFamily', value)
  },
)

onMounted(async () => {
  if (props.autoLoad && !serverStore.hasLoaded) {
    await refreshServers()
  }
})
</script>
