<!-- /components/servers/server-selector.vue -->
<template>
  <div class="relative">
    <button
      class="btn btn-sm btn-ghost rounded-xl border border-base-300 bg-base-100"
      type="button"
      title="Server defaults"
      @click="openSelector"
    >
      <Icon name="kind-icon:server" class="h-4 w-4" />
    </button>

    <dialog ref="selectorDialog" class="modal">
      <div
        class="modal-box flex max-h-[90vh] w-11/12 max-w-5xl flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <header class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-primary">Server Selector</h2>
            <p class="text-sm text-base-content/60">
              Choose a configured access point, add a provider key, or register
              a local endpoint.
            </p>
          </div>

          <button
            class="btn btn-sm btn-ghost rounded-xl"
            type="button"
            @click="closeSelector"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </header>

        <div
          v-if="statusMessage"
          class="rounded-2xl border p-3 text-sm font-bold"
          :class="
            statusTone === 'success'
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-error/40 bg-error/10 text-error'
          "
        >
          {{ statusMessage }}
        </div>

        <div class="grid min-h-0 gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
          <section class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h3 class="mb-2 font-black text-primary">Art</h3>

              <select
                v-model.number="selectedArtServerId"
                class="select select-bordered w-full rounded-xl"
              >
                <option :value="null">Use system / mana route</option>
                <option
                  v-for="server in artServers"
                  :key="server.id"
                  :value="server.id"
                >
                  {{ server.label || server.title }} · {{ server.serverType }}
                </option>
              </select>

              <button
                class="btn btn-primary mt-3 w-full rounded-xl"
                type="button"
                @click="applyArtServer"
              >
                Save Art Server
              </button>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h3 class="mb-2 font-black text-secondary">Text</h3>

              <select
                v-model.number="selectedTextServerId"
                class="select select-bordered w-full rounded-xl"
              >
                <option :value="null">Use system / mana route</option>
                <option
                  v-for="server in textServers"
                  :key="server.id"
                  :value="server.id"
                >
                  {{ server.label || server.title }} · {{ server.serverType }}
                </option>
              </select>

              <button
                class="btn btn-secondary mt-3 w-full rounded-xl"
                type="button"
                @click="applyTextServer"
              >
                Save Text Server
              </button>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h3 class="mb-2 font-black text-accent">Configured Servers</h3>

              <div
                v-if="configuredServers.length"
                class="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1"
              >
                <button
                  v-for="server in configuredServers"
                  :key="server.id"
                  class="flex w-full items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-base-300"
                  type="button"
                  @click="serverStore.setCurrentServer?.(server.id)"
                >
                  <span class="min-w-0">
                    <span class="block truncate font-black">
                      {{ server.label || server.title || `Server ${server.id}` }}
                    </span>
                    <span class="block truncate text-xs opacity-60">
                      {{ server.serverType }}
                      <span v-if="server.category"> · {{ server.category }}</span>
                      <span v-if="server.url || server.serverUrl">
                        · {{ server.url || server.serverUrl }}
                      </span>
                    </span>
                  </span>

                  <span
                    class="badge shrink-0"
                    :class="server.isActive ? 'badge-success' : 'badge-ghost'"
                  >
                    {{ server.isActive ? 'active' : 'inactive' }}
                  </span>
                </button>
              </div>

              <p v-else class="text-sm text-base-content/60">
                No servers are loaded yet. That is deeply rude of them.
              </p>
            </div>
          </section>

          <section class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h3 class="font-black text-primary">Add Provider Key</h3>
              <p class="mb-3 text-sm text-base-content/60">
                OpenAI creates separate text and image server entries.
                Anthropic creates one text server entry.
              </p>

              <label class="form-control">
                <span class="label-text font-bold">Provider</span>
                <select
                  v-model="providerForm.provider"
                  class="select select-bordered rounded-xl"
                >
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic</option>
                </select>
              </label>

              <label class="form-control mt-2">
                <span class="label-text font-bold">Label</span>
                <input
                  v-model.trim="providerForm.label"
                  class="input input-bordered rounded-xl"
                  type="text"
                  placeholder="My OpenAI Key"
                />
              </label>

              <label class="form-control mt-2">
                <span class="label-text font-bold">API Key</span>
                <input
                  v-model.trim="providerForm.apiKey"
                  class="input input-bordered rounded-xl"
                  type="password"
                  placeholder="sk-..."
                />
              </label>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <label class="form-control">
                  <span class="label-text font-bold">Text Model</span>
                  <input
                    v-model.trim="providerForm.textModel"
                    class="input input-bordered rounded-xl"
                    type="text"
                    placeholder="gpt-4o-mini"
                  />
                </label>

                <label
                  v-if="providerForm.provider === 'OPENAI'"
                  class="form-control"
                >
                  <span class="label-text font-bold">Image Model</span>
                  <input
                    v-model.trim="providerForm.imageModel"
                    class="input input-bordered rounded-xl"
                    type="text"
                    placeholder="gpt-image-1"
                  />
                </label>
              </div>

              <button
                class="btn btn-primary mt-3 w-full rounded-xl"
                type="button"
                :disabled="isSaving || !providerForm.apiKey"
                @click="createProviderServers"
              >
                <span
                  v-if="isSaving"
                  class="loading loading-spinner loading-sm"
                />
                Save Provider Server
              </button>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <h3 class="font-black text-info">Add Custom URL</h3>
              <p class="mb-3 text-sm text-base-content/60">
                Use this for ComfyUI, A1111, Ollama, or a compatible local
                service.
              </p>

              <label class="form-control">
                <span class="label-text font-bold">Server Type</span>
                <select
                  v-model="customForm.serverType"
                  class="select select-bordered rounded-xl"
                >
                  <option value="COMFY">ComfyUI</option>
                  <option value="A1111">Automatic1111</option>
                  <option value="OLLAMA">Ollama</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>

              <label class="form-control mt-2">
                <span class="label-text font-bold">Label</span>
                <input
                  v-model.trim="customForm.label"
                  class="input input-bordered rounded-xl"
                  type="text"
                  placeholder="Local Comfy"
                />
              </label>

              <label class="form-control mt-2">
                <span class="label-text font-bold">URL</span>
                <input
                  v-model.trim="customForm.url"
                  class="input input-bordered rounded-xl"
                  type="url"
                  placeholder="http://192.168.5.231:8188"
                />
              </label>

              <label class="form-control mt-2">
                <span class="label-text font-bold">Default Model</span>
                <input
                  v-model.trim="customForm.model"
                  class="input input-bordered rounded-xl"
                  type="text"
                  placeholder="Optional"
                />
              </label>

              <button
                class="btn btn-info mt-3 w-full rounded-xl"
                type="button"
                :disabled="isSaving || !customForm.url"
                @click="createCustomServer"
              >
                <span
                  v-if="isSaving"
                  class="loading loading-spinner loading-sm"
                />
                Save Custom Server
              </button>
            </div>
          </section>
        </div>

        <server-gallery
          mode="all"
          variant="dropdown"
          :show-header="false"
          :show-controls="true"
          :show-card-actions="true"
          :show-use-buttons="true"
        />
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'

