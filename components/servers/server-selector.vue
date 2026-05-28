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
        class="modal-box flex max-h-[90vh] w-11/12 max-w-5xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:server" class="h-5 w-5 text-primary" />

              <h2 class="text-lg font-black text-base-content">Server Setup</h2>
            </div>

            <p class="mt-1 text-sm text-base-content/60">
              Choose one art route and one text route. This updates your saved
              personal defaults instead of spawning goblin clones.
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

        <section
          v-if="statusMessage"
          class="rounded-2xl border p-3 text-sm font-semibold"
          :class="statusClass"
        >
          {{ statusMessage }}
        </section>

        <section
          v-if="isLoading"
          class="flex items-center gap-2 rounded-2xl border border-info/30 bg-info/10 p-3 text-sm font-semibold text-info"
        >
          <span class="loading loading-spinner loading-xs" />
          Loading servers.
        </section>

        <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <form
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            autocomplete="off"
            @submit.prevent="saveArtServer"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
              >
                <Icon name="kind-icon:palette" class="h-7 w-7 text-primary" />
              </div>

              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-base-content/45"
                >
                  Art
                </p>

                <h3 class="truncate text-lg font-black text-base-content">
                  {{ artTitle }}
                </h3>

                <p class="text-sm text-base-content/60">
                  OpenAI images, Stable Diffusion, or Comfy.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                v-for="option in artOptions"
                :key="option.value"
                class="btn min-h-16 rounded-2xl justify-start text-left"
                :class="
                  artMode === option.value
                    ? 'btn-primary text-white'
                    : 'btn-ghost border border-base-300 bg-base-100'
                "
                type="button"
                @click="selectArtMode(option.value)"
              >
                <Icon :name="option.icon" class="h-5 w-5 shrink-0" />

                <span class="min-w-0">
                  <span class="block truncate font-black">
                    {{ option.label }}
                  </span>
                </span>
              </button>
            </div>

            <div class="flex flex-col gap-3 rounded-2xl bg-base-100 p-3">
              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">Friendly name</span>
                </span>

                <input
                  v-model="artName"
                  class="input input-bordered rounded-xl bg-base-200"
                  type="text"
                  autocomplete="off"
                  placeholder="My art server"
                />
              </label>

              <label v-if="artNeedsApiKey" class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">API key</span>
                </span>

                <input
                  v-model="artApiKey"
                  class="input input-bordered rounded-xl bg-base-200"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Paste API key"
                />
              </label>

              <template v-if="artNeedsUrl">
                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Server URL</span>
                  </span>

                  <input
                    v-model="artUrl"
                    class="input input-bordered rounded-xl bg-base-200"
                    type="url"
                    autocomplete="off"
                    placeholder="https://your-server.example.com"
                  />
                </label>

                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Connection</span>
                  </span>

                  <select
                    v-model="artAccessMode"
                    class="select select-bordered rounded-xl bg-base-200"
                    autocomplete="off"
                  >
                    <option value="LOCAL">Open / browser accessible</option>
                    <option value="TAILSCALE">Tailscale</option>
                    <option value="PUBLIC_PROTECTED">
                      Protected public URL
                    </option>
                  </select>
                </label>
              </template>

              <button
                class="btn btn-primary rounded-2xl text-white"
                type="submit"
                :disabled="isSavingArt || !canSaveArt"
              >
                <span
                  v-if="isSavingArt"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:check" class="h-4 w-4" />
                Save Art Settings
              </button>
            </div>

            <section
              v-if="artMode === 'comfy'"
              class="rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <div class="mb-2 flex items-center gap-2">
                <Icon name="kind-icon:workflow" class="h-5 w-5 text-primary" />

                <h3 class="font-black text-base-content">
                  Comfy Workflow Family
                </h3>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  class="btn rounded-2xl"
                  :class="
                    comfyModelFamily === 'sdxl'
                      ? 'btn-primary text-white'
                      : 'btn-ghost border border-base-300 bg-base-200'
                  "
                  type="button"
                  @click="comfyModelFamily = 'sdxl'"
                >
                  <Icon name="kind-icon:checkpoint" class="h-4 w-4" />
                  SDXL
                </button>

                <button
                  class="btn rounded-2xl"
                  :class="
                    comfyModelFamily === 'flux'
                      ? 'btn-primary text-white'
                      : 'btn-ghost border border-base-300 bg-base-200'
                  "
                  type="button"
                  @click="comfyModelFamily = 'flux'"
                >
                  <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                  Flux
                </button>
              </div>
            </section>

            <checkpoint-gallery
              v-if="showArtCheckpoint"
              variant="dropdown"
              :title="checkpointTitle"
              :subtitle="checkpointSubtitle"
              :model-family="checkpointModelFamily"
              :show-header="false"
              :show-sampler="artMode === 'sd'"
              :show-status="false"
              :allow-add="true"
              :allow-refresh="true"
              :auto-load="true"
            />
          </form>

          <form
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            autocomplete="off"
            @submit.prevent="saveTextServer"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10"
              >
                <Icon name="kind-icon:chat" class="h-7 w-7 text-secondary" />
              </div>

              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-base-content/45"
                >
                  Text
                </p>

                <h3 class="truncate text-lg font-black text-base-content">
                  {{ textTitle }}
                </h3>

                <p class="text-sm text-base-content/60">
                  OpenAI, Anthropic, or Ollama.
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                v-for="option in textOptions"
                :key="option.value"
                class="btn min-h-16 rounded-2xl justify-start text-left"
                :class="
                  textMode === option.value
                    ? 'btn-secondary text-white'
                    : 'btn-ghost border border-base-300 bg-base-100'
                "
                type="button"
                @click="selectTextMode(option.value)"
              >
                <Icon :name="option.icon" class="h-5 w-5 shrink-0" />

                <span class="min-w-0">
                  <span class="block truncate font-black">
                    {{ option.label }}
                  </span>
                </span>
              </button>
            </div>

            <div class="flex flex-col gap-3 rounded-2xl bg-base-100 p-3">
              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">Friendly name</span>
                </span>

                <input
                  v-model="textName"
                  class="input input-bordered rounded-xl bg-base-200"
                  type="text"
                  autocomplete="off"
                  placeholder="My text server"
                />
              </label>

              <label v-if="textNeedsApiKey" class="form-control">
                <span class="label py-1">
                  <span class="label-text font-bold">API key</span>
                </span>

                <input
                  v-model="textApiKey"
                  class="input input-bordered rounded-xl bg-base-200"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Paste API key"
                />
              </label>

              <template v-if="textNeedsUrl">
                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Ollama URL</span>
                  </span>

                  <input
                    v-model="textUrl"
                    class="input input-bordered rounded-xl bg-base-200"
                    type="url"
                    autocomplete="off"
                    placeholder="http://localhost:11434"
                  />
                </label>

                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text font-bold">Connection</span>
                  </span>

                  <select
                    v-model="textAccessMode"
                    class="select select-bordered rounded-xl bg-base-200"
                    autocomplete="off"
                  >
                    <option value="LOCAL">Open / browser accessible</option>
                    <option value="TAILSCALE">Tailscale</option>
                    <option value="PUBLIC_PROTECTED">
                      Protected public URL
                    </option>
                  </select>
                </label>
              </template>

              <button
                class="btn btn-secondary rounded-2xl text-white"
                type="submit"
                :disabled="isSavingText || !canSaveText"
              >
                <span
                  v-if="isSavingText"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:check" class="h-4 w-4" />
                Save Text Settings
              </button>
            </div>
          </form>
        </section>

        <footer
          class="flex flex-col gap-2 border-t border-base-300 pt-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <NuxtLink
            to="/server-manager"
            class="btn btn-sm btn-outline rounded-xl"
            @click="closeSelector"
          >
            <Icon name="kind-icon:settings" class="h-4 w-4" />
            Server Manager
          </NuxtLink>

          <div class="flex flex-wrap gap-2 sm:justify-end">
            <button
              class="btn btn-sm btn-ghost rounded-xl"
              type="button"
              :disabled="isLoading"
              @click="refreshServers(true)"
            >
              <span
                v-if="isLoading"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
              Refresh
            </button>

            <button
              class="btn btn-sm btn-primary rounded-xl text-white"
              type="button"
              @click="closeSelector"
            >
              Done
            </button>
          </div>
        </footer>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeSelector">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type {
  Server,
  ServerAccessMode,
  ServerType,
} from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type ArtMode = 'openai' | 'sd' | 'comfy'
type TextMode = 'openai' | 'anthropic' | 'ollama'
type ComfyModelFamily = 'sdxl' | 'flux'

