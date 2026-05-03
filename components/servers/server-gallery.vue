<!-- /components/server/server-gallery.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p v-if="activeServer" class="truncate text-sm text-base-content/70">
            Active:
            <span class="font-semibold text-primary">
              {{ activeServer.label || activeServer.title }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredServers.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="selectedType"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter servers by type"
        >
          <option value="all">All types</option>
          <option value="ART">ART</option>
          <option value="A1111">A1111</option>
          <option value="COMFY">COMFY</option>
          <option value="TEXT">TEXT</option>
          <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
          <option value="OTHER">OTHER</option>
        </select>

        <select
          v-model="selectedScope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter servers by scope"
        >
          <option value="visible">Visible active</option>
          <option value="owned">Mine</option>
          <option value="official">Official</option>
          <option value="public">Public</option>
          <option value="hidden">Hidden</option>
          <option value="all">All loaded</option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search servers"
          placeholder="Search servers..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingServer"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!serverStore.selectedServer"
          @click="startEditingSelectedServer"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!serverStore.selectedServer"
          @click="clearSelectedServer"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshServers(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showServerForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <add-server @saved="handleServerSaved" @close="closeServerForm" />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="serverStore.lastError"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ serverStore.lastError }}
        </p>
      </div>

      <div
        v-else-if="filteredServers.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:server" class="h-10 w-10" />
        <p class="text-lg font-bold">No servers found.</p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingServer"
        >
          Add a server
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="activeServer?.id ?? ''"
          aria-label="Select server"
          @change="selectServerFromEvent"
        >
          <option value="">
            {{ dropdownPlaceholder }}
          </option>

          <option
            v-for="server in filteredServers"
            :key="server.id"
            :value="server.id"
          >
            [{{ server.serverType }}] {{ server.label || server.title }}
          </option>
        </select>
      </div>

      <div v-else :class="layoutClass">
        <server-card
          v-for="server in filteredServers"
          :key="server.id"
          :server="server"
          :selected="isSelected(server.id)"
          :compact="isCompact"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-use-buttons="showUseButtons"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          :allow-test="allowTest"
          @select="selectServerById"
          @edit="startEditingServerById"
          @delete="handleServerDeleted"
          @test="handleServerTested"
          @use-art="setActiveArtServer"
          @use-text="setActiveTextServer"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ServerGalleryMode = 'art' | 'text' | 'all'
type ServerScope =
  | 'visible'
  | 'owned'
  | 'official'
  | 'public'
  | 'hidden'
  | 'all'

const props = withDefaults(
  defineProps<{
    mode?: ServerGalleryMode
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showUseButtons?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowTest?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    mode: 'all',
    variant: 'dashboard',
    title: 'Servers',
    subtitle: 'Pick a server.',
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showUseButtons: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowTest: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const serverStore = useServerStore()
const userStore = useUserStore()

const selectedType = ref<ServerType | 'all'>('all')
const selectedScope = ref<ServerScope>('visible')
const searchQuery = ref('')
const isLoading = ref(false)
const showServerForm = ref(false)

const activeServer = computed(() => {
  if (props.mode === 'art') return serverStore.activeArtServer
  if (props.mode === 'text') return serverStore.activeTextServer
  return serverStore.selectedServer
})

const isCompact = computed(
  () =>
    props.compact || props.variant === 'row' || props.variant === 'dropdown',
)

const layoutClass = computed(() =>
  props.variant === 'row' ? 'server-row' : 'server-grid',
)

const dropdownPlaceholder = computed(() => {
  if (props.mode === 'art') return 'Use default art server'
  if (props.mode === 'text') return 'Use default text server'
  return 'Choose a server'
})

const baseServers = computed<Server[]>(() => {
  if (props.mode === 'art') return serverStore.artServers
  if (props.mode === 'text') return serverStore.textServers

  if (selectedScope.value === 'owned') return serverStore.ownedServers
  if (selectedScope.value === 'official') return serverStore.officialServers
  if (selectedScope.value === 'public') return serverStore.publicServers
  if (selectedScope.value === 'hidden') return serverStore.hiddenServers
  if (selectedScope.value === 'all') return serverStore.servers

  return serverStore.visibleActiveServers
})

const filteredServers = computed(() => {
  let servers = baseServers.value

  if (selectedType.value !== 'all') {
    servers = servers.filter(
      (server) => server.serverType === selectedType.value,
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    servers = servers.filter((server) => {
      return (
        (server.title || '').toLowerCase().includes(query) ||
        (server.label || '').toLowerCase().includes(query) ||
        (server.description || '').toLowerCase().includes(query) ||
        (server.baseUrl || '').toLowerCase().includes(query) ||
        (server.category || '').toLowerCase().includes(query) ||
        (server.serverType || '').toLowerCase().includes(query)
      )
    })
  }

  return servers
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshServers()
  }
})

async function refreshServers(force = false) {
  isLoading.value = true

  try {
    await serverStore.initialize({
      force,
      fetchRemote: true,
    })
  } finally {
    isLoading.value = false
  }
}

function isSelected(id: number) {
  if (props.mode === 'art') return serverStore.activeArtServer?.id === id
  if (props.mode === 'text') return serverStore.activeTextServer?.id === id
  return serverStore.selectedServer?.id === id
}

async function selectServerById(id: number) {
  await serverStore.selectServer(id)

  if (props.mode === 'art') {
    await serverStore.setActiveArtServer(id)
  }

  if (props.mode === 'text') {
    await serverStore.setActiveTextServer(id)
  }
}

function selectServerFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    if (props.mode === 'art') void serverStore.setActiveArtServer(null)
    if (props.mode === 'text') void serverStore.setActiveTextServer(null)
    if (props.mode === 'all') serverStore.deselectServer()
    return
  }

  void selectServerById(id)
}

function startAddingServer() {
  serverStore.startAddingServer({
    serverType: props.mode === 'text' ? 'OPENAI_COMPATIBLE' : 'COMFY',
    category: props.mode === 'text' ? 'text' : 'image',
    endpointPath: props.mode === 'text' ? '/v1/chat/completions' : '/prompt',
    healthPath: props.mode === 'text' ? '/v1/models' : '/system_stats',
    supportsChat: props.mode === 'text',
    supportsTxt2Img: props.mode === 'art',
    supportsImg2Img: props.mode === 'art',
    supportsComfyWorkflow: props.mode === 'art',
    supportsCheckpointOverride: props.mode === 'art',
  })

  showServerForm.value = true
}

async function startEditingServerById(id: number) {
  const server = await serverStore.startEditingServer(id)

  if (!server) return

  showServerForm.value = true
}

function startEditingSelectedServer() {
  const id = serverStore.selectedServer?.id ?? activeServer.value?.id

  if (!id) return

  startEditingServerById(id)
}

function clearSelectedServer() {
  serverStore.deselectServer()
  showServerForm.value = false
}

function closeServerForm() {
  showServerForm.value = false
}

async function handleServerSaved() {
  showServerForm.value = false
  await refreshServers(true)
}

function handleServerDeleted(id: number) {
  if (serverStore.selectedServer?.id === id) {
    serverStore.deselectServer()
  }
}

function handleServerTested() {}

async function setActiveArtServer(id: number) {
  await serverStore.setActiveArtServer(id)
}

async function setActiveTextServer(id: number) {
  await serverStore.setActiveTextServer(id)
}
</script>

<style scoped>
.server-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1rem;
}

.server-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.server-row > * {
  min-width: min(280px, 85vw);
  max-width: 380px;
}
</style>
