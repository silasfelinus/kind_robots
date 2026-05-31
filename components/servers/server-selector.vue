<!-- /components/servers/server-selector.vue -->
<template>
  <div class="relative">
    <button
      class="btn btn-sm btn-ghost rounded-xl border border-base-300 bg-base-100"
      type="button"
      title="Server settings"
      @click="openSelector"
    >
      <Icon name="kind-icon:server" class="h-4 w-4" />
    </button>

    <dialog ref="selectorDialog" class="modal">
      <div
        class="modal-box flex max-h-[90vh] w-11/12 max-w-2xl flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100"
      >
        <header class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-primary">Servers</h2>
            <p class="text-sm text-base-content/60">
              Add private API keys or local generation URLs.
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

        <section class="grid gap-3 md:grid-cols-2">
          <label class="form-control">
            <span class="label-text font-bold">Art Server</span>
            <select
              v-model.number="selectedArtServerId"
              class="select select-bordered rounded-xl"
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
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Text Server</span>
            <select
              v-model.number="selectedTextServerId"
              class="select select-bordered rounded-xl"
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
          </label>

          <button
            class="btn btn-primary rounded-xl md:col-span-2"
            type="button"
            @click="saveSelections"
          >
            Save Selected Servers
          </button>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h3 class="font-black text-primary">Add API Key</h3>

          <div class="mt-3 grid gap-3">
            <select
              v-model="apiProvider"
              class="select select-bordered rounded-xl"
            >
              <option value="OPENAI">OpenAI</option>
              <option value="ANTHROPIC">Anthropic</option>
            </select>

            <input
              v-model.trim="apiLabel"
              class="input input-bordered rounded-xl"
              type="text"
              placeholder="Label, optional"
            />

            <input
              v-model.trim="apiKey"
              class="input input-bordered rounded-xl"
              type="password"
              placeholder="Private API key"
            />

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="isSaving || !apiKey"
              @click="saveApiKey"
            >
              <span
                v-if="isSaving"
                class="loading loading-spinner loading-sm"
              />
              Save API Key
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h3 class="font-black text-secondary">Add Local URL</h3>

          <div class="mt-3 grid gap-3">
            <select
              v-model="urlServerType"
              class="select select-bordered rounded-xl"
            >
              <option value="A1111">Stable Diffusion / A1111</option>
              <option value="COMFY">ComfyUI</option>
              <option value="OLLAMA">Ollama</option>
            </select>

            <input
              v-model.trim="urlLabel"
              class="input input-bordered rounded-xl"
              type="text"
              placeholder="Label, optional"
            />

            <input
              v-model.trim="privateUrl"
              class="input input-bordered rounded-xl"
              type="url"
              placeholder="http://192.168.1.50:8188"
            />

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              :disabled="isSaving || !privateUrl"
              @click="savePrivateUrl"
            >
              <span
                v-if="isSaving"
                class="loading loading-spinner loading-sm"
              />
              Save Private URL
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h3 class="font-black text-accent">Configured Servers</h3>

          <div
            v-if="servers.length"
            class="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto"
          >
            <button
              v-for="server in servers"
              :key="server.id"
              class="rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-base-300"
              type="button"
              @click="serverStore.setCurrentServer(server.id)"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-black">
                    {{ server.label || server.title || `Server ${server.id}` }}
                  </p>
                  <p class="truncate text-xs opacity-60">
                    {{ server.serverType }}
                    <span v-if="server.category"> · {{ server.category }}</span>
                    <span v-if="server.baseUrl"> · {{ server.baseUrl }}</span>
                  </p>
                </div>

                <span
                  class="badge shrink-0"
                  :class="server.isActive ? 'badge-success' : 'badge-ghost'"
                >
                  {{ server.isActive ? 'active' : 'inactive' }}
                </span>
              </div>
            </button>
          </div>

          <p v-else class="mt-3 text-sm text-base-content/60">
            No configured servers loaded.
          </p>
        </section>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'

type ApiProvider = 'OPENAI' | 'ANTHROPIC'
type UrlServerType = 'A1111' | 'COMFY' | 'OLLAMA'

const serverStore = useServerStore()
const selectorDialog = ref<HTMLDialogElement | null>(null)

const selectedArtServerId = ref<number | null>(null)
const selectedTextServerId = ref<number | null>(null)

const apiProvider = ref<ApiProvider>('OPENAI')
const apiLabel = ref('')
const apiKey = ref('')

const urlServerType = ref<UrlServerType>('COMFY')
const urlLabel = ref('')
const privateUrl = ref('')

const isSaving = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const servers = computed(() => {
  return serverStore.servers
    .filter((server) => server && server.id)
    .sort((a, b) => {
      const activeSort =
        Number(Boolean(b.isActive)) - Number(Boolean(a.isActive))

      if (activeSort) {
        return activeSort
      }

      return String(a.label || a.title || '').localeCompare(
        String(b.label || b.title || ''),
      )
    })
})

