<!-- /components/server/server-selector.vue -->
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
        class="modal-box flex max-h-[90vh] w-11/12 max-w-3xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:server" class="h-5 w-5 text-primary" />

              <h2 class="text-lg font-black text-base-content">
                Default Servers
              </h2>
            </div>

            <p class="mt-1 text-sm text-base-content/60">
              Pick your default art and text routes. Tiny robot switchboard,
              zero broohaha.
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
          v-if="serverStore.lastError"
          class="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning"
        >
          {{ serverStore.lastError }}
        </section>

        <section
          v-if="isLoading"
          class="flex items-center gap-2 rounded-2xl border border-info/30 bg-info/10 p-3 text-sm font-semibold text-info"
        >
          <span class="loading loading-spinner loading-xs" />
          Loading servers...
        </section>

        <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
              >
                <Icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-base-content/45"
                >
                  Art
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ activeArtLabel }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  Image generation default
                </p>
              </div>
            </div>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/50"
                >
                  Art family
                </span>
              </span>

              <select
                v-model="selectedArtFamily"
                class="select select-bordered select-sm rounded-xl bg-base-100"
              >
                <option
                  v-for="family in artFamilies"
                  :key="family.value"
                  :value="family.value"
                >
                  {{ family.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/50"
                >
                  Art server
                </span>
              </span>

              <select
                :value="artServerValue"
                class="select select-bordered rounded-xl bg-base-100"
                :disabled="isLoading || artServers.length === 0"
                @change="selectArtServer"
              >
                <option value="">Use Kind Robots default</option>

                <option
                  v-for="server in filteredArtServers"
                  :key="server.id"
                  :value="server.id"
                >
                  {{ serverLabel(server) }}
                </option>
              </select>
            </label>

            <div
              v-if="filteredArtServers.length === 0"
              class="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
            >
              No matching art servers found for this family.
            </div>

            <checkpoint-gallery
              variant="dropdown"
              title="Art Checkpoint"
              subtitle="Checkpoint for the selected art server."
              :show-header="false"
              :show-sampler="true"
              :show-status="false"
              :allow-add="true"
              :allow-refresh="true"
              :auto-load="true"
            />
          </div>

          <div
            class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10"
              >
                <Icon name="kind-icon:chat" class="h-6 w-6 text-secondary" />
              </div>

              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-base-content/45"
                >
                  Text
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ activeTextLabel }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  Chat and text generation default
                </p>
              </div>
            </div>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/50"
                >
                  Text family
                </span>
              </span>

              <select
                v-model="selectedTextFamily"
                class="select select-bordered select-sm rounded-xl bg-base-100"
              >
                <option
                  v-for="family in textFamilies"
                  :key="family.value"
                  :value="family.value"
                >
                  {{ family.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/50"
                >
                  Text server
                </span>
              </span>

              <select
                :value="textServerValue"
                class="select select-bordered rounded-xl bg-base-100"
                :disabled="isLoading || textServers.length === 0"
                @change="selectTextServer"
              >
                <option value="">Use Kind Robots default</option>

                <option
                  v-for="server in filteredTextServers"
                  :key="server.id"
                  :value="server.id"
                >
                  {{ serverLabel(server) }}
                </option>
              </select>
            </label>

            <div
              v-if="filteredTextServers.length === 0"
              class="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
            >
              No matching text servers found for this family.
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/70"
            >
              <p class="font-bold text-base-content">
                {{ selectedTextSummary }}
              </p>

              <p class="mt-1">
                Text routing stays separate from art routing, because Ollama
                should not accidentally become your painter. Again.
              </p>
            </div>
          </div>
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
import type { Server } from '~/prisma/generated/prisma/client'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type ArtFamily =
  | 'sd'
  | 'comfy-sdxl'
  | 'comfy-flux'
  | 'kontext'
  | 'kombine'
  | 'openai-art'
  | 'invoke'

type TextFamily = 'anthropic' | 'openai' | 'ollama'

const serverStore = useServerStore()
const userStore = useUserStore()

const selectorDialog = ref<HTMLDialogElement | null>(null)
const selectedArtFamily = ref<ArtFamily>('sd')
const selectedTextFamily = ref<TextFamily>('anthropic')
const isLoading = ref(false)

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

const allVisibleServers = computed<Server[]>(() => {
  return serverStore.servers.filter((server) => {
    if (!server.isActive) return false
    if (serverStore.isServerHidden(server.id)) return false
    if (server.userId === userStore.user?.id) return true
    if (server.isPublic) return true
    if (server.isOfficial) return true
    return userStore.isAdmin
  })
})

const artServers = computed<Server[]>(() => {
  return allVisibleServers.value.filter(isArtCapable).sort(sortServers)
})

const textServers = computed<Server[]>(() => {
  return allVisibleServers.value.filter(isTextCapable).sort(sortServers)
})

const filteredArtServers = computed<Server[]>(() => {
  const filtered = artServers.value.filter((server) => {
    return matchesArtFamily(server, selectedArtFamily.value)
  })

  return filtered.length ? filtered : artServers.value
})

const filteredTextServers = computed<Server[]>(() => {
  const filtered = textServers.value.filter((server) => {
    return matchesTextFamily(server, selectedTextFamily.value)
  })

  return filtered.length ? filtered : textServers.value
})

const artServerValue = computed(() => {
  return serverStore.activeArtServer?.id
    ? String(serverStore.activeArtServer.id)
    : ''
})

const textServerValue = computed(() => {
  return serverStore.activeTextServer?.id
    ? String(serverStore.activeTextServer.id)
    : ''
})

const activeArtLabel = computed(() => {
  return serverStore.activeArtServer
    ? serverLabel(serverStore.activeArtServer)
    : 'Kind Robots default'
})

const activeTextLabel = computed(() => {
  return serverStore.activeTextServer
    ? serverLabel(serverStore.activeTextServer)
    : 'Kind Robots default'
})

const selectedTextSummary = computed(() => {
  const server = serverStore.activeTextServer

  if (!server) return 'Using the default text server.'

  return (
    [server.generationEngine, server.model, server.defaultTransport]
      .filter(Boolean)
      .join(' · ') || 'Text server selected.'
  )
})

function openSelector() {
  setArtServerAsCurrent()
  selectorDialog.value?.showModal()
}

function closeSelector() {
  selectorDialog.value?.close()
  setArtServerAsCurrent()
}

async function refreshServers(force = false) {
  isLoading.value = true

  try {
    await serverStore.initialize({
      force,
      fetchRemote: true,
    })

    setArtServerAsCurrent()
  } finally {
    isLoading.value = false
  }
}

async function selectArtServer(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    await serverStore.setActiveArtServer(null)
    serverStore.deselectServer()
    serverStore.setCurrentServerMode('art')
    return
  }

  const result = await serverStore.setActiveArtServer(id)

  if (!result.success) return

  serverStore.setCurrentServerMode('art')
  serverStore.setCurrentServer(id)
}

async function selectTextServer(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    await serverStore.setActiveTextServer(null)
    setArtServerAsCurrent()
    return
  }

  const result = await serverStore.setActiveTextServer(id)

  if (!result.success) return

  setArtServerAsCurrent()
}

function setArtServerAsCurrent() {
  serverStore.setCurrentServerMode('art')

  if (serverStore.activeArtServer?.id) {
    serverStore.setCurrentServer(serverStore.activeArtServer.id)
    return
  }

  serverStore.deselectServer()
}

function isArtCapable(server: Server) {
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
  return (
    server.serverType === 'TEXT' ||
    server.serverType === 'OPENAI_COMPATIBLE' ||
    Boolean(server.supportsChat)
  )
}

function matchesArtFamily(server: Server, family: ArtFamily) {
  const haystack = serverHaystack(server)

  if (family === 'sd') {
    return (
      server.serverType === 'A1111' ||
      server.generationEngine === 'A1111' ||
      haystack.includes('stable diffusion') ||
      haystack.includes('sd')
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

  if (family === 'kombine') {
    return haystack.includes('kombine')
  }

  if (family === 'openai-art') {
    return (
      server.generationEngine === 'OPENAI_IMAGE' ||
      haystack.includes('openai') ||
      haystack.includes('dall')
    )
  }

  if (family === 'invoke') {
    return haystack.includes('invoke')
  }

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
    server.backendBaseUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function serverLabel(server: Server) {
  const title = server.title || server.label || `Server ${server.id}`
  const details = [
    server.serverType,
    server.generationEngine,
    server.model,
    server.defaultTransport,
  ].filter(Boolean)

  if (!details.length) return title

  return `${title} (${details.join(' · ')})`
}

function sortServers(left: Server, right: Server) {
  const leftDefault = Boolean(left.isDefault)
  const rightDefault = Boolean(right.isDefault)

  if (leftDefault !== rightDefault) return leftDefault ? -1 : 1

  const leftOfficial = Boolean(left.isOfficial)
  const rightOfficial = Boolean(right.isOfficial)

  if (leftOfficial !== rightOfficial) return leftOfficial ? -1 : 1

  const leftOrder = left.sortOrder ?? 0
  const rightOrder = right.sortOrder ?? 0

  if (leftOrder !== rightOrder) return leftOrder - rightOrder

  return serverLabel(left).localeCompare(serverLabel(right))
}

watch(
  () => serverStore.activeArtServer?.id,
  () => {
    setArtServerAsCurrent()
  },
)

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    await refreshServers()
    return
  }

  setArtServerAsCurrent()
})
</script>