type SelectorOption<T extends string> = {
  value: T
  label: string
  icon: string
}

const serverStore = useServerStore()
const userStore = useUserStore()

const selectorDialog = ref<HTMLDialogElement | null>(null)
const isLoading = ref(false)
const isSavingArt = ref(false)
const isSavingText = ref(false)
const statusMessage = ref('')
const statusTone = ref<'info' | 'success' | 'warning' | 'error'>('info')

const artMode = ref<ArtMode>('sd')
const textMode = ref<TextMode>('openai')
const comfyModelFamily = ref<ComfyModelFamily>('sdxl')

const artName = ref('Stable Diffusion')
const artApiKey = ref('')
const artUrl = ref('')
const artAccessMode = ref<ServerAccessMode>('TAILSCALE')

const textName = ref('OpenAI')
const textApiKey = ref('')
const textUrl = ref('')
const textAccessMode = ref<ServerAccessMode>('LOCAL')

const artOptions: SelectorOption<ArtMode>[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    icon: 'kind-icon:image',
  },
  {
    value: 'sd',
    label: 'Stable Diffusion',
    icon: 'kind-icon:palette',
  },
  {
    value: 'comfy',
    label: 'Comfy',
    icon: 'kind-icon:workflow',
  },
]

const textOptions: SelectorOption<TextMode>[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    icon: 'kind-icon:chat',
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    icon: 'kind-icon:brain',
  },
  {
    value: 'ollama',
    label: 'Ollama',
    icon: 'kind-icon:server',
  },
]

