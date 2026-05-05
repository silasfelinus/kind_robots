<!-- /components/server/art-servers.vue -->
<template>
  <section
    class="flex w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-base-content sm:p-4"
  >
    <header
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
        >
          <icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
        </div>

        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-primary">Art Server</h2>
          <p class="text-xs text-base-content/60">
            Pick an image engine, customize it, ping it, then make the pixels
            behave.
          </p>
        </div>
      </div>

      <div
        v-if="activeServer"
        class="flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
      >
        <span class="badge badge-sm badge-primary">{{
          activeServer.serverType
        }}</span>
        <span class="max-w-48 truncate text-xs font-bold">
          {{ activeServer.label || activeServer.title }}
        </span>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]"
    >
      <select
        v-model="selectedServerId"
        class="select select-bordered w-full rounded-xl"
        @change="selectServer"
      >
        <option :value="null">Use default art server</option>

        <option
          v-for="option in serverOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <button
        type="button"
        class="btn btn-outline rounded-xl"
        :class="
          pingStatus === 'ok'
            ? 'btn-success'
            : pingStatus === 'fail'
              ? 'btn-error'
              : ''
        "
        :disabled="!activeServer || pinging"
        @click="pingServer"
      >
        <span v-if="pinging" class="loading loading-spinner loading-xs" />
        <span v-else>{{ pingLabel }}</span>
      </button>

      <button
        type="button"
        class="btn btn-outline rounded-xl"
        :disabled="!activeServer || fetchingCheckpoint"
        @click="fetchCurrentCheckpoint"
      >
        <span
          v-if="fetchingCheckpoint"
          class="loading loading-spinner loading-xs"
        />
        <span v-else>Active Model</span>
      </button>

      <button
        type="button"
        class="btn btn-primary rounded-xl"
        @click="openEditor"
      >
        <icon name="kind-icon:wrench" class="h-4 w-4" />
        Customize
      </button>

      <button
        v-if="canDeleteActiveServer"
        type="button"
        class="btn btn-error btn-outline rounded-xl"
        :disabled="deletingServer"
        @click="deleteActiveServer"
      >
        <span
          v-if="deletingServer"
          class="loading loading-spinner loading-xs"
        />
        <icon v-else name="kind-icon:trash" class="h-4 w-4" />
        Delete
      </button>
    </div>

    <div v-if="activeServer" class="grid grid-cols-1 gap-2 md:grid-cols-3">
      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">URL</div>
        <div class="truncate font-mono text-xs">{{ activeServer.baseUrl }}</div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">Type</div>
        <div class="badge badge-sm">{{ activeServer.serverType }}</div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">
          Status
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-2 w-2 rounded-full"
            :class="statusClass"
          />
          <span class="text-sm font-bold">{{
            activeServer.lastStatus ?? 'UNKNOWN'
          }}</span>
        </div>
      </div>
    </div>

    <Transition name="fade-expand">
      <div
        v-if="activeServer"
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <div>
            <div class="text-sm font-black text-primary">Loaded Checkpoint</div>
            <p class="text-xs text-base-content/60">
              A1111 reports its active model directly. Comfy can only infer from
              recent workflow history.
            </p>
          </div>

          <button
            v-if="serverCheckpoint"
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="serverCheckpoint = null"
          >
            Change
          </button>
        </div>

        <div
          v-if="serverCheckpoint"
          class="rounded-xl border border-base-300 bg-base-100 p-3 font-mono text-xs"
        >
          {{ serverCheckpoint }}
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <select
            v-model="pendingCheckpoint"
            class="select select-bordered select-sm w-full rounded-xl"
          >
            <option value="">Pick a checkpoint</option>

            <option
              v-for="checkpoint in checkpointStore.visibleCheckpoints"
              :key="checkpoint.name"
              :value="checkpoint.name"
            >
              {{ checkpoint.name }}
            </option>
          </select>

          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl"
            :disabled="!pendingCheckpoint || applyingCheckpoint"
            @click="applyCheckpoint"
          >
            <span
              v-if="applyingCheckpoint"
              class="loading loading-spinner loading-xs"
            />
            <span v-else>Load</span>
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="fade-expand">
      <form
        v-if="showEditor"
        class="grid grid-cols-1 gap-3 rounded-2xl border border-primary/30 bg-base-200 p-3 md:grid-cols-2"
        @submit.prevent="saveCustomServer"
      >
        <div class="md:col-span-2 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-black text-primary">Custom Art Server</h3>
            <p class="text-xs text-base-content/60">
              Saving creates a private user server. The original stays
              untouched.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            @click="showEditor = false"
          >
            <icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </div>

        <label class="form-control">
          <span class="label-text font-bold">Title</span>
          <input
            v-model="form.title"
            type="text"
            class="input input-bordered rounded-xl"
            placeholder="My Comfy Dragon"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Label</span>
          <input
            v-model="form.label"
            type="text"
            class="input input-bordered rounded-xl"
            placeholder="Comfy Local"
          />
        </label>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Base URL</span>
          <input
            v-model="form.baseUrl"
            type="url"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="https://comfy.example.com"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Server Type</span>
          <select
            v-model="form.serverType"
            class="select select-bordered rounded-xl"
            @change="syncCapabilities"
          >
            <option value="COMFY">COMFY</option>
            <option value="A1111">A1111</option>
            <option value="ART">ART</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Health Path</span>
          <input
            v-model="form.healthPath"
            type="text"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="/history"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Endpoint Path</span>
          <input
            v-model="form.endpointPath"
            type="text"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="/prompt"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">API Key Name</span>
          <input
            v-model="form.apiKeyName"
            type="text"
            class="input input-bordered rounded-xl"
            placeholder="Authorization"
          />
        </label>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Description</span>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered rounded-xl"
            rows="2"
            placeholder="Local ComfyUI server with browser CORS enabled."
          />
        </label>

        <div
          class="grid grid-cols-1 gap-2 md:col-span-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Txt2Img</span>
            <input
              v-model="form.supportsTxt2Img"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Img2Img</span>
            <input
              v-model="form.supportsImg2Img"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Comfy Workflow</span>
            <input
              v-model="form.supportsComfyWorkflow"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Checkpoint</span>
            <input
              v-model="form.supportsCheckpointOverride"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            />
          </label>
        </div>

        <!-- Access toggles row -->
        <div
          class="grid grid-cols-1 gap-2 md:col-span-2 sm:grid-cols-2 lg:grid-cols-3 mt-1"
        >
          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold"
              >Allow Browser Requests</span
            >
            <input
              v-model="form.allowBrowserRequests"
              type="checkbox"
              class="toggle toggle-success toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Private Network</span>
            <input
              v-model="form.isPrivateNetwork"
              type="checkbox"
              class="toggle toggle-warning toggle-sm"
            />
          </label>

          <label class="form-control">
            <span class="label-text text-xs font-bold">Access Mode</span>
            <select
              v-model="form.accessMode"
              class="select select-bordered select-sm rounded-xl"
            >
              <option value="LOCAL">LOCAL</option>
              <option value="PUBLIC_OIDC">PUBLIC_OIDC</option>
              <option value="PUBLIC_PROTECTED">PUBLIC_PROTECTED</option>
              <option value="PUBLIC_OPEN">PUBLIC_OPEN</option>
            </select>
          </label>
        </div>

        <div
          v-if="message"
          class="alert md:col-span-2"
          :class="messageSuccess ? 'alert-success' : 'alert-error'"
        >
          {{ message }}
        </div>

        <div
          class="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:justify-end"
        >
          <button
            type="button"
            class="btn btn-outline rounded-xl"
            @click="startNewServer"
          >
            New Blank Server
          </button>

          <button
            type="submit"
            class="btn btn-primary rounded-xl"
            :disabled="serverStore.isSaving || !canSave"
          >
            <span
              v-if="serverStore.isSaving"
              class="loading loading-spinner loading-xs"
            />
            <span v-else>Save Private Copy</span>
          </button>
        </div>
      </form>
    </Transition>

    <div v-if="serverError" class="alert alert-error rounded-2xl py-2 text-sm">
      {{ serverError }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useServerStore,
  type Server,
  type ServerType,
} from '@/stores/serverStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'