type ServerType =
  | 'OPENAI'
  | 'ANTHROPIC'
  | 'A1111'
  | 'COMFY'
  | 'OLLAMA'
  | 'CUSTOM'

type ServerCategory = 'art' | 'text' | 'local' | 'custom'

interface ServerRecord {
  id: number
  title?: string | null
  label?: string | null
  description?: string | null
  serverType: ServerType | string
  category?: string | null
  url?: string | null
  serverUrl?: string | null
  post?: string | null
  model?: string | null
  defaultModel?: string | null
  apiKey?: string | null
  isActive?: boolean | null
  isPublic?: boolean | null
  userId?: number | null
}

interface ServerCreateInput {
  title: string
  label: string
  description?: string
  serverType: ServerType
  category?: ServerCategory
  url?: string
  serverUrl?: string
  post?: string
  apiKey?: string
  model?: string
  defaultModel?: string
  isActive: boolean
  isPublic: boolean
}

type ServerStoreWithLegacyActions = ReturnType<typeof useServerStore> & {
  servers?: ServerRecord[]
  hasLoaded?: boolean
  activeArtServer?: ServerRecord | null
  activeTextServer?: ServerRecord | null
  initialize?: (options?: { fetchRemote?: boolean }) => Promise<void>
  fetchServers?: () => Promise<unknown>
  createServer?: (payload: ServerCreateInput) => Promise<unknown>
  addServer?: (payload: ServerCreateInput) => Promise<unknown>
  setActiveArtServer?: (serverId: number | null) => Promise<void> | void
  setActiveTextServer?: (serverId: number | null) => Promise<void> | void
  setCurrentServer?: (serverId: number | null) => void
  getServerById?: (serverId: number) => ServerRecord | null | undefined
}

