<!-- /components/server/text-servers.vue -->
<template>
  <section
    class="flex w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-base-content sm:p-4"
  >
    <header
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10"
        >
          <icon name="kind-icon:chat" class="h-6 w-6 text-secondary" />
        </div>

        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-secondary">
            Text Server
          </h2>
          <p class="text-xs text-base-content/60">
            Choose a chat engine, clone it, tune it, ask it questions with
            unreasonable confidence.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary rounded-xl"
        @click="openEditor"
      >
        <icon name="kind-icon:wrench" class="h-4 w-4" />
        Customize
      </button>
    </header>

    <div class="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
      <select
        v-model="selectedServerId"
        class="select select-bordered w-full rounded-xl"
        @change="selectServer"
      >
        <option :value="null">Use default text server</option>

        <option
          v-for="option in serverStore.textServerOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}{{ option.isDefault ? ' default' : '' }}
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
          <span class="text-sm font-bold">
            {{ activeServer.lastStatus ?? 'UNKNOWN' }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="healthDetails"
      class="rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="text-sm font-black text-info">Inspect Output</div>
          <p class="text-xs text-base-content/60">
            Browser health check report for
            {{
              activeServer?.label || activeServer?.title || 'selected server'
            }}
          </p>
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="healthDetails = null"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>

      <div class="grid grid-cols-1 gap-2 md:grid-cols-4">
        <div class="rounded-xl border border-base-300 bg-base-100 p-2">
          <div class="text-[10px] font-black uppercase text-base-content/50">
            Status
          </div>
          <div class="text-sm font-bold">
            {{ healthDetails.data?.status ?? 'n/a' }}
            {{ healthDetails.data?.statusText ?? '' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100 p-2">
          <div class="text-[10px] font-black uppercase text-base-content/50">
            OK
          </div>
          <div class="text-sm font-bold">
            {{ healthDetails.data?.ok ? 'Yes' : 'No' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100 p-2">
          <div class="text-[10px] font-black uppercase text-base-content/50">
            Runtime
          </div>
          <div class="text-sm font-bold">
            {{ healthDetails.data?.runLocation ?? 'unknown' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100 p-2">
          <div class="text-[10px] font-black uppercase text-base-content/50">
            Latency
          </div>
          <div class="text-sm font-bold">
            {{ healthDetails.data?.latencyMs ?? 0 }}ms
          </div>
        </div>
      </div>

      <pre
        class="mt-3 max-h-96 overflow-auto rounded-2xl bg-neutral p-3 text-xs text-neutral-content"
        >{{ formattedHealthDetails }}</pre
      >
    </div>

    <Transition name="fade-expand">
      <form
        v-if="showEditor"
        class="grid grid-cols-1 gap-3 rounded-2xl border border-secondary/30 bg-base-200 p-3 md:grid-cols-2"
        @submit.prevent="saveCustomServer"
      >
        <div class="flex items-center justify-between gap-3 md:col-span-2">
          <div>
            <h3 class="text-base font-black text-secondary">
              Custom Text Server
            </h3>
            <p class="text-xs text-base-content/60">
              Saving creates a private user server. The original server is safe
              from your experiments.
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
            placeholder="My Local LLM"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Label</span>
          <input
            v-model="form.label"
            type="text"
            class="input input-bordered rounded-xl"
            placeholder="Llama Local"
          />
        </label>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Base URL</span>
          <input
            v-model="form.baseUrl"
            type="url"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="https://text.example.com"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Server Type</span>
          <select
            v-model="form.serverType"
            class="select select-bordered rounded-xl"
            @change="syncCapabilities"
          >
            <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
            <option value="TEXT">TEXT</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Health Path</span>
          <input
            v-model="form.healthPath"
            type="text"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="/v1/models"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Endpoint Path</span>
          <input
            v-model="form.endpointPath"
            type="text"
            class="input input-bordered rounded-xl font-mono text-sm"
            placeholder="/v1/chat/completions"
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

        <label class="form-control">
          <span class="label-text font-bold">Access Mode</span>
          <select
            v-model="form.accessMode"
            class="select select-bordered rounded-xl"
          >
            <option value="LOCAL">LOCAL</option>
            <option value="TAILSCALE">TAILSCALE</option>
            <option value="PUBLIC_OIDC">PUBLIC_OIDC</option>
            <option value="PUBLIC_PROTECTED">PUBLIC_PROTECTED</option>
            <option value="PUBLIC_OPEN">PUBLIC_OPEN</option>
          </select>
        </label>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Description</span>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered rounded-xl"
            rows="2"
            placeholder="OpenAI-compatible text endpoint."
          />
        </label>

        <div
          class="grid grid-cols-1 gap-2 md:col-span-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Chat Support</span>
            <input
              v-model="form.supportsChat"
              type="checkbox"
              class="toggle toggle-secondary toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Requires API Key</span>
            <input
              v-model="form.requiresApiKey"
              type="checkbox"
              class="toggle toggle-secondary toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Browser Calls</span>
            <input
              v-model="form.allowBrowserRequests"
              type="checkbox"
              class="toggle toggle-success toggle-sm"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Browser Test</span>
            <input
              v-model="form.requiresClientSideCheck"
              type="checkbox"
              class="toggle toggle-info toggle-sm"
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

          <label
            class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3"
          >
            <span class="label-text text-xs font-bold">Use OIDC</span>
            <input
              v-model="form.useOidc"
              type="checkbox"
              class="toggle toggle-secondary toggle-sm"
            />
          </label>
        </div>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">OIDC Provider</span>
          <input
            v-model="form.oidcProvider"
            type="text"
            class="input input-bordered rounded-xl"
            placeholder="authelia"
          />
        </label>

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
  type ServerHealthResponse,
  type ServerType,
} from '@/stores/serverStore'

const serverStore = useServerStore()

const selectedServerId = ref<number | null>(
  serverStore.activeTextServer?.id ?? null,
)
const showEditor = ref(false)
const pinging = ref(false)
const pingStatus = ref<'idle' | 'ok' | 'fail'>('idle')
const message = ref('')
const messageSuccess = ref(false)
const serverError = ref('')
const healthDetails = ref<ServerHealthResponse | null>(null)
const form = ref<Partial<Server>>({})

const activeServer = computed(() =>
  selectedServerId.value !== null
    ? serverStore.getServerById(selectedServerId.value)
    : serverStore.activeTextServer,
)

const canSave = computed(() => {
  return Boolean(form.value.title?.trim() && form.value.baseUrl?.trim())
})

const formattedHealthDetails = computed(() => {
  if (!healthDetails.value) return ''

  return JSON.stringify(
    {
      success: healthDetails.value.success,
      message: healthDetails.value.message,
      statusCode: healthDetails.value.statusCode,
      data: healthDetails.value.data,
    },
    null,
    2,
  )
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

function resetRuntimeState() {
  pingStatus.value = 'idle'
  message.value = ''
  messageSuccess.value = false
  serverError.value = ''
  healthDetails.value = null
}

async function selectServer() {
  await serverStore.setActiveTextServer(selectedServerId.value)
  resetRuntimeState()
}

async function pingServer() {
  if (!activeServer.value) return

  pinging.value = true
  pingStatus.value = 'idle'
  serverError.value = ''
  healthDetails.value = null

  try {
    const result = await serverStore.testServerHealth(activeServer.value.id)

    healthDetails.value = result
    pingStatus.value = result.success && result.data?.ok ? 'ok' : 'fail'

    if (!result.success || !result.data?.ok) {
      serverError.value = result.message || 'Server health check failed.'
    }
  } catch (error) {
    pingStatus.value = 'fail'
    serverError.value =
      error instanceof Error ? error.message : 'Failed to inspect server.'
  } finally {
    pinging.value = false
  }
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
        category: source.category,
        serverType: source.serverType,
        baseUrl: source.baseUrl,
        endpointPath: source.endpointPath,
        healthPath: source.healthPath,
        requiresApiKey: source.requiresApiKey,
        apiKeyName: source.apiKeyName,
        supportsTxt2Img: source.supportsTxt2Img,
        supportsImg2Img: source.supportsImg2Img,
        supportsChat: source.supportsChat,
        supportsComfyWorkflow: source.supportsComfyWorkflow,
        supportsCheckpointOverride: source.supportsCheckpointOverride,
        supportsSampler: source.supportsSampler,
        supportsNegativePrompt: source.supportsNegativePrompt,
        supportsSeed: source.supportsSeed,
        supportsSteps: source.supportsSteps,
        allowBrowserRequests: source.allowBrowserRequests ?? true,
        requiresClientSideCheck: source.requiresClientSideCheck ?? true,
        isPrivateNetwork: source.isPrivateNetwork ?? true,
        accessMode: source.accessMode ?? 'TAILSCALE',
        useOidc: source.useOidc,
        oidcProvider: source.oidcProvider,
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
    category: 'text',
    serverType: 'OPENAI_COMPATIBLE',
    baseUrl: '',
    endpointPath: '/v1/chat/completions',
    healthPath: '/v1/models',
    isActive: true,
    requiresApiKey: false,
    apiKeyName: '',
    supportsTxt2Img: false,
    supportsImg2Img: false,
    supportsChat: true,
    supportsComfyWorkflow: false,
    supportsCheckpointOverride: false,
    supportsSampler: false,
    supportsNegativePrompt: false,
    supportsSeed: false,
    supportsSteps: false,
    allowBrowserRequests: true,
    requiresClientSideCheck: true,
    accessMode: 'TAILSCALE',
    isPrivateNetwork: true,
    useOidc: false,
    oidcProvider: '',
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

  if (type === 'OPENAI_COMPATIBLE') {
    form.value.endpointPath = form.value.endpointPath || '/v1/chat/completions'
    form.value.healthPath = form.value.healthPath || '/v1/models'
    form.value.supportsChat = true
    form.value.supportsTxt2Img = false
    form.value.supportsImg2Img = false
    form.value.supportsComfyWorkflow = false
    form.value.supportsCheckpointOverride = false
    form.value.supportsSampler = false
    form.value.supportsNegativePrompt = false
    form.value.supportsSeed = false
    form.value.supportsSteps = false
  }

  if (type === 'TEXT') {
    form.value.endpointPath = form.value.endpointPath || '/v1/chat/completions'
    form.value.healthPath = form.value.healthPath || '/health'
    form.value.supportsChat = true
    form.value.supportsTxt2Img = false
    form.value.supportsImg2Img = false
    form.value.supportsComfyWorkflow = false
    form.value.supportsCheckpointOverride = false
    form.value.supportsSampler = false
    form.value.supportsNegativePrompt = false
    form.value.supportsSeed = false
    form.value.supportsSteps = false
  }
}

async function saveCustomServer() {
  message.value = ''
  messageSuccess.value = false
  serverError.value = ''

  const result = await serverStore.saveServerAsUserCopy(
    selectedServerId.value,
    form.value,
    'text',
  )

  message.value =
    result.message || (result.success ? 'Server saved.' : 'Server save failed.')
  messageSuccess.value = result.success

  if (!result.success) {
    serverError.value = message.value
    return
  }

  if (result.data) {
    selectedServerId.value = result.data.id
    await serverStore.setActiveTextServer(result.data.id)
    showEditor.value = false
    resetRuntimeState()
  }
}

watch(
  () => serverStore.activeTextServer?.id,
  (id) => {
    selectedServerId.value = typeof id === 'number' ? id : null
  },
)

onMounted(async () => {
  await serverStore.initialize({
    fetchRemote: true,
  })

  selectedServerId.value = serverStore.activeTextServer?.id ?? null
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