const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const userStore = useUserStore()

const selectedServerId = ref<number | null>(
  serverStore.activeArtServer?.id ?? null,
)
const showEditor = ref(false)
const pinging = ref(false)
const fetchingCheckpoint = ref(false)
const applyingCheckpoint = ref(false)
const deletingServer = ref(false)
const serverCheckpoint = ref<string | null>(null)
const pendingCheckpoint = ref('')
const serverError = ref('')
const message = ref('')
const messageSuccess = ref(false)
const pingStatus = ref<'idle' | 'ok' | 'fail'>('idle')

const form = ref<Partial<Server>>({})

const activeServer = computed(() =>
  selectedServerId.value !== null
    ? serverStore.getServerById(selectedServerId.value)
    : serverStore.activeArtServer,
)

const serverOptions = computed(() =>
  serverStore.artServerOptions.map((option) => {
    const server = serverStore.getServerById(option.value)
    const type = server?.serverType ?? 'ART'
    const suffix = option.isDefault ? ' default' : ''

    return {
      ...option,
      label: `[${type}] ${option.label}${suffix}`,
    }
  }),
)

const canSave = computed(() => {
  return Boolean(form.value.title?.trim() && form.value.baseUrl?.trim())
})

const canDeleteActiveServer = computed(() => {
  const server = activeServer.value
  if (!server?.id) return false
  if (!userStore.user?.id) return false
  if (server.userId !== userStore.user.id) return false
  if (server.isOfficial || server.isDefault || server.isPublic) return false
  return true
})

