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

          <p
            v-if="activeServer && !resolvedUseDefault"
            class="truncate text-sm text-base-content/70"
          >
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
          <span
            v-if="!isLoading && !resolvedUseDefault"
            class="badge badge-ghost"
          >
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

      <label
        v-if="showUseDefaultToggle"
        class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
      >
        <span class="label-text font-bold"> Use Kind Robots default </span>

        <input
          :checked="resolvedUseDefault"
          type="checkbox"
          class="toggle toggle-primary toggle-sm"
          @change="toggleUseDefault"
        />
      </label>

      <div
        v-if="showFamilySelect && !resolvedUseDefault"
        class="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="form-control min-w-0">
          <span class="label py-1">
            <span
              class="label-text text-xs font-bold uppercase text-base-content/50"
            >
              {{ familyLabel }}
            </span>
          </span>

          <select
            v-model="selectedFamilyValue"
            class="select select-bordered select-sm w-full rounded-xl bg-base-100"
          >
            <option
              v-for="family in familyOptions"
              :key="family.value"
              :value="family.value"
            >
              {{ family.label }}
            </option>
          </select>
        </label>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm self-end rounded-xl"
          type="button"
          @click="openAddServer"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Server
        </button>
      </div>

      <button
        v-if="showAdvancedToggle && !resolvedUseDefault"
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
        v-if="shouldShowControls && !resolvedUseDefault"
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
            Add {{ modeLabel }} server
          </h3>

          <p class="text-sm text-base-content/60">
            Start from a matching public blueprint, then save your own private
            copy.
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

      <div
        v-if="blueprintServers.length"
        class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="form-control min-w-0">
          <span class="label py-1">
            <span
              class="label-text text-xs font-bold uppercase text-base-content/50"
            >
              Server blueprint
            </span>
          </span>

          <select
            v-model="selectedBlueprintId"
            class="select select-bordered w-full rounded-xl bg-base-200"
          >
            <option value="">Start from blank {{ modeLabel }} server</option>

            <option
              v-for="server in blueprintServers"
              :key="server.id"
              :value="server.id"
            >
              {{ activeServerDisplayName(server) }}
            </option>
          </select>
        </label>

        <button
          class="btn btn-secondary self-end rounded-xl"
          type="button"
          @click="applySelectedBlueprint"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Use Blueprint
        </button>
      </div>

      <div
        v-else
        class="mb-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
      >
        No public {{ modeLabel }} blueprints match this family. Starting from a
        blank server.
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

      <div
        v-else-if="resolvedUseDefault"
        class="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-6 text-center"
      >
        <Icon :name="defaultIcon" class="h-12 w-12 text-primary" />

        <p class="text-2xl font-black text-primary">
          Using Kind Robots default
        </p>

        <p class="max-w-md text-sm text-base-content/65">
          No custom {{ modeLabel }} server is selected. Toggle this off when you
          want to use one of your configured servers.
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
              {{ activeServerDisplayName(server) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Server</option>
          </select>

          <p
            v-if="filteredServers.length === 0"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
          >
            No configured {{ modeLabel }} servers yet. Use Add Server to make
            your own copy from a blueprint.
          </p>
        </div>
      </div>

      <div
        v-else-if="filteredServers.length === 0"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:server" class="h-10 w-10" />

        <p class="text-lg font-bold">
          No configured {{ modeLabel }} servers found.
        </p>

        <p class="max-w-xl text-sm opacity-70">
          This view only shows your configured servers. Blueprints stay hidden
          until you click Add Server.
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

type ArtFamily =
  | 'sd'
  | 'comfy-sdxl'
  | 'comfy-flux'
  | 'kontext'
  | 'kombine'
  | 'openai-art'
  | 'invoke'

type TextFamily = 'anthropic' | 'openai' | 'ollama'

type FamilyValue = ArtFamily | TextFamily | 'all'

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
    selectedFamily: 'all',
    useDefault: null,
    showHeader: true,
    showControls: false,
    showFamilySelect: true,
    showUseDefaultToggle: true,
    showAdvancedToggle: true,
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

const emit = defineEmits<{
  'update:useDefault': [value: boolean]
  'update:selectedFamily': [value: FamilyValue]
}>()

const serverStore = useServerStore()
const userStore = useUserStore()

const showAdvancedCards = ref(false)
const selectedType = ref<ServerType | 'all'>('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showAddServer = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const localUseDefault = ref(true)
const localSelectedFamily = ref<FamilyValue>('all')
const selectedBlueprintId = ref('')

const artFamilies: { value: ArtFamily; label: string }[] = [
  { value: 'sd', label: 'SD' },
  { value: 'comfy-sdxl', label: 'Comfy-SDXL' },
  { value: 'comfy-flux', label: 'Comfy-Flux' },
  { value: 'kontext', label: 'Kontext' },
  { value: 'kombine', label: 'Kombine' },
  { value: 'openai-art', label: 'OpenAI Art' },
  { value: 'invoke', label: 'Invoke' },
]

const textFamilies: { value: TextFamily; label: string }[] = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'ollama', label: 'Ollama' },
]

const familyOptions = computed(() => {
  if (props.mode === 'art') return artFamilies
  if (props.mode === 'text') return textFamilies
  return [{ value: 'all' as const, label: 'All' }]
})

const selectedFamilyValue = computed({
  get: () => {
    if (props.selectedFamily && props.selectedFamily !== 'all') {
      return props.selectedFamily
    }

    return localSelectedFamily.value
  },
  set: (value: FamilyValue) => {
    localSelectedFamily.value = value
    emit('update:selectedFamily', value)
  },
})

const resolvedUseDefault = computed({
  get: () => {
    if (typeof props.useDefault === 'boolean') return props.useDefault
    return localUseDefault.value
  },
  set: (value: boolean) => {
    localUseDefault.value = value
    emit('update:useDefault', value)
  },
})

const resolvedTitle = computed(() => {
  if (props.title) return props.title
  if (props.mode === 'art') return 'Art Servers'
  if (props.mode === 'text') return 'Text Servers'
  return 'Servers'
})

const resolvedSubtitle = computed(() => {
  if (resolvedUseDefault.value) return 'Using the Kind Robots default.'
  if (props.subtitle) return props.subtitle
  if (props.mode === 'art') return 'Your configured image engines.'
  if (props.mode === 'text') return 'Your configured chat engines.'
  return 'Your configured model servers.'
})

const shouldShowControls = computed(() => {
  return props.showControls && props.variant !== 'dropdown'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const rawActiveServer = computed(() => {
  if (props.mode === 'art') return serverStore.activeArtServer
  if (props.mode === 'text') return serverStore.activeTextServer
  return serverStore.selectedServer
})

const activeServer = computed(() => {
  if (resolvedUseDefault.value) return null

  const server = rawActiveServer.value

  if (!server) return null
  if (!isConfiguredUserServer(server)) return null
  if (!matchesMode(server)) return null
  if (!matchesSelectedFamily(server)) return null
  if (isBackendServer(server)) return null

  return server
})

const activeServerTitle = computed(() => {
  if (!activeServer.value) return `No custom ${modeLabel.value} server selected`

  return activeServerDisplayName(activeServer.value)
})

const activeServerSubtitle = computed(() => {
  if (!activeServer.value) {
    return 'Choose one of your configured servers or add a new one.'
  }

  return 'Custom server selected.'
})

const selectedDropdownValue = computed(() => {
  return activeServer.value?.id ? String(activeServer.value.id) : ''
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

const familyLabel = computed(() => {
  if (props.mode === 'art') return 'Art family'
  if (props.mode === 'text') return 'Text family'
  return 'Server family'
})

const configuredServers = computed<Server[]>(() => {
  return serverStore.servers
    .filter(isConfiguredUserServer)
    .filter(matchesMode)
    .filter(matchesSelectedFamily)
    .filter((server) => !isBackendServer(server))
    .sort(sortServers)
})

const blueprintServers = computed<Server[]>(() => {
  return serverStore.servers
    .filter(isBlueprintServer)
    .filter(matchesMode)
    .filter(matchesSelectedFamily)
    .filter((server) => !isBackendServer(server))
    .sort(sortServers)
})

const filteredServers = computed(() => {
  let servers = [...configuredServers.value]

  if (selectedType.value !== 'all') {
    servers = servers.filter((server) => {
      return server.serverType === selectedType.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    servers = servers.filter((server) => {
      return serverHaystack(server).includes(query)
    })
  }

  return servers.sort(sortServers)
})

const selectedIcon = computed(() => {
  if (props.mode === 'text') return 'kind-icon:chat'
  if (props.mode === 'art') return 'kind-icon:palette'
  return 'kind-icon:server'
})

const defaultIcon = computed(() => {
  if (props.mode === 'text') return 'kind-icon:chat'
  if (props.mode === 'art') return 'kind-icon:palette'
  return 'kind-icon:server'
})

const selectedIconBgClass = computed(() => {
  if (props.mode === 'text') return 'bg-secondary/10'
  if (props.mode === 'art') return 'bg-primary/10'
  return 'bg-accent/10'
})

const selectedIconTextClass = computed(() => {
  if (props.mode === 'text') return 'text-secondary'
  if (props.mode === 'art') return 'text-primary'
  return 'text-accent'
})

const dropdownPlaceholder = computed(() => {
  if (props.mode === 'art') return 'Choose your art server'
  if (props.mode === 'text') return 'Choose your text server'
  return 'Choose your server'
})

onMounted(async () => {
  applyCurrentServerMode()
  initializeFamily()
  initializeDefaultState()

  if (props.autoLoad && !serverStore.hasLoaded) {
    await refreshServers()
    initializeDefaultState()
  }
})

watch(
  () => props.mode,
  () => {
    applyCurrentServerMode()
    initializeFamily()
    initializeDefaultState()
  },
)

watch(
  () => rawActiveServer.value?.id,
  () => {
    initializeDefaultState()
  },
)

function initializeFamily() {
  if (props.selectedFamily && props.selectedFamily !== 'all') {
    localSelectedFamily.value = props.selectedFamily
    return
  }

  if (props.mode === 'art') {
    localSelectedFamily.value = 'sd'
    return
  }

  if (props.mode === 'text') {
    localSelectedFamily.value = 'anthropic'
    return
  }

  localSelectedFamily.value = 'all'
}

function initializeDefaultState() {
  if (typeof props.useDefault === 'boolean') {
    localUseDefault.value = props.useDefault
    return
  }

  localUseDefault.value =
    !rawActiveServer.value || !isConfiguredUserServer(rawActiveServer.value)
  emit('update:useDefault', localUseDefault.value)
}

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

function isConfiguredUserServer(server: Server) {
  if (!server.isActive) return false
  if (serverStore.isServerHidden(server.id)) return false
  if (!isOwnedByCurrentUser(server)) return false
  if (server.isDefault) return false
  if (server.isOfficial) return false
  if (isBackendServer(server)) return false

  return true
}

function isBlueprintServer(server: Server) {
  if (!server.isActive) return false
  if (serverStore.isServerHidden(server.id)) return false
  if (
    isOwnedByCurrentUser(server) &&
    !server.isPublic &&
    !server.isOfficial &&
    !server.isDefault
  )
    return false
  if (!server.isPublic && !server.isOfficial && !server.isDefault) return false
  if (
    server.isPrivateNetwork &&
    !server.isPublic &&
    !server.isOfficial &&
    !server.isDefault
  )
    return false
  if (isBackendServer(server)) return false

  return true
}

function isBackendServer(server: Server) {
  const values = [
    server.title,
    server.label,
    server.category,
    server.serverType,
    server.generationEngine,
    server.defaultTransport,
    server.accessMode,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())

  return values.some(
    (value) => value === 'backend' || value.includes('backend'),
  )
}

function isArtCapable(server: Server) {
  if (isBackendServer(server)) return false

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
  if (isBackendServer(server)) return false

  return (
    (server.serverType === 'TEXT' ||
      server.serverType === 'OPENAI_COMPATIBLE') &&
    Boolean(server.supportsChat !== false)
  )
}

function matchesMode(server: Server) {
  if (props.mode === 'art') return isArtCapable(server)
  if (props.mode === 'text') return isTextCapable(server)

  return isArtCapable(server) || isTextCapable(server)
}

function matchesSelectedFamily(server: Server) {
  if (selectedFamilyValue.value === 'all') return true

  if (props.mode === 'art') {
    return matchesArtFamily(server, selectedFamilyValue.value as ArtFamily)
  }

  if (props.mode === 'text') {
    return matchesTextFamily(server, selectedFamilyValue.value as TextFamily)
  }

  return true
}

function matchesArtFamily(server: Server, family: ArtFamily) {
  const haystack = serverHaystack(server)

  if (family === 'sd') {
    return (
      server.serverType === 'A1111' ||
      server.generationEngine === 'A1111' ||
      haystack.includes('stable diffusion') ||
      haystack.includes(' sd ')
    )
  }

  if (family === 'comfy-sdxl') {
    return (
      isComfyServer(server) &&
      (haystack.includes('sdxl') || haystack.includes('xl'))
    )
  }

  if (family === 'comfy-flux') {
    return (
      isComfyServer(server) &&
      (server.generationEngine === 'FLUX' ||
        Boolean(server.supportsFlux) ||
        haystack.includes('flux'))
    )
  }

  if (family === 'kontext') {
    return (
      server.generationEngine === 'KONTEXT' ||
      Boolean(server.supportsKontext) ||
      haystack.includes('kontext')
    )
  }

  if (family === 'kombine') return haystack.includes('kombine')

  if (family === 'openai-art') {
    return (
      server.generationEngine === 'OPENAI_IMAGE' ||
      haystack.includes('openai') ||
      haystack.includes('dall')
    )
  }

  if (family === 'invoke') return haystack.includes('invoke')

  return true
}

function matchesTextFamily(server: Server, family: TextFamily) {
  const haystack = serverHaystack(server)

  if (family === 'anthropic') {
    return haystack.includes('anthropic') || haystack.includes('claude')
  }

  if (family === 'openai') {
    return haystack.includes('openai') || haystack.includes('gpt')
  }

  if (family === 'ollama') {
    return haystack.includes('ollama')
  }

  return true
}

function isComfyServer(server: Server) {
  return (
    server.serverType === 'COMFY' ||
    server.generationEngine === 'COMFY' ||
    Boolean(server.supportsComfyWorkflow)
  )
}

function serverHaystack(server: Server) {
  return [
    server.title,
    server.label,
    server.description,
    server.category,
    server.serverType,
    server.generationEngine,
    server.model,
    server.designer,
    server.baseUrl,
    server.browserBaseUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function activeServerDisplayName(server: Server) {
  return server.title || server.label || `Server ${server.id}`
}

function sortServers(left: Server, right: Server) {
  const leftOrder = left.sortOrder ?? 0
  const rightOrder = right.sortOrder ?? 0

  if (leftOrder !== rightOrder) return leftOrder - rightOrder

  return activeServerDisplayName(left)
    .toLowerCase()
    .localeCompare(activeServerDisplayName(right).toLowerCase())
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
  const server = serverStore.getServerById(id)

  if (!server || !isConfiguredUserServer(server) || !matchesMode(server)) return

  resolvedUseDefault.value = false
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

function toggleUseDefault(event: Event) {
  const target = event.target as HTMLInputElement
  const checked = Boolean(target.checked)

  resolvedUseDefault.value = checked

  if (checked) {
    clearSelectedServer()
  }
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
  resolvedUseDefault.value = false
  selectedBlueprintId.value = ''

  const type = defaultServerTypeForMode()
  serverStore.createNewServer(type)
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
  selectedBlueprintId.value = ''
  serverStore.closeServerForm()
}

function applySelectedBlueprint() {
  const id = Number(selectedBlueprintId.value)

  if (!Number.isInteger(id) || id <= 0) {
    serverStore.createNewServer(defaultServerTypeForMode())
    return
  }

  serverStore.setBlueprintServer(id)
}

function defaultServerTypeForMode(): ServerType {
  if (props.mode === 'text') return 'TEXT'
  if (props.mode === 'art') {
    if (selectedFamilyValue.value === 'comfy-sdxl') return 'COMFY'
    if (selectedFamilyValue.value === 'comfy-flux') return 'COMFY'
    return 'ART'
  }

  return 'ART'
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
