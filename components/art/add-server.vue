<!-- /components/server/add-server.vue -->
<template>
  <div
    class="flex max-h-[min(720px,86vh)] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <div
      v-if="isCloning"
      class="flex shrink-0 items-start gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3"
    >
      <Icon
        name="kind-icon:copy"
        class="mt-0.5 h-4 w-4 shrink-0 text-warning"
      />
      <div>
        <p class="text-xs font-black">Creating a personal copy</p>
        <p class="mt-0.5 text-[11px] opacity-70">
          The original is unchanged. Only you can see this version.
        </p>
      </div>
    </div>

    <div
      class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-4 py-3"
    >
      <div>
        <h2 class="text-sm font-black">
          {{
            isCloning
              ? 'Customize Server'
              : serverStore.serverForm.id
                ? 'Edit Server'
                : 'Configure Server'
          }}
        </h2>
        <p class="mt-0.5 text-[11px] opacity-55">{{ subtitle }}</p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle shrink-0"
        @click="emit('close')"
      >
        <Icon name="kind-icon:x" class="h-4 w-4" />
      </button>
    </div>

    <form
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300"
      @submit.prevent="handleSave"
    >
      <fieldset
        class="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-200 p-4"
      >
        <legend
          class="px-1 text-[10px] font-black uppercase tracking-widest opacity-45"
        >
          Quick Setup
        </legend>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Connection Mode</span>
          <select
            v-model="serverStore.serverForm.accessMode"
            class="select select-bordered select-sm rounded-xl text-xs"
            @change="applyAccessModePreset"
          >
            <option
              v-for="mode in accessModeOptions"
              :key="mode.value"
              :value="mode.value"
            >
              {{ mode.label }}
            </option>
          </select>
        </label>

        <div
          :class="[
            'rounded-xl border px-3 py-2 text-[11px]',
            selectedAccessModeInfo.tone,
          ]"
        >
          <div class="flex items-start gap-2">
            <Icon
              :name="selectedAccessModeInfo.icon"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
            />
            <div>
              <p class="font-black">{{ selectedAccessModeInfo.title }}</p>
              <p class="mt-0.5 opacity-70">
                {{ selectedAccessModeInfo.description }}
              </p>
            </div>
          </div>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Base URL</span>
          <div class="flex gap-1.5">
            <input
              v-model="serverStore.serverForm.baseUrl"
              class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
              :placeholder="baseUrlPlaceholder"
            />
            <button
              v-if="serverStore.serverForm.baseUrl"
              type="button"
              class="btn btn-ghost btn-sm btn-square rounded-xl"
              title="Copy URL"
              @click="copyUrl"
            >
              <Icon
                :name="copiedUrl ? 'kind-icon:check' : 'kind-icon:copy'"
                :class="['h-3.5 w-3.5', copiedUrl && 'text-success']"
              />
            </button>
          </div>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Endpoint Path</span>
          <input
            v-model="serverStore.serverForm.endpointPath"
            class="input input-bordered input-sm rounded-xl font-mono text-xs"
            placeholder="/v1/chat/completions"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Health Path</span>
          <input
            v-model="serverStore.serverForm.healthPath"
            class="input input-bordered input-sm rounded-xl font-mono text-xs"
            :placeholder="healthPathPlaceholder"
          />
        </label>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px] font-bold"
          >
            <input
              v-model="serverStore.serverForm.requiresClientSideCheck"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Browser test
          </label>

          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px] font-bold"
          >
            <input
              v-model="serverStore.serverForm.isPrivateNetwork"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Private network
          </label>

          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px] font-bold"
          >
            <input
              v-model="serverStore.serverForm.allowBrowserRequests"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Browser calls
          </label>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold opacity-70">API Key</span>
            <span
              :class="[
                'badge badge-xs',
                serverHasStoredKey ? 'badge-success' : 'badge-neutral',
              ]"
            >
              {{ serverHasStoredKey ? '🔑 Stored' : 'Not set' }}
            </span>
          </div>
          <div class="flex gap-1.5">
            <input
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              autocomplete="off"
              placeholder="Leave blank to keep existing"
              class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
            />
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl"
              :title="showApiKey ? 'Hide' : 'Show'"
              @click="showApiKey = !showApiKey"
            >
              <Icon
                :name="showApiKey ? 'kind-icon:eye-off' : 'kind-icon:eye'"
                class="h-3.5 w-3.5"
              />
            </button>
          </div>
          <input
            v-model="apiKeyName"
            class="input input-bordered input-sm rounded-xl text-xs"
            placeholder="Label: OpenAI, Groq, Stability…"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class="btn btn-outline btn-xs rounded-lg"
              :disabled="!apiKey.trim() || serverStore.isSaving"
              @click="saveKeyOnly"
            >
              Save Key Only
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg opacity-60"
              :disabled="
                !serverStore.serverForm.id || isCloning || serverStore.isSaving
              "
              @click="clearKey"
            >
              Clear Key
            </button>
          </div>
        </div>
      </fieldset>

      <details class="group overflow-hidden rounded-xl border border-base-300">
        <summary
          class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider opacity-60 hover:opacity-90"
        >
          <Icon name="kind-icon:settings" class="h-3.5 w-3.5" />
          More Settings
          <Icon
            name="kind-icon:chevron-down"
            class="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
          />
        </summary>

        <div class="flex flex-col gap-3 p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">Title</span>
              <input
                v-model="serverStore.serverForm.title"
                class="input input-bordered input-sm rounded-xl text-xs"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">Label</span>
              <input
                v-model="serverStore.serverForm.label"
                class="input input-bordered input-sm rounded-xl text-xs"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">Server Type</span>
              <select
                v-model="serverStore.serverForm.serverType"
                class="select select-bordered select-sm rounded-xl text-xs"
                @change="applyServerTypePreset"
              >
                <option value="TEXT">TEXT</option>
                <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
                <option value="ART">ART</option>
                <option value="COMFY">COMFY</option>
                <option value="A1111">A1111</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">Category</span>
              <input
                v-model="serverStore.serverForm.category"
                class="input input-bordered input-sm rounded-xl text-xs"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70"
                >OIDC Provider</span
              >
              <input
                v-model="serverStore.serverForm.oidcProvider"
                class="input input-bordered input-sm rounded-xl text-xs"
                placeholder="authelia"
              />
            </label>

            <label
              class="flex cursor-pointer items-end gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold"
            >
              <input
                v-model="serverStore.serverForm.useOidc"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              Use OIDC
            </label>

            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-bold opacity-70">Description</span>
              <textarea
                v-model="serverStore.serverForm.description"
                class="textarea textarea-bordered rounded-xl text-xs"
                rows="2"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <label
              v-for="toggle in capabilityToggles"
              :key="toggle.key"
              class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold hover:border-primary/40"
            >
              <input
                v-model="(serverStore.serverForm as any)[toggle.key]"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              {{ toggle.label }}
            </label>
          </div>
        </div>
      </details>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm flex-1 rounded-xl"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary btn-sm flex-1 gap-1.5 rounded-xl"
          :disabled="serverStore.isSaving"
        >
          <span
            v-if="serverStore.isSaving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:save" class="h-3.5 w-3.5" />
          {{
            isCloning
              ? 'Save My Copy'
              : serverStore.serverForm.id
                ? 'Save Changes'
                : 'Create Server'
          }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type {
  ServerAccessMode,
  ServerType,
} from '~/prisma/generated/prisma/client'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const serverStore = useServerStore()
const userStore = useUserStore()
const myUserId = computed(() => userStore.user?.id)

const apiKey = ref('')
const apiKeyName = ref('')
const showApiKey = ref(false)
const copiedUrl = ref(false)

const accessModeOptions: Array<{
  value: ServerAccessMode
  label: string
  icon: string
  title: string
  description: string
  tone: string
}> = [
  {
    value: 'LOCAL',
    label: 'Local / LAN',
    icon: 'kind-icon:home',
    title: 'Local or LAN server',
    description: 'Best for localhost, 192.168.x.x, or same-network testing.',
    tone: 'border-info/30 bg-info/10 text-info-content',
  },
  {
    value: 'TAILSCALE',
    label: 'Tailscale, recommended',
    icon: 'kind-icon:shield',
    title: 'Private Tailscale server',
    description:
      'Best default for home AI servers. Test from the browser because your device is inside the tailnet.',
    tone: 'border-success/30 bg-success/10 text-success-content',
  },
  {
    value: 'PUBLIC_PROTECTED',
    label: 'Public protected URL',
    icon: 'kind-icon:lock',
    title: 'Public URL with protection',
    description:
      'For Traefik, Authelia, Authentik, Cloudflare Access, Pomerium, or similar gateways.',
    tone: 'border-warning/30 bg-warning/10 text-warning-content',
  },
  {
    value: 'PUBLIC_API_KEY',
    label: 'Public API key',
    icon: 'kind-icon:key',
    title: 'Public API with key',
    description:
      'For services that accept a key or bearer token. Keep browser calls off when the key must stay private.',
    tone: 'border-warning/30 bg-warning/10 text-warning-content',
  },
  {
    value: 'PUBLIC_OIDC',
    label: 'Public OIDC',
    icon: 'kind-icon:user-check',
    title: 'Public OIDC auth',
    description:
      'Advanced mode for auth providers such as Authelia. Powerful, but YAML gremlins may apply.',
    tone: 'border-secondary/30 bg-secondary/10 text-secondary-content',
  },
  {
    value: 'PUBLIC_UNPROTECTED',
    label: 'Public unprotected',
    icon: 'kind-icon:alert-triangle',
    title: 'Public and unprotected',
    description:
      'Not recommended for ComfyUI, A1111, or anything spicy. Use only for harmless endpoints.',
    tone: 'border-error/30 bg-error/10 text-error-content',
  },
]

const selectedAccessModeInfo = computed(
  () =>
    accessModeOptions.find(
      (mode) => mode.value === serverStore.serverForm.accessMode,
    ) ?? accessModeOptions[0],
)

const serverHasStoredKey = computed(() =>
  Boolean(serverStore.serverForm.apiKey),
)

const isCloning = computed(() => {
  const id = serverStore.serverForm.id
  if (!id) return false
  const server = serverStore.getServerById(id)
  if (!server) return false
  return (
    server.userId !== myUserId.value || !!server.isPublic || !!server.isOfficial
  )
})

const subtitle = computed(() => {
  if (isCloning.value)
    return 'Your edits create a private copy — original unchanged.'
  if (serverStore.serverForm.id) return 'Adjust this server configuration.'
  return `New ${serverStore.serverForm.serverType ?? 'TEXT'} server.`
})

const baseUrlPlaceholder = computed(() => {
  if (serverStore.serverForm.accessMode === 'TAILSCALE')
    return 'https://ferngrotto.foxhound-chicken.ts.net:8443'
  if (serverStore.serverForm.serverType === 'COMFY')
    return 'http://127.0.0.1:8188'
  if (serverStore.serverForm.serverType === 'A1111')
    return 'http://127.0.0.1:7860'
  return 'http://localhost:7860'
})

const healthPathPlaceholder = computed(() => {
  if (serverStore.serverForm.serverType === 'COMFY') return '/system_stats'
  if (serverStore.serverForm.serverType === 'A1111') return '/sdapi/v1/progress'
  if (serverStore.serverForm.serverType === 'OPENAI_COMPATIBLE')
    return '/v1/models'
  return '/health'
})

const capabilityToggles = [
  { key: 'supportsChat', label: 'Chat' },
  { key: 'supportsTxt2Img', label: 'Txt → Img' },
  { key: 'supportsImg2Img', label: 'Img → Img' },
  { key: 'supportsComfyWorkflow', label: 'Comfy Workflow' },
  { key: 'supportsCheckpointOverride', label: 'Checkpoint Override' },
  { key: 'supportsSampler', label: 'Sampler' },
  { key: 'supportsNegativePrompt', label: 'Negative Prompt' },
  { key: 'supportsSeed', label: 'Seed' },
  { key: 'supportsSteps', label: 'Steps' },
  { key: 'supportsVideo', label: 'Video' },
  { key: 'requiresApiKey', label: 'Requires API Key' },
  { key: 'isActive', label: 'Active' },
] as const

function applyAccessModePreset() {
  const accessMode = serverStore.serverForm.accessMode

  if (accessMode === 'TAILSCALE') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      isPublic: false,
      useOidc: false,
    }
    return
  }

  if (accessMode === 'LOCAL') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      isPublic: false,
      useOidc: false,
    }
    return
  }

  if (accessMode === 'PUBLIC_API_KEY') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      requiresApiKey: true,
      isPublic: false,
      useOidc: false,
    }
    return
  }

  if (accessMode === 'PUBLIC_OIDC') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      isPublic: false,
      useOidc: true,
      oidcProvider: serverStore.serverForm.oidcProvider || 'authelia',
    }
    return
  }

  if (accessMode === 'PUBLIC_PROTECTED') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: true,
      isPublic: false,
      useOidc: false,
    }
    return
  }

  serverStore.serverForm = {
    ...serverStore.serverForm,
    isPrivateNetwork: false,
    requiresClientSideCheck: false,
    allowBrowserRequests: true,
    isPublic: false,
  }
}

