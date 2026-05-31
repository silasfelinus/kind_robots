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
        class="modal-box flex max-h-[90vh] w-11/12 max-w-3xl flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100"
      >
        <header class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-black text-primary">Server Connections</h2>
            <p class="text-sm text-base-content/60">
              Pick defaults, save provider keys, and manage local endpoints.
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
            <span class="label-text font-bold">Default Art</span>
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
            <span class="label-text font-bold">Default Text</span>
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
            Save Defaults
          </button>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-black text-primary">Connections</h3>
              <p class="text-sm text-base-content/60">
                Provider keys and private local servers.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="showAddLocal = !showAddLocal"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Add Local
            </button>
          </div>

          <div class="mt-3 grid gap-3">
            <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-black">OpenAI</p>
                  <p class="text-xs text-base-content/60">
                    {{ openAiTextServer ? 'Text saved' : 'No text key saved' }}
                    ·
                    {{
                      openAiArtServer ? 'Images saved' : 'No image key saved'
                    }}
                  </p>
                </div>

                <span
                  class="badge"
                  :class="
                    openAiTextServer || openAiArtServer
                      ? 'badge-success'
                      : 'badge-ghost'
                  "
                >
                  {{ openAiTextServer || openAiArtServer ? 'saved' : 'empty' }}
                </span>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  v-model.trim="openAiKey"
                  class="input input-bordered min-w-0 flex-1 rounded-xl"
                  type="password"
                  :placeholder="
                    openAiTextServer || openAiArtServer
                      ? '••••••••••••••••'
                      : 'OpenAI API key'
                  "
                />

                <button
                  class="btn btn-primary rounded-xl"
                  type="button"
                  :disabled="isSaving || !openAiKey"
                  @click="saveOpenAi"
                >
                  Save
                </button>
              </div>
            </article>

            <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-black">Anthropic</p>
                  <p class="text-xs text-base-content/60">
                    {{ anthropicServer ? 'Key saved' : 'No key saved' }}
                  </p>
                </div>

                <span
                  class="badge"
                  :class="anthropicServer ? 'badge-success' : 'badge-ghost'"
                >
                  {{ anthropicServer ? 'saved' : 'empty' }}
                </span>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  v-model.trim="anthropicKey"
                  class="input input-bordered min-w-0 flex-1 rounded-xl"
                  type="password"
                  :placeholder="
                    anthropicServer ? '••••••••••••••••' : 'Anthropic API key'
                  "
                />

                <button
                  class="btn btn-primary rounded-xl"
                  type="button"
                  :disabled="isSaving || !anthropicKey"
                  @click="saveAnthropic"
                >
                  Save
                </button>
              </div>
            </article>

            <article
              v-for="server in localServers"
              :key="server.id"
              class="rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-black">
                    {{ server.label || server.title }}
                  </p>
                  <p class="truncate text-xs text-base-content/60">
                    {{ localServerLabel(server.serverType) }}
                    <span v-if="server.baseUrl"> · {{ server.baseUrl }}</span>
                  </p>
                </div>

                <button
                  class="btn btn-sm btn-ghost rounded-xl"
                  type="button"
                  @click="startEdit(server)"
                >
                  Edit
                </button>
              </div>
            </article>

            <p
              v-if="!localServers.length"
              class="rounded-2xl border border-dashed border-base-300 p-3 text-sm text-base-content/60"
            >
              No local servers saved yet.
            </p>
          </div>
        </section>

        <section
          v-if="showAddLocal"
          class="rounded-2xl border border-secondary/40 bg-secondary/10 p-3"
        >
          <h3 class="font-black text-secondary">Add Local Server</h3>

          <div class="mt-3 grid gap-3">
            <label class="form-control">
              <span class="label-text font-bold">Server Type</span>
              <select
                v-model="newLocal.serverType"
                class="select select-bordered rounded-xl"
              >
                <option value="COMFY">ComfyUI</option>
                <option value="A1111">Stable Diffusion / A1111</option>
                <option value="OLLAMA">Ollama</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Connection Type</span>
              <select
                v-model="newLocal.accessMode"
                class="select select-bordered rounded-xl"
              >
                <option value="BROWSER">Browser direct</option>
                <option value="BACKEND">Backend proxy</option>
                <option value="TAILSCALE">Tailscale</option>
                <option value="LOCAL">Local</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Label</span>
              <input
                v-model.trim="newLocal.label"
                class="input input-bordered rounded-xl"
                type="text"
                :placeholder="defaultLocalLabel(newLocal.serverType)"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Base URL</span>
              <input
                v-model.trim="newLocal.baseUrl"
                class="input input-bordered rounded-xl"
                type="url"
                placeholder="http://192.168.1.50:8188"
              />
            </label>

            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-secondary rounded-xl"
                type="button"
                :disabled="isSaving || !newLocal.baseUrl"
                @click="saveLocalServer"
              >
                Save Local Server
              </button>

              <button
                class="btn btn-ghost rounded-xl"
                type="button"
                @click="cancelAddLocal"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>

        <section
          v-if="editingServerId"
          class="rounded-2xl border border-info/40 bg-info/10 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-black text-info">Edit Local Server</h3>
              <p class="text-sm text-base-content/60">
                Advanced options for endpoints and health checks.
              </p>
            </div>

            <button
              class="btn btn-sm btn-ghost rounded-xl"
              type="button"
              @click="cancelEdit"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Label</span>
              <input
                v-model.trim="editForm.label"
                class="input input-bordered rounded-xl"
                type="text"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Connection Type</span>
              <select
                v-model="editForm.accessMode"
                class="select select-bordered rounded-xl"
              >
                <option value="BROWSER">Browser direct</option>
                <option value="BACKEND">Backend proxy</option>
                <option value="TAILSCALE">Tailscale</option>
                <option value="LOCAL">Local</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Base URL</span>
              <input
                v-model.trim="editForm.baseUrl"
                class="input input-bordered rounded-xl"
                type="url"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Endpoint Path</span>
              <input
                v-model.trim="editForm.endpointPath"
                class="input input-bordered rounded-xl"
                type="text"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Health Path</span>
              <input
                v-model.trim="editForm.healthPath"
                class="input input-bordered rounded-xl"
                type="text"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Model</span>
              <input
                v-model.trim="editForm.model"
                class="input input-bordered rounded-xl"
                type="text"
                placeholder="Optional"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Notes</span>
              <textarea
                v-model.trim="editForm.notes"
                class="textarea textarea-bordered rounded-xl"
                rows="3"
              />
            </label>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <button
              class="btn btn-info rounded-xl"
              type="button"
              :disabled="isSaving"
              @click="saveEditedServer"
            >
              Save Changes
            </button>

            <button
              class="btn btn-error rounded-xl"
              type="button"
              :disabled="isSaving"
              @click="deleteEditedServer"
            >
              Delete
            </button>
          </div>
        </section>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { Server } from '~/prisma/generated/prisma/client'