const statusClass = computed(() => {
  if (statusTone.value === 'success') {
    return 'border-success/30 bg-success/10 text-success'
  }

  if (statusTone.value === 'warning') {
    return 'border-warning/30 bg-warning/10 text-warning'
  }

  if (statusTone.value === 'error') {
    return 'border-error/30 bg-error/10 text-error'
  }

  return 'border-info/30 bg-info/10 text-info'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const artTitle = computed(() => {
  if (artMode.value === 'openai') return 'OpenAI Art'
  if (artMode.value === 'sd') return 'Stable Diffusion'
  return 'Comfy'
})

const textTitle = computed(() => {
  if (textMode.value === 'openai') return 'OpenAI'
  if (textMode.value === 'anthropic') return 'Anthropic'
  return 'Ollama'
})

const artNeedsApiKey = computed(() => {
  return artMode.value === 'openai'
})

const artNeedsUrl = computed(() => {
  return artMode.value === 'sd' || artMode.value === 'comfy'
})

const textNeedsApiKey = computed(() => {
  return textMode.value === 'openai' || textMode.value === 'anthropic'
})

const textNeedsUrl = computed(() => {
  return textMode.value === 'ollama'
})

const canSaveArt = computed(() => {
  if (artNeedsApiKey.value) return Boolean(artApiKey.value.trim())
  if (artNeedsUrl.value) return Boolean(artUrl.value.trim())
  return false
})

const canSaveText = computed(() => {
  if (textNeedsApiKey.value) return Boolean(textApiKey.value.trim())
  if (textNeedsUrl.value) return Boolean(textUrl.value.trim())
  return false
})

const personalServers = computed(() => {
  return serverStore.servers
    .filter(isPersonalConfiguredServer)
    .filter((server) => !isBackendServer(server))
    .sort(sortServers)
})

const visibleArtServers = computed(() => {
  return personalServers.value.filter(isArtServer)
})

const visibleTextServers = computed(() => {
  return personalServers.value.filter(isTextServer)
})

const showArtCheckpoint = computed(() => {
  return artMode.value === 'sd' || artMode.value === 'comfy'
})

const checkpointModelFamily = computed(() => {
  if (artMode.value === 'comfy') return comfyModelFamily.value
  return 'sdxl'
})

const checkpointTitle = computed(() => {
  if (artMode.value === 'comfy') {
    return comfyModelFamily.value === 'flux'
      ? 'Comfy Flux Checkpoint'
      : 'Comfy SDXL Checkpoint'
  }

  return 'Stable Diffusion Checkpoint'
})

const checkpointSubtitle = computed(() => {
  if (artMode.value === 'comfy') {
    return comfyModelFamily.value === 'flux'
      ? 'Choose a Flux-compatible resource for Comfy workflows.'
      : 'Choose an SDXL-compatible resource for Comfy workflows.'
  }

  return 'Choose the Stable Diffusion checkpoint used for image generation.'
})

watch(
  () => serverStore.activeArtServer?.id,
  () => {
    hydrateModesFromActiveServers()
  },
)

watch(
  () => serverStore.activeTextServer?.id,
  () => {
    hydrateModesFromActiveServers()
  },
)

function openSelector() {
  hydrateModesFromActiveServers()
  serverStore.setCurrentServerMode('art')
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
  serverStore.setCurrentServerMode('art')
}

async function refreshServers(force = false) {
  isLoading.value = true

  try {
    await serverStore.initialize({
      force,
      fetchRemote: true,
    })

    hydrateModesFromActiveServers()
  } finally {
    isLoading.value = false
  }
}

function hydrateModesFromActiveServers() {
  const artServer = serverStore.activeArtServer
  const textServer = serverStore.activeTextServer

  if (artServer && isPersonalConfiguredServer(artServer)) {
    artMode.value = artModeFromServer(artServer)
    hydrateArtForm(artServer)
  } else if (visibleArtServers.value[0]) {
    artMode.value = artModeFromServer(visibleArtServers.value[0])
    hydrateArtForm(visibleArtServers.value[0])
  }

  if (textServer && isPersonalConfiguredServer(textServer)) {
    textMode.value = textModeFromServer(textServer)
    hydrateTextForm(textServer)
  } else if (visibleTextServers.value[0]) {
    textMode.value = textModeFromServer(visibleTextServers.value[0])
    hydrateTextForm(visibleTextServers.value[0])
  }
}

function selectArtMode(mode: ArtMode) {
  artMode.value = mode
  statusMessage.value = ''

  const existing = findCurrentArtServerForMode()

  if (existing) {
    void activateArtServer(existing.id)
    hydrateArtForm(existing)
    return
  }

  if (mode === 'openai') {
    artName.value = 'OpenAI Art'
    artUrl.value = ''
    artApiKey.value = ''
    return
  }

  if (mode === 'sd') {
    artName.value = 'Stable Diffusion'
    artUrl.value = ''
    artAccessMode.value = 'TAILSCALE'
    return
  }

  artName.value = 'Comfy'
  artUrl.value = ''
  artAccessMode.value = 'TAILSCALE'
  comfyModelFamily.value = 'sdxl'
}

function selectTextMode(mode: TextMode) {
  textMode.value = mode
  statusMessage.value = ''

  const existing = findCurrentTextServerForMode()

  if (existing) {
    void activateTextServer(existing.id)
    hydrateTextForm(existing)
    return
  }

  if (mode === 'openai') {
    textName.value = 'OpenAI'
    textUrl.value = ''
    textApiKey.value = ''
    return
  }

  if (mode === 'anthropic') {
    textName.value = 'Anthropic'
    textUrl.value = ''
    textApiKey.value = ''
    return
  }

  textName.value = 'Ollama'
  textUrl.value = ''
  textAccessMode.value = 'LOCAL'
}

function hydrateArtForm(server: Server) {
  artName.value = server.title || server.label || artName.value
  artUrl.value = server.browserBaseUrl || server.baseUrl || artUrl.value
  artAccessMode.value = server.accessMode || artAccessMode.value
}

function hydrateTextForm(server: Server) {
  textName.value = server.title || server.label || textName.value
  textUrl.value = server.browserBaseUrl || server.baseUrl || textUrl.value
  textAccessMode.value = server.accessMode || textAccessMode.value
}

async function activateArtServer(id: number) {
  const result = await serverStore.setActiveArtServer(id)

  if (!result.success) {
    setStatus(result.message || 'Could not activate art server.', 'error')
    return
  }

  serverStore.setCurrentServerMode('art')
  serverStore.setCurrentServer(id)
  setStatus(result.message || 'Art server activated.', 'success')
}

async function activateTextServer(id: number) {
  const result = await serverStore.setActiveTextServer(id)

  if (!result.success) {
    setStatus(result.message || 'Could not activate text server.', 'error')
    return
  }

  serverStore.setCurrentServerMode('text')
  serverStore.setCurrentServer(id)
  setStatus(result.message || 'Text server activated.', 'success')
}

async function saveArtServer() {
  isSavingArt.value = true

  try {
    const payload = buildArtPayload()
    const existing = findCurrentArtServerForMode()

    const result = existing
      ? await serverStore.updateServer(existing.id, payload)
      : await serverStore.addServer(payload)

    if (!result.success || !result.data) {
      setStatus(result.message || 'Could not save art server.', 'error')
      return
    }

    await serverStore.setActiveArtServer(result.data.id)
    serverStore.setCurrentServerMode('art')
    serverStore.setCurrentServer(result.data.id)

    hydrateArtForm(result.data)
    setStatus(result.message || 'Art server saved.', 'success')
  } finally {
    isSavingArt.value = false
  }
}

async function saveTextServer() {
  isSavingText.value = true

  try {
    const payload = buildTextPayload()
    const existing = findCurrentTextServerForMode()

    const result = existing
      ? await serverStore.updateServer(existing.id, payload)
      : await serverStore.addServer(payload)

    if (!result.success || !result.data) {
      setStatus(result.message || 'Could not save text server.', 'error')
      return
    }

    await serverStore.setActiveTextServer(result.data.id)
    serverStore.setCurrentServerMode('text')
    serverStore.setCurrentServer(result.data.id)

    hydrateTextForm(result.data)
    setStatus(result.message || 'Text server saved.', 'success')
  } finally {
    isSavingText.value = false
  }
}

function buildArtPayload(): Partial<Server> {
  if (artMode.value === 'openai') {
    return {
      title: cleanName(artName.value, 'OpenAI Art'),
      label: cleanName(artName.value, 'OpenAI Art'),
      category: 'personal',
      serverType: 'OPENAI_COMPATIBLE' as ServerType,
      generationEngine: 'OPENAI_IMAGE',
      baseUrl: 'https://api.openai.com',
      endpointPath: '/v1/images/generations',
      healthPath: '/v1/models',
      accessMode: 'LOCAL',
      defaultTransport: 'BROWSER',
      allowBrowserRequests: true,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      requiresApiKey: true,
      apiKeyName: 'OPENAI_API_KEY',
      apiKey: artApiKey.value.trim(),
      supportsTxt2Img: true,
      supportsImg2Img: false,
      supportsChat: false,
      supportsComfyWorkflow: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
    }
  }

  if (artMode.value === 'comfy') {
    const url = cleanUrl(artUrl.value)

    return {
      title: cleanName(artName.value, 'Comfy'),
      label: cleanName(artName.value, 'Comfy'),
      category: 'personal',
      serverType: 'COMFY' as ServerType,
      generationEngine: 'COMFY',
      baseUrl: url,
      browserBaseUrl: url,
      endpointPath: '/prompt',
      healthPath: '/system_stats',
      accessMode: artAccessMode.value,
      defaultTransport: 'BROWSER',
      allowBrowserRequests: true,
      isPrivateNetwork: artAccessMode.value === 'TAILSCALE',
      requiresClientSideCheck: artAccessMode.value === 'TAILSCALE',
      requiresApiKey: false,
      apiKeyName: null,
      apiKey: null,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsChat: false,
      supportsComfyWorkflow: true,
      supportsCheckpointOverride: true,
      supportsSampler: true,
      supportsWorkflowUpload: true,
      supportsFlux: true,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
    }
  }

  const url = cleanUrl(artUrl.value)

  return {
    title: cleanName(artName.value, 'Stable Diffusion'),
    label: cleanName(artName.value, 'Stable Diffusion'),
    category: 'personal',
    serverType: 'A1111' as ServerType,
    generationEngine: 'A1111',
    baseUrl: url,
    browserBaseUrl: url,
    endpointPath: '/sdapi/v1/txt2img',
    healthPath: '/sdapi/v1/progress',
    accessMode: artAccessMode.value,
    defaultTransport: 'BROWSER',
    allowBrowserRequests: true,
    isPrivateNetwork: artAccessMode.value === 'TAILSCALE',
    requiresClientSideCheck: artAccessMode.value === 'TAILSCALE',
    requiresApiKey: false,
    apiKeyName: null,
    apiKey: null,
    supportsTxt2Img: true,
    supportsImg2Img: true,
    supportsChat: false,
    supportsComfyWorkflow: false,
    supportsCheckpointOverride: true,
    supportsSampler: true,
    supportsNegativePrompt: true,
    supportsSeed: true,
    supportsSteps: true,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isActive: true,
    isEditable: true,
  }
}

function buildTextPayload(): Partial<Server> {
  if (textMode.value === 'openai') {
    return {
      title: cleanName(textName.value, 'OpenAI'),
      label: cleanName(textName.value, 'OpenAI'),
      category: 'personal',
      serverType: 'OPENAI_COMPATIBLE' as ServerType,
      generationEngine: 'OTHER',
      baseUrl: 'https://api.openai.com',
      endpointPath: '/v1/chat/completions',
      healthPath: '/v1/models',
      accessMode: 'LOCAL',
      defaultTransport: 'BROWSER',
      allowBrowserRequests: true,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      requiresApiKey: true,
      apiKeyName: 'OPENAI_API_KEY',
      apiKey: textApiKey.value.trim(),
      supportsChat: true,
      supportsTxt2Img: false,
      supportsImg2Img: false,
      supportsComfyWorkflow: false,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
    }
  }

  if (textMode.value === 'anthropic') {
    return {
      title: cleanName(textName.value, 'Anthropic'),
      label: cleanName(textName.value, 'Anthropic'),
      category: 'personal',
      serverType: 'TEXT' as ServerType,
      generationEngine: 'OTHER',
      baseUrl: 'https://api.anthropic.com',
      endpointPath: '/v1/messages',
      healthPath: '/v1/models',
      accessMode: 'LOCAL',
      defaultTransport: 'BROWSER',
      allowBrowserRequests: true,
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      requiresApiKey: true,
      apiKeyName: 'ANTHROPIC_API_KEY',
      apiKey: textApiKey.value.trim(),
      supportsChat: true,
      supportsTxt2Img: false,
      supportsImg2Img: false,
      supportsComfyWorkflow: false,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isActive: true,
      isEditable: true,
    }
  }

  const url = cleanUrl(textUrl.value)

  return {
    title: cleanName(textName.value, 'Ollama'),
    label: cleanName(textName.value, 'Ollama'),
    category: 'personal',
    serverType: 'TEXT' as ServerType,
    generationEngine: 'OTHER',
    baseUrl: url,
    browserBaseUrl: url,
    endpointPath: '/api/chat',
    healthPath: '/api/tags',
    accessMode: textAccessMode.value,
    defaultTransport: 'BROWSER',
    allowBrowserRequests: true,
    isPrivateNetwork: textAccessMode.value === 'TAILSCALE',
    requiresClientSideCheck: textAccessMode.value === 'TAILSCALE',
    requiresApiKey: false,
    apiKeyName: null,
    apiKey: null,
    supportsChat: true,
    supportsTxt2Img: false,
    supportsImg2Img: false,
    supportsComfyWorkflow: false,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isActive: true,
    isEditable: true,
  }
}

function findCurrentArtServerForMode(): Server | null {
  const active = serverStore.activeArtServer

  if (
    active &&
    isPersonalConfiguredServer(active) &&
    artModeFromServer(active) === artMode.value
  ) {
    return active
  }

  return (
    visibleArtServers.value.find((server) => {
      return artModeFromServer(server) === artMode.value
    }) || null
  )
}

function findCurrentTextServerForMode(): Server | null {
  const active = serverStore.activeTextServer

  if (
    active &&
    isPersonalConfiguredServer(active) &&
    textModeFromServer(active) === textMode.value
  ) {
    return active
  }

  return (
    visibleTextServers.value.find((server) => {
      return textModeFromServer(server) === textMode.value
    }) || null
  )
}

function isPersonalConfiguredServer(server: Server) {
  if (serverStore.isServerHidden(server.id)) return false
  if (server.isOfficial || server.isDefault || server.isPublic) return false
  if (isBackendServer(server)) return false

  return Boolean(currentUserId.value && server.userId === currentUserId.value)
}

function isBackendServer(server: Server) {
  const values = [
    server.title,
    server.label,
    server.category,
    server.defaultTransport,
    server.accessMode,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())

  return values.some(
    (value) => value === 'backend' || value.includes('backend'),
  )
}

function isArtServer(server: Server) {
  if (
    server.supportsChat &&
    !server.supportsTxt2Img &&
    !server.supportsImg2Img &&
    !server.supportsComfyWorkflow
  ) {
    return false
  }

  return (
    server.serverType === 'ART' ||
    server.serverType === 'A1111' ||
    server.serverType === 'COMFY' ||
    server.generationEngine === 'A1111' ||
    server.generationEngine === 'COMFY' ||
    server.generationEngine === 'OPENAI_IMAGE' ||
    Boolean(server.supportsTxt2Img) ||
    Boolean(server.supportsImg2Img) ||
    Boolean(server.supportsComfyWorkflow)
  )
}

function isTextServer(server: Server) {
  if (isArtServer(server) && !server.supportsChat) return false

  return (
    server.serverType === 'TEXT' ||
    (server.serverType === 'OPENAI_COMPATIBLE' &&
      Boolean(server.supportsChat)) ||
    Boolean(server.supportsChat)
  )
}

function artModeFromServer(server: Server): ArtMode {
  const haystack = serverHaystack(server)

  if (
    server.generationEngine === 'OPENAI_IMAGE' ||
    haystack.includes('openai images') ||
    haystack.includes('openai art') ||
    haystack.includes('images/generations')
  ) {
    return 'openai'
  }

  if (
    server.serverType === 'COMFY' ||
    server.generationEngine === 'COMFY' ||
    Boolean(server.supportsComfyWorkflow)
  ) {
    return 'comfy'
  }

  return 'sd'
}

function textModeFromServer(server: Server): TextMode {
  const haystack = serverHaystack(server)

  if (haystack.includes('anthropic') || haystack.includes('claude')) {
    return 'anthropic'
  }

  if (haystack.includes('ollama') || haystack.includes('/api/chat')) {
    return 'ollama'
  }

  return 'openai'
}

function serverHaystack(server: Server) {
  return [
    server.title,
    server.label,
    server.description,
    server.category,
    server.serverType,
    server.generationEngine,
    server.baseUrl,
    server.browserBaseUrl,
    server.endpointPath,
    server.healthPath,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function sortServers(left: Server, right: Server) {
  return serverTitle(left)
    .toLowerCase()
    .localeCompare(serverTitle(right).toLowerCase())
}

function serverTitle(server: Server) {
  return server.title || server.label || `Server ${server.id}`
}

function cleanName(value: string, fallback: string) {
  const cleaned = value.trim()
  return cleaned || fallback
}

function cleanUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function setStatus(message: string, tone: typeof statusTone.value = 'info') {
  statusMessage.value = message
  statusTone.value = tone
}

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await refreshServers()
    return
  }

  hydrateModesFromActiveServers()
})
</script>