function applyServerTypePreset() {
  const serverType = serverStore.serverForm.serverType as ServerType | undefined

  if (serverType === 'COMFY') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      healthPath: serverStore.serverForm.healthPath || '/system_stats',
      supportsComfyWorkflow: true,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsSeed: true,
      supportsSteps: true,
    }
    return
  }

  if (serverType === 'A1111') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      healthPath: serverStore.serverForm.healthPath || '/sdapi/v1/progress',
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsSampler: true,
      supportsCheckpointOverride: true,
    }
    return
  }

  if (serverType === 'OPENAI_COMPATIBLE') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      healthPath: serverStore.serverForm.healthPath || '/v1/models',
      endpointPath:
        serverStore.serverForm.endpointPath || '/v1/chat/completions',
      supportsChat: true,
    }
  }
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(serverStore.serverForm.baseUrl ?? '')
    copiedUrl.value = true
    setTimeout(() => {
      copiedUrl.value = false
    }, 1500)
  } catch {}
}

async function ensurePrivateServer(): Promise<number | null> {
  if (!userStore.isLoggedIn) return null
  if (serverStore.serverForm.id && !isCloning.value)
    return serverStore.serverForm.id

  serverStore.serverForm = {
    ...serverStore.serverForm,
    id: undefined,
    userId: myUserId.value,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isEditable: true,
    apiKey: undefined,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  }
  const result = await serverStore.saveServer()
  if (!result.success || !result.data) return null
  serverStore.selectServer(result.data.id)
  return result.data.id
}