type ProviderType = 'OPENAI' | 'ANTHROPIC'
type LocalServerType = 'A1111' | 'COMFY' | 'OLLAMA'
type AccessMode = 'BROWSER' | 'BACKEND' | 'TAILSCALE' | 'PUBLIC' | 'LOCAL'
type AuthType = 'NONE' | 'API_KEY'

interface LocalServerDraft {
  serverType: LocalServerType
  accessMode: AccessMode
  label: string
  baseUrl: string
}

interface LocalServerEdit {
  label: string
  accessMode: AccessMode
  baseUrl: string
  endpointPath: string
  healthPath: string
  model: string
  notes: string
}

const serverStore = useServerStore()
const selectorDialog = ref<HTMLDialogElement | null>(null)

const selectedArtServerId = ref<number | null>(null)
const selectedTextServerId = ref<number | null>(null)

const openAiKey = ref('')
const anthropicKey = ref('')

const showAddLocal = ref(false)
const editingServerId = ref<number | null>(null)

const isSaving = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

function serverTypeForLocal(serverType: LocalServerType): Server['serverType'] {
  if (serverType === 'OLLAMA') {
    return 'CUSTOM'
  }

  return serverType
}

function modelForLocal(serverType: LocalServerType) {
  if (serverType === 'OLLAMA') {
    return 'ollama'
  }

  return ''
}

const newLocal = reactive<LocalServerDraft>({
  serverType: 'COMFY',
  accessMode: 'BROWSER',
  label: '',
  baseUrl: '',
})

const editForm = reactive<LocalServerEdit>({
  label: '',
  accessMode: 'BROWSER',
  baseUrl: '',
  endpointPath: '',
  healthPath: '',
  model: '',
  notes: '',
})

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

const openAiTextServer = computed(() => {
  return servers.value.find((server) => {
    return (
      String(server.serverType) === 'OPENAI' &&
      String(server.category || '').toLowerCase() === 'text'
    )
  })
})

