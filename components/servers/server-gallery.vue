<!-- /components/server/server-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ resolvedTitle }}
          </h2>

          <p v-if="activeServer" class="truncate text-sm text-base-content/70">
            Selected:
            <span class="font-semibold text-primary">
              {{ activeServerDisplayName(activeServer) }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ resolvedSubtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span v-if="!isLoading" class="badge badge-ghost">
            {{ filteredServers.length }}
          </span>

          <button
            v-if="allowAdd && variant !== 'dropdown'"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="openAddServer"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add Server</span>
          </button>
        </div>
      </div>

      <button
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        @click="showAdvancedCards = !showAdvancedCards"
      >
        <Icon name="kind-icon:settings" class="h-4 w-4" />
        <span class="hidden sm:inline">
          {{ showAdvancedCards ? 'Simple View' : 'Advanced' }}
        </span>
      </button>

      <div
        v-if="shouldShowControls"
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

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search servers"
          placeholder="Search servers..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>
    </header>

    <section
      v-if="showAddServer"
      class="rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeAddServer"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

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

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300"
                :class="selectedIconBgClass"
              >
                <Icon
                  :name="selectedIcon"
                  class="h-6 w-6"
                  :class="selectedIconTextClass"
                />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Server
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ activeServerTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ activeServerSubtitle }}
                </p>

                <div
                  v-if="activeServer"
                  class="mt-2 flex flex-wrap items-center gap-1"
                >
                  <span class="badge badge-primary badge-sm">
                    {{ activeServer.serverType }}
                  </span>

                  <span class="badge badge-secondary badge-sm">
                    {{ activeServer.generationEngine }}
                  </span>

                  <span class="badge badge-accent badge-sm">
                    {{ activeServer.defaultTransport }}
                  </span>

                  <span
                    v-if="activeServer.model"
                    class="badge badge-ghost badge-sm max-w-full truncate"
                  >
                    {{ activeServer.model }}
                  </span>
                </div>
              </div>
            </div>

            <button
              v-if="allowEdit && activeServer"
              class="btn btn-secondary btn-sm rounded-xl"
              type="button"
              @click="startEditingSelectedServer"
            >
              <Icon name="kind-icon:pencil" class="h-4 w-4" />
              <span class="hidden sm:inline">Edit</span>
            </button>
          </div>

          <select
            class="select select-bordered w-full bg-base-100"
            :value="selectedDropdownValue"
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
              {{ serverDropdownLabel(server) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Server</option>
          </select>

          <p
            v-if="filteredServers.length === 0"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
          >
            No configured {{ modeLabel }} servers yet. Add one when you are
            ready to wire up the glorious robot plumbing.
          </p>
        </div>
      </div>

      <div
        v-else-if="filteredServers.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:server" class="h-10 w-10" />

        <p class="text-lg font-bold">No configured servers found.</p>

        <p class="max-w-xl text-sm opacity-70">
          This view only shows servers owned by the current user unless you
          explicitly opt into public or admin visibility.
        </p>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="openAddServer"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Server
        </button>
      </div>

      <div v-else :class="layoutClass">
        <server-card
          v-for="server in filteredServers"
          :key="server.id"
          :server="server"
          :compact="isCompact"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showAdvancedCards && showMeta"
          :show-capabilities="showAdvancedCards && showCapabilities"
          :show-use-buttons="showUseButtons"
          :show-debug="showAdvancedCards && showDebug"
          :show-workflow="showAdvancedCards && showWorkflow"
          :show-defaults="showAdvancedCards && showDefaults"
          :show-status="showStatus"
          :status-compact="statusCompact"
          :allow-edit="allowEdit"
          :allow-delete="showAdvancedCards && allowDelete"
          :allow-test="allowTest"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ServerGalleryMode = 'art' | 'text' | 'all'
type ServerVisibility = 'owned' | 'owned-and-public' | 'all'

const props = withDefaults(
  defineProps<{
    mode?: ServerGalleryMode
    variant?: GalleryVariant
    visibility?: ServerVisibility
    title?: string
    subtitle?: string
    showHeader?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showCapabilities?: boolean
    showUseButtons?: boolean
    showDebug?: boolean
    showWorkflow?: boolean
    showDefaults?: boolean
    showStatus?: boolean
    statusCompact?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowTest?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    mode: 'all',
    variant: 'dashboard',
    visibility: 'owned',
    title: '',
    subtitle: '',
    showHeader: true,
    showControls: false,
    showCardActions: true,
    showDescriptions: true,
    showMeta: false,
    showCapabilities: false,
    showUseButtons: true,
    showDebug: false,
    showWorkflow: false,
    showDefaults: false,
    showStatus: true,
    statusCompact: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: false,
    allowTest: true,
    compact: false,
    autoLoad: true,
  },
)

const serverStore = useServerStore()
const userStore = useUserStore()

const showAdvancedCards = ref(false)

const selectedType = ref<ServerType | 'all'>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showAddServer = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (props.mode === 'art') return 'Art Servers'
  if (props.mode === 'text') return 'Text Servers'
  return 'Servers'
})

const resolvedSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (props.mode === 'art') return 'Your configured image engines.'
  if (props.mode === 'text') return 'Your configured chat engines.'
  return 'Your configured model servers.'
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Server' : 'Add Server'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Update this server config.'
    : 'Create or clone a server config.'
})

const shouldShowControls = computed(() => {
  return props.showControls && props.variant !== 'dropdown'
})

const activeServer = computed(() => {
  if (serverStore.currentServer) return serverStore.currentServer
  if (props.mode === 'art') return serverStore.activeArtServer
  if (props.mode === 'text') return serverStore.activeTextServer
  return serverStore.selectedServer
})

const activeServerTitle = computed(() => {
  const server = activeServer.value

  if (!server) return 'No server selected'

  return activeServerDisplayName(server)
})

const activeServerSubtitle = computed(() => {
  const server = activeServer.value

  if (!server) {
    return 'Choose a configured server or add a new one.'
  }

  const details = [
    server.label,
    server.model,
    server.description,
    server.baseUrl,
    server.browserBaseUrl,
    server.backendBaseUrl,
  ].filter(Boolean)

  return details[0] || 'Server ready.'
})

const selectedDropdownValue = computed(() => {
  return activeServer.value?.id ? String(activeServer.value.id) : ''
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const isCompact = computed(() => {
  return (
    props.compact || props.variant === 'row' || props.variant === 'dropdown'
  )
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'server-row' : 'server-grid'
})

const modeLabel = computed(() => {
  if (props.mode === 'art') return 'art'
  if (props.mode === 'text') return 'text'
  return 'configured'
})

const galleryServers = computed<Server[]>(() => {
  return serverStore.servers.filter((server) => {
    return matchesVisibility(server)
  })
})

const modeServers = computed(() => {
  return galleryServers.value.filter(matchesMode)
})

const filteredServers = computed(() => {
  let servers = [...modeServers.value]

  if (selectedType.value !== 'all') {
    servers = servers.filter((server) => {
      return server.serverType === selectedType.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    servers = servers.filter((server) => {
      return (
        (server.title || '').toLowerCase().includes(query) ||
        (server.label || '').toLowerCase().includes(query) ||
        (server.description || '').toLowerCase().includes(query) ||
        (server.baseUrl || '').toLowerCase().includes(query) ||
        (server.browserBaseUrl || '').toLowerCase().includes(query) ||
        (server.backendBaseUrl || '').toLowerCase().includes(query) ||
        (server.category || '').toLowerCase().includes(query) ||
        (server.serverType || '').toLowerCase().includes(query) ||
        (server.generationEngine || '').toLowerCase().includes(query) ||
        (server.model || '').toLowerCase().includes(query) ||
        (server.designer || '').toLowerCase().includes(query)
      )
    })
  }

  return servers.sort(sortServers)
})

const selectedIcon = computed(() => {
  const server = activeServer.value

  if (!server) return 'kind-icon:server'
  if (server.generationEngine === 'KONTEXT') return 'kind-icon:wand'
  if (server.generationEngine === 'FLUX') return 'kind-icon:sparkles'
  if (server.generationEngine === 'COMFY') return 'kind-icon:workflow'
  if (server.generationEngine === 'A1111') return 'kind-icon:palette'
  if (server.generationEngine === 'OPENAI_IMAGE') return 'kind-icon:image'
  if (server.serverType === 'TEXT') return 'kind-icon:chat'
  if (server.serverType === 'OPENAI_COMPATIBLE') return 'kind-icon:chat'
  if (server.serverType === 'COMFY') return 'kind-icon:workflow'
  if (server.serverType === 'A1111') return 'kind-icon:palette'
  if (server.serverType === 'ART') return 'kind-icon:palette'

  return 'kind-icon:server'
})

const selectedIconBgClass = computed(() => {
  const server = activeServer.value

  if (!server) return 'bg-base-200'

  if (isTextCapable(server) && !isArtCapable(server)) {
    return 'bg-secondary/10'
  }

  if (isArtCapable(server) && !isTextCapable(server)) {
    return 'bg-primary/10'
  }

  return 'bg-accent/10'
})

const selectedIconTextClass = computed(() => {
  const server = activeServer.value

  if (!server) return 'text-base-content/50'

  if (isTextCapable(server) && !isArtCapable(server)) {
    return 'text-secondary'
  }

  if (isArtCapable(server) && !isTextCapable(server)) {
    return 'text-primary'
  }

  return 'text-accent'
})

const dropdownPlaceholder = computed(() => {
  if (props.mode === 'art') return 'Choose an art server'
  if (props.mode === 'text') return 'Choose a text server'
  return 'Choose a server'
})

onMounted(async () => {
  applyCurrentServerMode()

  // kind-loader owns server initialization. Only fetch here if running
  // in a context where kind-loader hasn't already loaded servers.
  if (props.autoLoad && !serverStore.hasLoaded) {
    await refreshServers()
  }
})

watch(
  () => props.mode,
  () => {
    applyCurrentServerMode()
  },
)

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

function isOwnedByCurrentUser(server: Server) {
  return Boolean(currentUserId.value && server.userId === currentUserId.value)
}

function matchesVisibility(server: Server) {
  if (props.visibility === 'all') {
    return userStore.isAdmin || isOwnedByCurrentUser(server)
  }

  if (props.visibility === 'owned-and-public') {
    return isOwnedByCurrentUser(server) || Boolean(server.isPublic)
  }

  return isOwnedByCurrentUser(server)
}

function isArtCapable(server: Server) {
  return (
    server.serverType === 'ART' ||
    server.serverType === 'A1111' ||
    server.serverType === 'COMFY' ||
    server.generationEngine === 'A1111' ||
    server.generationEngine === 'COMFY' ||
    server.generationEngine === 'FLUX' ||
    server.generationEngine === 'KONTEXT' ||
    server.generationEngine === 'OPENAI_IMAGE' ||
    Boolean(server.supportsTxt2Img) ||
    Boolean(server.supportsImg2Img) ||
    Boolean(server.supportsImageEdit) ||
    Boolean(server.supportsComfyWorkflow) ||
    Boolean(server.supportsFlux) ||
    Boolean(server.supportsKontext)
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

function activeServerDisplayName(server: Server) {
  if (server.title && server.label && server.title !== server.label) {
    return `${server.title} · ${server.label}`
  }

  return server.title || server.label || `Server ${server.id}`
}

function serverDropdownLabel(server: Server) {
  const name = activeServerDisplayName(server)

  const details = [
    server.serverType,
    server.generationEngine,
    server.model,
    server.defaultTransport,
  ].filter(Boolean)

  return `${name} (${details.join(' · ')})`
}

function sortServers(left: Server, right: Server) {
  const leftOrder = left.sortOrder ?? 0
  const rightOrder = right.sortOrder ?? 0

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  const leftName = activeServerDisplayName(left).toLowerCase()
  const rightName = activeServerDisplayName(right).toLowerCase()

  return leftName.localeCompare(rightName)
}

function applyCurrentServerMode() {
  if (props.mode === 'art') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (props.mode === 'text') {
    serverStore.setCurrentServerMode('text')
    return
  }

  serverStore.setCurrentServerMode('selected')
}

async function selectServerById(id: number) {
  serverStore.setCurrentServer(id)

  if (props.mode === 'art') {
    await serverStore.setActiveArtServer(id)
  }

  if (props.mode === 'text') {
    await serverStore.setActiveTextServer(id)
  }
}

function selectServerFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    openAddServer()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedServer()
    return
  }

  void selectServerById(id)
}

function clearSelectedServer() {
  if (props.mode === 'art') {
    void serverStore.setActiveArtServer(null)
  }

  if (props.mode === 'text') {
    void serverStore.setActiveTextServer(null)
  }

  serverStore.deselectServer()
}

function openAddServer() {
  formMode.value = 'add'
  showAddServer.value = true
  serverStore.deselectServer()
  serverStore.openServerForm()
}

async function startEditingSelectedServer() {
  const id = activeServer.value?.id

  if (!id) return

  formMode.value = 'edit'
  serverStore.setCurrentServer(id)

  const server = await serverStore.startEditingServer(id)

  if (!server) return

  showAddServer.value = true
  serverStore.openServerForm()
}

function closeAddServer() {
  showAddServer.value = false
  serverStore.closeServerForm()
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