const serverStore = useServerStore() as ServerStoreWithLegacyActions
const selectorDialog = ref<HTMLDialogElement | null>(null)
const selectedArtServerId = ref<number | null>(null)
const selectedTextServerId = ref<number | null>(null)
const isSaving = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const providerForm = reactive({
  provider: 'OPENAI' as 'OPENAI' | 'ANTHROPIC',
  label: '',
  apiKey: '',
  textModel: 'gpt-4o-mini',
  imageModel: 'gpt-image-1',
})

const customForm = reactive({
  serverType: 'COMFY' as 'COMFY' | 'A1111' | 'OLLAMA' | 'CUSTOM',
  label: '',
  url: '',
  model: '',
})

const configuredServers = computed(() => {
  const servers = Array.isArray(serverStore.servers) ? serverStore.servers : []

  return servers
    .filter((server) => server && server.id)
    .sort((a, b) => {
      const activeSort = Number(Boolean(b.isActive)) - Number(Boolean(a.isActive))

      if (activeSort) {
        return activeSort
      }

      return String(a.label || a.title || '').localeCompare(
        String(b.label || b.title || ''),
      )
    })
})

const artServers = computed(() => {
  return configuredServers.value.filter((server) => {
    if (server.isActive === false) {
      return false
    }

    const type = server.serverType
    const category = String(server.category || '').toLowerCase()

    return (
      ['A1111', 'COMFY'].includes(type) ||
      (type === 'OPENAI' && category === 'art') ||
      category === 'image' ||
      category === 'art'
    )
  })
})