const openAiArtServer = computed(() => {
  return servers.value.find((server) => {
    return (
      String(server.serverType) === 'OPENAI' &&
      ['art', 'image'].includes(String(server.category || '').toLowerCase())
    )
  })
})

const anthropicServer = computed(() => {
  return servers.value.find(
    (server) => String(server.serverType) === 'ANTHROPIC',
  )
})

const localServers = computed(() => {
  return servers.value.filter((server) => {
    return ['A1111', 'COMFY', 'OLLAMA'].includes(String(server.serverType))
  })
})

const artServers = computed(() => serverStore.artServers)
const textServers = computed(() => serverStore.textServers)

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

function defaultLocalLabel(serverType: LocalServerType) {
  if (serverType === 'A1111') {
    return 'Stable Diffusion'
  }

  if (serverType === 'COMFY') {
    return 'ComfyUI'
  }

  return 'Ollama'
}

function localServerLabel(serverType: string) {
  if (serverType === 'A1111') {
    return 'Stable Diffusion'
  }

  if (serverType === 'COMFY') {
    return 'ComfyUI'
  }

  if (serverType === 'OLLAMA') {
    return 'Ollama'
  }

  return serverType
}

function defaultEndpointPath(serverType: LocalServerType) {
  if (serverType === 'A1111') {
    return '/sdapi/v1/txt2img'
  }

  if (serverType === 'COMFY') {
    return '/prompt'
  }

  return '/api/generate'
}

function defaultHealthPath(serverType: LocalServerType) {
  if (serverType === 'A1111') {
    return '/sdapi/v1/progress'
  }

  if (serverType === 'COMFY') {
    return '/system_stats'
  }

  return '/api/tags'
}

function categoryForServerType(serverType: LocalServerType) {
  return serverType === 'OLLAMA' ? 'text' : 'art'
}

async function refreshServers() {
  await serverStore.fetchAllServers(true)
}

async function createServer(body: Partial<Server>) {
  return await serverStore.addServer(body)
}

async function updateServer(id: number, body: Partial<Server>) {
  return await serverStore.updateServer(id, body)
}

async function deleteServer(id: number) {
  return await serverStore.deleteServer(id)
}

async function upsertServer(
  existingId: number | undefined,
  body: Partial<Server>,
) {
  if (existingId) {
    return await serverStore.updateServer(existingId, body)
  }

  return await serverStore.addServer(body)
}

async function saveSelections() {
  const artResult = await serverStore.setActiveArtServer(
    selectedArtServerId.value,
  )
  const textResult = await serverStore.setActiveTextServer(
    selectedTextServerId.value,
  )

  if (!artResult.success) {
    setStatus(artResult.message || 'Unable to save art server.', 'error')
    return
  }

  if (!textResult.success) {
    setStatus(textResult.message || 'Unable to save text server.', 'error')
    return
  }

  if (selectedArtServerId.value) {
    serverStore.setCurrentServer(selectedArtServerId.value)
  } else if (selectedTextServerId.value) {
    serverStore.setCurrentServer(selectedTextServerId.value)
  }

  setStatus('Default servers saved.')
}

