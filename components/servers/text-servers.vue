<!-- /components/server/text-servers.vue -->
<template>
  <section
    class="flex w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-base-content sm:p-4"
  >
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10"
        >
          <icon name="kind-icon:chat" class="h-6 w-6 text-secondary" />
        </div>

        <div class="min-w-0">
          <h2 class="truncate text-lg font-black text-secondary">Text Server</h2>
          <p class="text-xs text-base-content/60">
            Choose a chat engine, clone it, tune it, ask it questions with unreasonable confidence.
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

    <div
      v-if="activeServer"
      class="grid grid-cols-1 gap-2 md:grid-cols-3"
    >
      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">URL</div>
        <div class="truncate font-mono text-xs">{{ activeServer.baseUrl }}</div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">Type</div>
        <div class="badge badge-sm">{{ activeServer.serverType }}</div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
        <div class="text-xs font-bold uppercase text-base-content/50">Status</div>
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-2 w-2 rounded-full"
            :class="statusClass"
          />
          <span class="text-sm font-bold">{{ activeServer.lastStatus ?? 'UNKNOWN' }}</span>
        </div>
      </div>
    </div>

    <Transition name="fade-expand">
      <form
        v-if="showEditor"
        class="grid grid-cols-1 gap-3 rounded-2xl border border-secondary/30 bg-base-200 p-3 md:grid-cols-2"
        @submit.prevent="saveCustomServer"
      >
        <div class="md:col-span-2 flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-black text-secondary">Custom Text Server</h3>
            <p class="text-xs text-base-content/60">
              Saving creates a private user server. The original server is safe from your experiments.
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
            placeholder="/health"
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

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Description</span>
          <textarea
            v-model="form.description"
            class="textarea textarea-bordered rounded-xl"
            rows="2"
            placeholder="OpenAI-compatible text endpoint."
          />
        </label>

        <div class="grid grid-cols-1 gap-2 md:col-span-2 sm:grid-cols-2">
          <label class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3">
            <span class="label-text text-xs font-bold">Chat Support</span>
            <input v-model="form.supportsChat" type="checkbox" class="toggle toggle-secondary toggle-sm" />
          </label>

          <label class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3">
            <span class="label-text text-xs font-bold">Requires API Key</span>
            <input v-model="form.requiresApiKey" type="checkbox" class="toggle toggle-secondary toggle-sm" />
          </label>
        </div>

        <div
          v-if="message"
          class="alert md:col-span-2"
          :class="messageSuccess ? 'alert-success' : 'alert-error'"
        >
          {{ message }}
        </div>

        <div class="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:justify-end">
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
            <span v-if="serverStore.isSaving" class="loading loading-spinner loading-xs" />
            <span v-else>Save Private Copy</span>
          </button>
        </div>
      </form>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useServerStore, type Server, type ServerType } from '@/stores/serverStore'

const serverStore = useServerStore()

const selectedServerId = ref<number | null>(serverStore.activeTextServer?.id ?? null)
const showEditor = ref(false)
const pinging = ref(false)
const pingStatus = ref<'idle' | 'ok' | 'fail'>('idle')
const message = ref('')
const messageSuccess = ref(false)
const form = ref<Partial<Server>>({})

const activeServer = computed(() =>
  selectedServerId.value !== null
    ? serverStore.getServerById(selectedServerId.value)
    : serverStore.activeTextServer,
)

const canSave = computed(() => {
  return Boolean(form.value.title?.trim() && form.value.baseUrl?.trim())
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
  await serverStore.setActiveTextServer(selectedServerId.value)
  pingStatus.value = 'idle'
  message.value = ''
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
        title: source.isOfficial || source.isDefault ? `${source.title} Custom` : source.title,
        label: source.label,
        description: source.description,
        category: source.category,
        serverType: source.serverType,
        baseUrl: source.baseUrl,
        endpointPath: source.endpointPath,
        healthPath: source.healthPath,
        requiresApiKey: source.requiresApiKey,
        apiKeyName: source.apiKeyName,
        supportsChat: source.supportsChat,
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
    healthPath: '/health',
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
    lastStatus: 'UNKNOWN',
  }
}

function startNewServer() {
  selectedServerId.value = null
  form.value = blankForm()
  showEditor.value = true
  pingStatus.value = 'idle'
  message.value = ''
}

function syncCapabilities() {
  const type = form.value.serverType as ServerType

  if (type === 'OPENAI_COMPATIBLE' || type === 'TEXT') {
    form.value.endpointPath = form.value.endpointPath || '/v1/chat/completions'
    form.value.healthPath = form.value.healthPath || '/health'
    form.value.supportsChat = true
    form.value.supportsTxt2Img = false
    form.value.supportsImg2Img = false
    form.value.supportsComfyWorkflow = false
  }
}

async function saveCustomServer() {
  message.value = ''
  messageSuccess.value = false

  const result = await serverStore.saveServerAsUserCopy(
    selectedServerId.value,
    form.value,
    'text',
  )

  message.value = result.message || (result.success ? 'Server saved.' : 'Server save failed.')
  messageSuccess.value = result.success

  if (result.success && result.data) {
    selectedServerId.value = result.data.id
    showEditor.value = false
  }
}

watch(
  () => serverStore.activeTextServer?.id,
  (id) => {
    selectedServerId.value = typeof id === 'number' ? id : null
  },
)

onMounted(async () => {
  if (!serverStore.isInitialized) await serverStore.initialize()

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
  max-height: 40rem;
}
</style>