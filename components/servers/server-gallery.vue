<!-- /components/server/server-gallery.vue -->
<template>
  <section class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header v-if="showHeader" class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ resolvedTitle }}
          </h2>
          <p class="text-sm text-base-content/60">
            {{ resolvedSubtitle }}
          </p>
        </div>

        <button
          v-if="showCardActions"
          class="btn btn-sm btn-primary rounded-xl"
          type="button"
          @click="startAddServer"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Server
        </button>
      </div>

      <div v-if="showControls" class="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <input
          v-model="searchQuery"
          class="input input-bordered rounded-xl"
          placeholder="Filter servers"
        />

        <select v-model="selectedType" class="select select-bordered rounded-xl">
          <option value="all">All types</option>
          <option value="A1111">A1111</option>
          <option value="COMFY">COMFY</option>
          <option value="OPENAI">OPENAI</option>
          <option value="ANTHROPIC">ANTHROPIC</option>
          <option value="CUSTOM">CUSTOM</option>
        </select>

        <button class="btn rounded-xl" type="button" @click="refreshServers">
          <Icon name="kind-icon:refresh-cw" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <add-server v-if="showAddServer" />

    <div v-if="serverStore.loading || isLoading" class="flex justify-center rounded-2xl bg-base-200 p-6">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="filteredServers.length" class="grid gap-3" :class="gridClass">
      <server-card
        v-for="server in filteredServers"
        :key="server.id"
        :server="server"
        :compact="variant === 'row' || variant === 'dropdown'"
        :show-description="showDescriptions"
        :show-meta="showMeta"
        :show-use-buttons="showUseButtons"
        :show-actions="showCardActions"
        :allow-edit="showCardActions"
        :allow-test="showCardActions"
      />
    </div>

    <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center">
      <Icon name="kind-icon:server-off" class="mx-auto mb-2 h-8 w-8 text-base-content/40" />
      <p class="font-bold">No matching servers.</p>
      <p class="text-sm text-base-content/60">
        Add a configured A1111, Comfy, OpenAI, Anthropic, or Custom endpoint.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'
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
  return props.title || (props.mode === 'art' ? 'Art Servers' : props.mode === 'text' ? 'Text Servers' : 'Servers')
})

const resolvedSubtitle = computed(() => {
  return props.subtitle || 'Configured access points only. Route behavior lives in endpoints now.'
})

const gridClass = computed(() => {
  if (props.variant === 'row' || props.variant === 'dropdown') return 'grid-cols-1'
  return 'md:grid-cols-2 xl:grid-cols-3'
})

const serversByMode = computed<Server[]>(() => {
  const servers = Array.isArray(serverStore.servers) ? serverStore.servers : []

  if (props.mode === 'art') {
    return servers.filter((server) => server.serverType === 'A1111' || server.serverType === 'COMFY')
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
    if (selectedType.value !== 'all' && server.serverType !== selectedType.value) return false

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