const pingLabel = computed(() => {
  if (pingStatus.value === 'ok') return 'Online'
  if (pingStatus.value === 'fail') return 'Offline'
  return 'Ping'
})

const statusClass = computed(() => {
  if (activeServer.value?.lastStatus === 'ONLINE') return 'bg-success'
  if (activeServer.value?.lastStatus === 'OFFLINE') return 'bg-error'
  return 'bg-warning'
})

async function selectServer() {
  await serverStore.setActiveArtServer(selectedServerId.value)
  resetRuntimeState()
}

function resetRuntimeState() {
  serverCheckpoint.value = null
  pendingCheckpoint.value = ''
  serverError.value = ''
  message.value = ''
  pingStatus.value = 'idle'
}

async function pingServer() {
  if (!activeServer.value) return

  pinging.value = true
  pingStatus.value = 'idle'

  const result = await serverStore.testServerHealth(activeServer.value.id)

  pingStatus.value = result.success && result.data?.ok ? 'ok' : 'fail'
  pinging.value = false
}

function openEditor() {
  const source = activeServer.value

  form.value = source
    ? {
        title:
          source.isOfficial || source.isDefault
            ? `${source.title} Custom`
            : source.title,
        label: source.label,
        description: source.description,
        allowBrowserRequests: source.allowBrowserRequests ?? true,
        accessMode: source.accessMode,
        isPrivateNetwork: source.isPrivateNetwork,
        category: source.category,
        serverType: source.serverType,
        baseUrl: source.baseUrl,
        endpointPath: source.endpointPath,
        healthPath: source.healthPath,
        requiresApiKey: source.requiresApiKey,
        apiKeyName: source.apiKeyName,
        supportsTxt2Img: source.supportsTxt2Img,
        supportsImg2Img: source.supportsImg2Img,
        supportsComfyWorkflow: source.supportsComfyWorkflow,
        supportsCheckpointOverride: source.supportsCheckpointOverride,
        supportsSampler: source.supportsSampler,
        supportsNegativePrompt: source.supportsNegativePrompt,
        supportsSeed: source.supportsSeed,
        supportsSteps: source.supportsSteps,
        designer: source.designer,
        version: source.version,
        notes: source.notes,
        sortOrder: source.sortOrder,
        isActive: true,
      }
    : blankForm()

  showEditor.value = true
}

function blankForm(): Partial<Server> {
  return {
    title: '',
    label: '',
    description: '',
    category: 'image',
    serverType: 'COMFY',

    baseUrl: '',
    endpointPath: '/prompt',
    healthPath: '/history',
    isActive: true,
    requiresApiKey: false,
    apiKeyName: '',
    supportsTxt2Img: true,
    supportsImg2Img: true,
    supportsChat: false,
    supportsComfyWorkflow: true,
    supportsCheckpointOverride: true,
    supportsSampler: true,
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsSteps: true,
    allowBrowserRequests: true,
    accessMode: 'LOCAL',
    isPrivateNetwork: false,
    lastStatus: 'UNKNOWN',
  }
}

function startNewServer() {
  selectedServerId.value = null
  form.value = blankForm()
  showEditor.value = true
  resetRuntimeState()
}

function syncCapabilities() {
  const type = form.value.serverType as ServerType

  if (type === 'COMFY') {
    form.value.endpointPath = form.value.endpointPath || '/prompt'
    form.value.healthPath = form.value.healthPath || '/history'
    form.value.supportsComfyWorkflow = true
    form.value.supportsTxt2Img = true
    form.value.supportsImg2Img = true
  }

  if (type === 'A1111' || type === 'ART') {
    form.value.endpointPath = form.value.endpointPath || '/sdapi/v1/txt2img'
    form.value.healthPath = form.value.healthPath || '/sdapi/v1/progress'
    form.value.supportsComfyWorkflow = false
    form.value.supportsTxt2Img = true
    form.value.supportsImg2Img = true
  }
}

async function saveCustomServer() {
  message.value = ''
  messageSuccess.value = false

  const result = await serverStore.saveServerAsUserCopy(
    selectedServerId.value,
    form.value,
    'art',
  )

  message.value =
    result.message || (result.success ? 'Server saved.' : 'Server save failed.')
  messageSuccess.value = result.success

  if (result.success && result.data) {
    selectedServerId.value = result.data.id
    await serverStore.setActiveArtServer(result.data.id)
    showEditor.value = false
  }
}