const textServers = computed(() => {
  return configuredServers.value.filter((server) => {
    if (server.isActive === false) {
      return false
    }

    const type = server.serverType
    const category = String(server.category || '').toLowerCase()

    return (
      ['OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM'].includes(type) ||
      category === 'text' ||
      category === 'chat'
    )
  })
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function refreshServers() {
  if (typeof serverStore.fetchServers === 'function') {
    await serverStore.fetchServers()
    return
  }

  if (typeof serverStore.initialize === 'function') {
    await serverStore.initialize({ fetchRemote: true })
  }
}

async function saveServer(payload: ServerCreateInput) {
  if (typeof serverStore.createServer === 'function') {
    return await serverStore.createServer(payload)
  }

  if (typeof serverStore.addServer === 'function') {
    return await serverStore.addServer(payload)
  }

  return await $fetch('/api/server', {
    method: 'POST',
    body: payload,
  })
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}

function providerLabel(fallback: string) {
  return providerForm.label.trim() || fallback
}

function customLabel() {
  if (customForm.label.trim()) {
    return customForm.label.trim()
  }

  if (customForm.serverType === 'COMFY') {
    return 'Local ComfyUI'
  }

  if (customForm.serverType === 'A1111') {
    return 'Local Automatic1111'
  }

  if (customForm.serverType === 'OLLAMA') {
    return 'Local Ollama'
  }

  return 'Custom Server'
}

function getServerById(serverId: number | null) {
  if (!serverId) {
    return null
  }

  if (typeof serverStore.getServerById === 'function') {
    return serverStore.getServerById(serverId) ?? null
  }

  return configuredServers.value.find((server) => server.id === serverId) ?? null
}

function openSelector() {
  selectedArtServerId.value = serverStore.activeArtServer?.id ?? null
  selectedTextServerId.value = serverStore.activeTextServer?.id ?? null
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
}

function applyArtServer() {
  void serverStore.setActiveArtServer?.(selectedArtServerId.value)

  const server = getServerById(selectedArtServerId.value)

  if (server) {
    serverStore.setCurrentServer?.(server.id)
  }

  closeSelector()
}

function applyTextServer() {
  void serverStore.setActiveTextServer?.(selectedTextServerId.value)

  const server = getServerById(selectedTextServerId.value)

  if (server) {
    serverStore.setCurrentServer?.(server.id)
  }

  closeSelector()
}

async function createProviderServers() {
  if (!providerForm.apiKey.trim()) {
    setStatus('API key required. The robots demand tribute.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    if (providerForm.provider === 'OPENAI') {
      const textLabel = providerLabel('OpenAI Text')
      const imageLabel = providerLabel('OpenAI Images')

      await saveServer({
        title: textLabel,
        label: textLabel,
        description: 'OpenAI text generation provider.',
        serverType: 'OPENAI',
        category: 'text',
        apiKey: providerForm.apiKey.trim(),
        model: providerForm.textModel.trim() || 'gpt-4o-mini',
        defaultModel: providerForm.textModel.trim() || 'gpt-4o-mini',
        isActive: true,
        isPublic: false,
      })

      await saveServer({
        title: imageLabel,
        label: imageLabel,
        description: 'OpenAI image generation provider.',
        serverType: 'OPENAI',
        category: 'art',
        apiKey: providerForm.apiKey.trim(),
        model: providerForm.imageModel.trim() || 'gpt-image-1',
        defaultModel: providerForm.imageModel.trim() || 'gpt-image-1',
        isActive: true,
        isPublic: false,
      })

      setStatus('OpenAI text and image servers created. Two bots enter, two bots leave.')
    }

    if (providerForm.provider === 'ANTHROPIC') {
      const label = providerLabel('Anthropic Text')

      await saveServer({
        title: label,
        label,
        description: 'Anthropic text generation provider.',
        serverType: 'ANTHROPIC',
        category: 'text',
        apiKey: providerForm.apiKey.trim(),
        model: providerForm.textModel.trim() || 'claude-sonnet-4-6',
        defaultModel: providerForm.textModel.trim() || 'claude-sonnet-4-6',
        isActive: true,
        isPublic: false,
      })

      setStatus('Anthropic text server created. Claude has entered the tiny wizard booth.')
    }

    providerForm.apiKey = ''
    providerForm.label = ''

    await refreshServers()
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to create provider server.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function createCustomServer() {
  if (!customForm.url.trim()) {
    setStatus('Custom server URL required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const label = customLabel()
    const url = normalizeUrl(customForm.url)

    await saveServer({
      title: label,
      label,
      description: `${customForm.serverType} custom server endpoint.`,
      serverType: customForm.serverType,
      category:
        customForm.serverType === 'OLLAMA'
          ? 'text'
          : customForm.serverType === 'CUSTOM'
            ? 'custom'
            : 'art',
      url,
      serverUrl: url,
      post: url,
      model: customForm.model.trim(),
      defaultModel: customForm.model.trim(),
      isActive: true,
      isPublic: false,
    })

    customForm.label = ''
    customForm.url = ''
    customForm.model = ''

    await refreshServers()

    setStatus(`${label} created. Local goblin pipeline restored.`)
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to create custom server.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await serverStore.initialize?.({
      fetchRemote: true,
    })
  }
})
</script>