const artServers = computed(() => {
  return servers.value.filter((server) => {
    if (server.isActive === false) {
      return false
    }

    const type = String(server.serverType)
    const category = String(server.category || '').toLowerCase()

    return (
      ['A1111', 'COMFY'].includes(type) ||
      (type === 'OPENAI' && category === 'art') ||
      category === 'art' ||
      category === 'image'
    )
  })
})

const textServers = computed(() => {
  return servers.value.filter((server) => {
    if (server.isActive === false) {
      return false
    }

    const type = String(server.serverType)
    const category = String(server.category || '').toLowerCase()

    return (
      ['OPENAI', 'ANTHROPIC', 'OLLAMA'].includes(type) ||
      category === 'text' ||
      category === 'chat'
    )
  })
})

function openSelector() {
  selectedArtServerId.value = serverStore.activeArtServer?.id ?? null
  selectedTextServerId.value = serverStore.activeTextServer?.id ?? null
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function cleanUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function defaultUrlLabel() {
  if (urlServerType.value === 'A1111') {
    return 'Stable Diffusion'
  }

  if (urlServerType.value === 'COMFY') {
    return 'ComfyUI'
  }

  return 'Ollama'
}

function endpointPathForUrlServer() {
  if (urlServerType.value === 'A1111') {
    return '/sdapi/v1/txt2img'
  }

  if (urlServerType.value === 'COMFY') {
    return '/prompt'
  }

  return '/api/generate'
}

function healthPathForUrlServer() {
  if (urlServerType.value === 'A1111') {
    return '/sdapi/v1/progress'
  }

  if (urlServerType.value === 'COMFY') {
    return '/system_stats'
  }

  return '/api/tags'
}

async function createServer(body: Record<string, unknown>) {
  return await $fetch('/api/server', {
    method: 'POST',
    body,
  })
}

async function refreshServers() {
  await serverStore.fetchAllServers()
}

async function saveSelections() {
  await serverStore.setActiveArtServer(selectedArtServerId.value)
  await serverStore.setActiveTextServer(selectedTextServerId.value)

  if (selectedArtServerId.value) {
    serverStore.setCurrentServer(selectedArtServerId.value)
  } else if (selectedTextServerId.value) {
    serverStore.setCurrentServer(selectedTextServerId.value)
  }

  setStatus('Server selections saved.')
}

async function saveApiKey() {
  if (!apiKey.value) {
    setStatus('API key required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    if (apiProvider.value === 'OPENAI') {
      const label = apiLabel.value || 'OpenAI'

      await createServer({
        title: `${label} Text`,
        label: `${label} Text`,
        description: 'Private OpenAI text server.',
        category: 'text',
        serverType: 'OPENAI',
        accessMode: 'SERVER',
        authType: 'API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        endpointPath: '/chat/completions',
        apiKey: apiKey.value,
        apiKeyName: 'Authorization',
        model: 'gpt-4o-mini',
        isActive: true,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isEditable: true,
      })

      await createServer({
        title: `${label} Images`,
        label: `${label} Images`,
        description: 'Private OpenAI image server.',
        category: 'art',
        serverType: 'OPENAI',
        accessMode: 'SERVER',
        authType: 'API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        endpointPath: '/images/generations',
        apiKey: apiKey.value,
        apiKeyName: 'Authorization',
        model: 'gpt-image-1',
        isActive: true,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isEditable: true,
      })

      setStatus('OpenAI text and image servers saved.')
    }

    if (apiProvider.value === 'ANTHROPIC') {
      const label = apiLabel.value || 'Anthropic'

      await createServer({
        title: label,
        label,
        description: 'Private Anthropic text server.',
        category: 'text',
        serverType: 'ANTHROPIC',
        accessMode: 'SERVER',
        authType: 'API_KEY',
        baseUrl: 'https://api.anthropic.com/v1',
        endpointPath: '/messages',
        apiKey: apiKey.value,
        apiKeyName: 'x-api-key',
        model: 'claude-sonnet-4-6',
        isActive: true,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isEditable: true,
      })

      setStatus('Anthropic server saved.')
    }

    apiLabel.value = ''
    apiKey.value = ''

    await refreshServers()
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to save API key.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function savePrivateUrl() {
  if (!privateUrl.value) {
    setStatus('Private URL required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const label = urlLabel.value || defaultUrlLabel()
    const baseUrl = cleanUrl(privateUrl.value)

    await createServer({
      title: label,
      label,
      description: `Private ${label} endpoint.`,
      category: urlServerType.value === 'OLLAMA' ? 'text' : 'art',
      serverType: urlServerType.value,
      accessMode: 'BROWSER',
      authType: 'NONE',
      baseUrl,
      endpointPath: endpointPathForUrlServer(),
      healthPath: healthPathForUrlServer(),
      apiLink: baseUrl,
      isActive: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    })

    urlLabel.value = ''
    privateUrl.value = ''

    await refreshServers()

    setStatus(`${label} URL saved.`)
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to save private URL.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await serverStore.initialize({
      fetchRemote: true,
    })
  }
})
</script>