async function saveOpenAi() {
  if (!openAiKey.value) {
    setStatus('OpenAI key required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const textServerPayload: Partial<Server> = {
      title: 'OpenAI Text',
      label: 'OpenAI Text',
      description: 'Private OpenAI text server.',
      category: 'text',
      serverType: 'OPENAI',
      accessMode: 'BACKEND',
      authType: 'API_KEY',
      baseUrl: 'https://api.openai.com/v1',
      endpointPath: '/chat/completions',
      apiKey: openAiKey.value,
      apiKeyName: 'Authorization',
      model: 'gpt-4o-mini',
      isActive: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    }

    const imageServerPayload: Partial<Server> = {
      title: 'OpenAI Images',
      label: 'OpenAI Images',
      description: 'Private OpenAI image server.',
      category: 'art',
      serverType: 'OPENAI',
      accessMode: 'BACKEND',
      authType: 'API_KEY',
      baseUrl: 'https://api.openai.com/v1',
      endpointPath: '/images/generations',
      apiKey: openAiKey.value,
      apiKeyName: 'Authorization',
      model: 'gpt-image-1',
      isActive: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    }

    const textResult = await upsertServer(
      openAiTextServer.value?.id,
      textServerPayload,
    )

    if (!textResult.success) {
      throw new Error(textResult.message || 'Unable to save OpenAI text key.')
    }

    const imageResult = await upsertServer(
      openAiArtServer.value?.id,
      imageServerPayload,
    )

    if (!imageResult.success) {
      throw new Error(imageResult.message || 'Unable to save OpenAI image key.')
    }

    openAiKey.value = ''
    await refreshServers()
    setStatus('OpenAI key saved for text and images.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to save OpenAI key.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function saveAnthropic() {
  if (!anthropicKey.value) {
    setStatus('Anthropic key required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const result = await upsertServer(anthropicServer.value?.id, {
      title: 'Anthropic',
      label: 'Anthropic',
      description: 'Private Anthropic text server.',
      category: 'text',
      serverType: 'ANTHROPIC' satisfies ProviderType,
      accessMode: 'BACKEND' satisfies AccessMode,
      authType: 'API_KEY' satisfies AuthType,
      baseUrl: 'https://api.anthropic.com/v1',
      endpointPath: '/messages',
      apiKey: anthropicKey.value,
      apiKeyName: 'x-api-key',
      model: 'claude-sonnet-4-6',
      isActive: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    })

    if (!result.success) {
      throw new Error(result.message || 'Unable to save Anthropic key.')
    }

    anthropicKey.value = ''
    await refreshServers()
    setStatus('Anthropic key saved.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to save Anthropic key.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function saveLocalServer() {
  if (!newLocal.baseUrl) {
    setStatus('Base URL required.', 'error')
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const label = newLocal.label || defaultLocalLabel(newLocal.serverType)
    const baseUrl = cleanUrl(newLocal.baseUrl)

    const result = await createServer({
      title: label,
      label,
      description: `Private ${label} endpoint.`,
      category: categoryForServerType(newLocal.serverType),
      serverType: serverTypeForLocal(newLocal.serverType),
      accessMode: newLocal.accessMode,
      authType: 'NONE',
      baseUrl,
      endpointPath: defaultEndpointPath(newLocal.serverType),
      healthPath: defaultHealthPath(newLocal.serverType),
      apiLink: baseUrl,
      model: modelForLocal(newLocal.serverType),
      isActive: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
    })

    if (!result.success) {
      throw new Error(result.message || 'Unable to save local server.')
    }

    cancelAddLocal()
    await refreshServers()
    setStatus(`${label} saved.`)
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to save local server.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

function cancelAddLocal() {
  showAddLocal.value = false
  newLocal.serverType = 'COMFY'
  newLocal.accessMode = 'BROWSER'
  newLocal.label = ''
  newLocal.baseUrl = ''
}

function startEdit(server: Server) {
  editingServerId.value = server.id
  editForm.label = server.label || server.title || ''
  editForm.accessMode = String(server.accessMode || 'BROWSER') as AccessMode
  editForm.baseUrl = server.baseUrl || ''
  editForm.endpointPath = server.endpointPath || ''
  editForm.healthPath = server.healthPath || ''
  editForm.model = server.model || ''
  editForm.notes = server.notes || ''
}

function cancelEdit() {
  editingServerId.value = null
  editForm.label = ''
  editForm.accessMode = 'BROWSER'
  editForm.baseUrl = ''
  editForm.endpointPath = ''
  editForm.healthPath = ''
  editForm.model = ''
  editForm.notes = ''
}

async function saveEditedServer() {
  if (!editingServerId.value) {
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const result = await updateServer(editingServerId.value, {
      title: editForm.label,
      label: editForm.label,
      accessMode: editForm.accessMode,
      baseUrl: cleanUrl(editForm.baseUrl),
      endpointPath: editForm.endpointPath,
      healthPath: editForm.healthPath,
      model: editForm.model,
      notes: editForm.notes,
      apiLink: cleanUrl(editForm.baseUrl),
    })

    if (!result.success) {
      throw new Error(result.message || 'Unable to update server.')
    }

    cancelEdit()
    await refreshServers()
    setStatus('Local server updated.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to update server.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function deleteEditedServer() {
  if (!editingServerId.value) {
    return
  }

  isSaving.value = true
  statusMessage.value = ''

  try {
    const result = await deleteServer(editingServerId.value)

    if (!result.success) {
      throw new Error(result.message || 'Unable to delete server.')
    }

    cancelEdit()
    await refreshServers()
    setStatus('Local server deleted.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Unable to delete server.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}
</script>