async function saveKeyOnly() {
  if (!apiKey.value.trim()) return
  const id = await ensurePrivateServer()
  if (!id) return
  await serverStore.updateServerApiKey(id, {
    apiKey: apiKey.value,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })
  apiKey.value = ''
}

async function clearKey() {
  if (!serverStore.serverForm.id || isCloning.value) return
  await serverStore.updateServerApiKey(serverStore.serverForm.id, {
    clearKey: true,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })
  apiKey.value = ''
}

async function handleSave() {
  applyAccessModePreset()

  serverStore.serverForm = {
    ...serverStore.serverForm,
    apiKey: undefined,
    apiKeyName: apiKeyName.value || serverStore.serverForm.apiKeyName || null,
  }

  const result = await serverStore.saveServer()
  if (!result.success || !result.data) return

  if (apiKey.value.trim()) {
    await serverStore.updateServerApiKey(result.data.id, {
      apiKey: apiKey.value,
      apiKeyName:
        apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
    })
  }

  emit('saved')
}

watch(
  () => serverStore.serverForm.apiKeyName,
  (val) => {
    if (!apiKeyName.value && val) apiKeyName.value = val
  },
)

watch(
  () => serverStore.serverForm.accessMode,
  () => {
    applyAccessModePreset()
  },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  if (!serverStore.serverForm.accessMode) {
    serverStore.serverForm.accessMode = 'LOCAL'
  }
  applyServerTypePreset()
  applyAccessModePreset()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}
.scrollbar-track-transparent {
  scrollbar-color: transparent transparent;
}
.scrollbar-thumb-base-300 {
  scrollbar-color: oklch(var(--b3)) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: oklch(var(--b3));
}
</style>