function parseComfyCheckpointFromHistory(
  history: Record<string, unknown>,
): string | null {
  const entries = Object.values(history) as Array<{
    prompt?: [
      number,
      string,
      Record<string, { class_type: string; inputs: Record<string, unknown> }>,
    ]
    status?: { completed: boolean }
  }>

  if (!entries.length) return null

  const completed = entries.filter((entry) => entry.status?.completed)
  const latest = completed.at(-1) ?? entries.at(-1)

  if (!latest?.prompt?.[2]) return null

  const nodes = latest.prompt[2]

  for (const node of Object.values(nodes)) {
    if (
      node.class_type === 'CheckpointLoaderSimple' ||
      node.class_type === 'CheckpointLoader'
    ) {
      const checkpoint = node.inputs?.ckpt_name ?? node.inputs?.config_name
      if (typeof checkpoint === 'string') return checkpoint
    }
  }

  return null
}

async function readServerResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return await response.json().catch(() => null)
  }

  return await response.text().catch(() => null)
}

async function fetchCurrentCheckpoint() {
  const server = activeServer.value

  if (!server) return

  fetchingCheckpoint.value = true
  serverError.value = ''

  try {
    const isComfy =
      server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)
    const path = isComfy ? '/history' : '/sdapi/v1/options'
    const response = await serverStore.requestServer(server, path, {
      method: 'GET',
    })

    const data = await readServerResponse(response)

    if (!response.ok) {
      serverError.value = `Server returned ${response.status}: ${response.statusText}`
      return
    }

    const found = isComfy
      ? parseComfyCheckpointFromHistory(data as Record<string, unknown>)
      : (((data as Record<string, unknown>).sd_model_checkpoint as
          | string
          | undefined) ?? null)

    if (!found) {
      serverError.value = isComfy
        ? 'Could not infer a loaded checkpoint from Comfy history yet.'
        : 'Could not determine loaded checkpoint from server response.'
      return
    }

    serverCheckpoint.value = found

    if (checkpointStore.isValidCheckpoint(found)) {
      checkpointStore.selectCheckpointByName(found)
      checkpointStore.currentApiModel = found
    }
  } catch (error) {
    serverError.value =
      error instanceof Error ? error.message : 'Failed to reach server.'
  } finally {
    fetchingCheckpoint.value = false
  }
}
async function applyCheckpoint() {
  if (!activeServer.value || !pendingCheckpoint.value) return

  applyingCheckpoint.value = true
  serverError.value = ''

  try {
    const server = activeServer.value
    const name = pendingCheckpoint.value
    const isComfy =
      server.serverType === 'COMFY' || Boolean(server.supportsComfyWorkflow)

    if (isComfy) {
      checkpointStore.selectCheckpointByName(name)
      checkpointStore.currentApiModel = name
      serverCheckpoint.value = name
      pendingCheckpoint.value = ''
      return
    }

    const response = await serverStore.requestServer(
      server,
      '/sdapi/v1/options',
      {
        method: 'POST',
        body: JSON.stringify({ sd_model_checkpoint: name }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      serverError.value = `Failed to apply checkpoint: ${response.status} ${response.statusText}`
      return
    }

    checkpointStore.selectCheckpointByName(name)
    checkpointStore.currentApiModel = name
    serverCheckpoint.value = name
    pendingCheckpoint.value = ''
  } catch (error) {
    serverError.value =
      error instanceof Error ? error.message : 'Failed to apply checkpoint.'
  } finally {
    applyingCheckpoint.value = false
  }
}

async function deleteActiveServer() {
  const server = activeServer.value

  if (!server?.id || !canDeleteActiveServer.value) return

  const confirmed = window.confirm(
    `Delete "${server.label || server.title}"? This only deletes your private saved server.`,
  )

  if (!confirmed) return

  deletingServer.value = true
  serverError.value = ''

  try {
    const result = await serverStore.deleteServer(server.id)

    if (!result.success) {
      serverError.value = result.message ?? 'Could not delete server.'
      return
    }

    selectedServerId.value = null
    await serverStore.setActiveArtServer(null)
    resetRuntimeState()
  } catch (error) {
    serverError.value =
      error instanceof Error ? error.message : 'Could not delete server.'
  } finally {
    deletingServer.value = false
  }
}

watch(
  () => serverStore.activeArtServer?.id,
  (id) => {
    selectedServerId.value = typeof id === 'number' ? id : null
  },
)

onMounted(async () => {
  if (!serverStore.isInitialized) await serverStore.initialize()
  checkpointStore.initialize()

  selectedServerId.value = serverStore.activeArtServer?.id ?? null
})
</script>

<style scoped>
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.fade-expand-enter-to,
.fade-expand-leave-from {
  opacity: 1;
  max-height: 48rem;
}
</style>
