<!-- /components/server/server-gallery.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ resolvedTitle }}
          </h2>

          <p v-if="activeServer" class="truncate text-sm text-base-content/70">
            Active:
            <span class="font-semibold text-primary">
              {{ activeServer.label || activeServer.title }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ resolvedSubtitle }}
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
          <option value="owned">Mine</option>
          <option value="visible">Visible active</option>
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
          :disabled="!editableServerId"
          @click="startEditingSelectedServer"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!serverStore.selectedServer && !activeServer"
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
      v-if="serverStore.isServerFormOpen"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <add-server />
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
        <p class="text-lg font-bold">No private servers found.</p>
        <p class="max-w-xl text-sm opacity-70">
          Click Add to choose an official, public, default, or existing server
          as a blueprint for your private copy.
        </p>

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

          <template v-if="mode === 'all'">
            <optgroup v-if="artDisplayServers.length" label="Art Modelers">
              <option
                v-for="server in artDisplayServers"
                :key="`art-${server.id}`"
                :value="server.id"
              >
                [{{ server.serverType }}] {{ server.label || server.title }}
              </option>
            </optgroup>

            <optgroup v-if="textDisplayServers.length" label="Text Modelers">
              <option
                v-for="server in textDisplayServers"
                :key="`text-${server.id}`"
                :value="server.id"
              >
                [{{ server.serverType }}] {{ server.label || server.title }}
              </option>
            </optgroup>
          </template>

          <template v-else>
            <option
              v-for="server in filteredServers"
              :key="server.id"
              :value="server.id"
            >
              [{{ server.serverType }}] {{ server.label || server.title }}
            </option>
          </template>
        </select>
      </div>

      <div v-else-if="mode === 'all'" class="flex flex-col gap-4">
        <section
          v-if="artDisplayServers.length"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <Icon name="kind-icon:image" class="h-5 w-5 text-primary" />
              <div class="min-w-0">
                <h3 class="truncate text-base font-black">Art Modelers</h3>
                <p class="text-xs opacity-60">
                  Image engines, Comfy workflows, A1111, and visual chaos
                  factories.
                </p>
              </div>
            </div>

            <span class="badge badge-primary badge-sm shrink-0">
              {{ artDisplayServers.length }}
            </span>
          </div>

          <div :class="layoutClass">
            <server-card
              v-for="server in artDisplayServers"
              :key="`art-card-${server.id}`"
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

        <section
          v-if="textDisplayServers.length"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <Icon name="kind-icon:circle" class="h-5 w-5 text-secondary" />
              <div class="min-w-0">
                <h3 class="truncate text-base font-black">Text Modelers</h3>
                <p class="text-xs opacity-60">
                  Chat engines, OpenAI-compatible APIs, and suspiciously
                  eloquent machines.
                </p>
              </div>
            </div>

            <span class="badge badge-secondary badge-sm shrink-0">
              {{ textDisplayServers.length }}
            </span>
          </div>

          <div :class="layoutClass">
            <server-card
              v-for="server in textDisplayServers"
              :key="`text-card-${server.id}`"
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
    title: '',
    subtitle: '',
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
const selectedScope = ref<ServerScope>('owned')
const searchQuery = ref('')
const isLoading = ref(false)

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (props.mode === 'art') return 'My Art Servers'
  if (props.mode === 'text') return 'My Text Servers'
  return 'My Servers'
})

const resolvedSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (props.mode === 'art') return 'Your private image engines.'
  if (props.mode === 'text') return 'Your private chat engines.'
  return 'Your private server configs. Click Add to clone from a blueprint.'
})

const activeServer = computed(() => {
  if (props.mode === 'art') return serverStore.activeArtServer
  if (props.mode === 'text') return serverStore.activeTextServer
  return serverStore.selectedServer
})

const editableServerId = computed(() => {
  return serverStore.selectedServer?.id ?? activeServer.value?.id ?? null
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

const ownedServersForMode = computed(() => {
  return serverStore.servers.filter((server) => {
    if (server.userId !== userStore.user?.id) return false
    return matchesMode(server)
  })
})

const visibleServersForMode = computed(() => {
  const servers =
    props.mode === 'art'
      ? serverStore.artServers
      : props.mode === 'text'
        ? serverStore.textServers
        : serverStore.visibleActiveServers

  return servers.filter(matchesMode)
})

const baseServers = computed<Server[]>(() => {
  if (selectedScope.value === 'owned') return ownedServersForMode.value

  if (selectedScope.value === 'official') {
    return serverStore.officialServers.filter(matchesMode)
  }

  if (selectedScope.value === 'public') {
    return serverStore.publicServers.filter(matchesMode)
  }

  if (selectedScope.value === 'hidden') {
    return serverStore.hiddenServers.filter(matchesMode)
  }

  if (selectedScope.value === 'all') {
    return serverStore.servers.filter(matchesMode)
  }

  return visibleServersForMode.value
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

const artDisplayServers = computed(() => {
  return filteredServers.value.filter(isArtCapable)
})

const textDisplayServers = computed(() => {
  return filteredServers.value.filter((server) => {
    return isTextCapable(server) && !isArtCapable(server)
  })
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshServers(true)
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

function isArtCapable(server: Server) {
  return (
    server.serverType === 'ART' ||
    server.serverType === 'A1111' ||
    server.serverType === 'COMFY' ||
    Boolean(server.supportsTxt2Img) ||
    Boolean(server.supportsImg2Img) ||
    Boolean(server.supportsComfyWorkflow)
  )
}

function isTextCapable(server: Server) {
  return (
    server.serverType === 'TEXT' ||
    server.serverType === 'OPENAI_COMPATIBLE' ||
    Boolean(server.supportsChat)
  )
}

function matchesMode(server: Server) {
  if (props.mode === 'art') return isArtCapable(server)
  if (props.mode === 'text') return isTextCapable(server)
  return isArtCapable(server) || isTextCapable(server)
}

function isSelected(id: number) {
  if (props.mode === 'art') return serverStore.activeArtServer?.id === id
  if (props.mode === 'text') return serverStore.activeTextServer?.id === id

  return (
    serverStore.selectedServer?.id === id ||
    serverStore.activeArtServer?.id === id ||
    serverStore.activeTextServer?.id === id
  )
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

function resolveNewServerMode(): 'art' | 'text' {
  if (props.mode === 'art' || props.mode === 'text') return props.mode

  if (
    selectedType.value === 'TEXT' ||
    selectedType.value === 'OPENAI_COMPATIBLE'
  ) {
    return 'text'
  }

  return 'art'
}

function startAddingServer() {
  const mode = resolveNewServerMode()
  const isTextMode = mode === 'text'
  const title = isTextMode ? 'New Text Server' : 'New Art Server'
  const serverType = isTextMode ? 'OPENAI_COMPATIBLE' : 'COMFY'

  serverStore.startAddingServer({
    title,
    label: title,
    serverType,
    category: isTextMode ? 'text' : 'image',
    endpointPath: isTextMode ? '/v1/chat/completions' : '/prompt',
    healthPath: isTextMode ? '/v1/models' : '/system_stats',
    accessMode: isTextMode ? 'PUBLIC_API_KEY' : 'TAILSCALE',
    isPrivateNetwork: !isTextMode,
    requiresClientSideCheck: !isTextMode,
    allowBrowserRequests: !isTextMode,
    supportsChat: isTextMode,
    supportsTxt2Img: !isTextMode,
    supportsImg2Img: !isTextMode,
    supportsComfyWorkflow: !isTextMode,
    supportsCheckpointOverride: !isTextMode,
    supportsSeed: !isTextMode,
    supportsSteps: !isTextMode,
  })

  serverStore.selectedBlueprintServerId = null
  serverStore.openServerForm()
}

async function startEditingServerById(id: number) {
  const server = await serverStore.startEditingServer(id)

  if (!server) return

  serverStore.selectedBlueprintServerId = null
  serverStore.openServerForm()
}

function startEditingSelectedServer() {
  if (!editableServerId.value) return

  void startEditingServerById(editableServerId.value)
}

function clearSelectedServer() {
  if (props.mode === 'art') {
    void serverStore.setActiveArtServer(null)
  }

  if (props.mode === 'text') {
    void serverStore.setActiveTextServer(null)
  }

  serverStore.deselectServer()
  serverStore.closeServerForm()
}

function handleServerDeleted(id: number) {
  if (serverStore.selectedServer?.id === id) {
    serverStore.deselectServer()
  }

  if (serverStore.activeArtServer?.id === id) {
    void serverStore.setActiveArtServer(null)
  }

  if (serverStore.activeTextServer?.id === id) {
    void serverStore.setActiveTextServer(null)
  }
}

function handleServerTested() {}

async function setActiveArtServer(id: number) {
  await serverStore.setActiveArtServer(id)
  await serverStore.selectServer(id)
}

async function setActiveTextServer(id: number) {
  await serverStore.setActiveTextServer(id)
  await serverStore.selectServer(id)
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
