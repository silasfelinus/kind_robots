<!-- /components/art/generate-button.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <div
      class="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs font-black uppercase tracking-wide">
            Image Server
          </span>
        </div>

        <select
          v-model="serverChoice"
          class="select select-bordered w-full rounded-2xl font-semibold"
          :class="props.compact ? 'select-sm text-sm' : 'min-h-14 text-base'"
          :disabled="artStore.isGenerating || !hasServerChoices"
          @change="handleServerChoiceChange"
        >
          <option value="default">
            {{ defaultServerOptionLabel }}
          </option>

          <option value="any">Whatever is available</option>

          <option
            v-for="server in alternateServerOptions"
            :key="server.id"
            :value="getSpecificServerValue(server.id)"
          >
            {{ getServerDisplayLabel(server) }}
          </option>
        </select>
      </label>

      <button
        class="btn w-full rounded-2xl font-black transition-all duration-200 sm:w-auto sm:min-w-48"
        :class="[
          artStore.isGenerating
            ? 'btn-primary cursor-not-allowed opacity-80'
            : canClick
              ? 'btn-primary shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0'
              : 'btn-disabled',
          props.compact ? 'btn-sm text-sm' : 'min-h-14 text-base',
        ]"
        type="button"
        :disabled="!canClick"
        @click="handleGenerate"
      >
        <span v-if="artStore.isGenerating" class="flex items-center gap-2">
          <span class="loading loading-dots loading-sm" />
          {{ busyLabel }}
        </span>

        <span v-else class="flex items-center gap-2">
          <icon :name="icon" class="h-5 w-5" />
          {{ canAfford ? label : 'Out of mana, top up' }}
        </span>
      </button>
    </div>

    <div
      class="rounded-2xl border border-base-300 bg-base-200/70 p-3 text-xs font-semibold text-base-content/70"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-sm rounded-2xl" :class="selectionBadgeClass">
          {{ selectionBadgeLabel }}
        </span>

        <span class="truncate">
          {{ selectionSummary }}
        </span>
      </div>

      <p
        v-if="selectionDetail"
        class="mt-1 text-[0.7rem] leading-relaxed text-base-content/50"
      >
        {{ selectionDetail }}
      </p>
    </div>

    <div
      v-if="showMessage && artStore.generationMessage"
      class="flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
      :class="
        artStore.generationMessageTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      <icon
        :name="
          artStore.generationMessageTone === 'error'
            ? 'kind-icon:alert'
            : 'kind-icon:check'
        "
        class="mt-0.5 h-4 w-4 shrink-0"
      />
      {{ artStore.generationMessage }}
    </div>

    <div
      v-if="showResult && resultImage"
      class="rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <image-card :art-image="resultImage" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore, type GenerateArtData } from '@/stores/artStore'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'

type ServerChoice = 'default' | 'any' | `server:${number}`

type GenerateArtDataWithRouting = Partial<GenerateArtData> & {
  serverSelectionMode?: 'default' | 'any' | 'specific'
}

const props = withDefaults(
  defineProps<{
    label?: string
    busyLabel?: string
    icon?: string
    compact?: boolean
    showResult?: boolean
    showMessage?: boolean
    overrides?: Partial<GenerateArtData>
  }>(),
  {
    label: 'Generate Image',
    busyLabel: 'Generating…',
    icon: 'kind-icon:sparkles',
    compact: false,
    showResult: true,
    showMessage: true,
    overrides: () => ({}),
  },
)

const emit = defineEmits<{
  generated: [image: ArtImage]
  failed: [message: string]
}>()

const artStore = useArtStore()
const errorStore = useErrorStore()
const manaStore = useManaStore()
const userStore = useUserStore()
const serverStore = useServerStore()

const serverChoice = ref<ServerChoice>('default')

const resultImage = computed(
  () => artStore.lastGeneratedArtImage || artStore.currentArtImage || null,
)

const serverOptions = computed<Server[]>(() => {
  return Array.isArray(artStore.generationServers)
    ? [...artStore.generationServers]
    : []
})

const defaultServer = computed<Server | null>(() => {
  return serverStore.activeArtServer || null
})

const defaultServerId = computed(() => defaultServer.value?.id ?? null)

const hasServerChoices = computed(() => {
  return Boolean(defaultServer.value || serverOptions.value.length)
})

const alternateServerOptions = computed<Server[]>(() => {
  const defaultId = defaultServerId.value

  return serverOptions.value.filter((server) => {
    if (!server?.id) return false
    return server.id !== defaultId
  })
})

const selectedSpecificServerId = computed<number | null>(() => {
  if (!serverChoice.value.startsWith('server:')) return null

  const id = Number(serverChoice.value.replace('server:', ''))

  return Number.isInteger(id) && id > 0 ? id : null
})

const selectedSpecificServer = computed<Server | null>(() => {
  const id = selectedSpecificServerId.value
  if (!id) return null

  return serverStore.getServerById(id) || null
})

const displayServer = computed<Server | null>(() => {
  if (serverChoice.value === 'default') {
    return defaultServer.value
  }

  if (serverChoice.value.startsWith('server:')) {
    return selectedSpecificServer.value
  }

  return artStore.activeGenerationServer || defaultServer.value || null
})

const billingServer = computed<Server | null>(() => {
  return displayServer.value || artStore.activeGenerationServer || null
})

const defaultServerOptionLabel = computed(() => {
  if (!defaultServer.value) {
    return 'Default Image Server'
  }

  return `Default: ${getServerDisplayLabel(defaultServer.value)}`
})

const selectionBadgeLabel = computed(() => {
  if (serverChoice.value === 'default') return 'Default'
  if (serverChoice.value === 'any') return 'Auto'
  return 'Override'
})

const selectionBadgeClass = computed(() => {
  if (serverChoice.value === 'default') return 'badge-primary'
  if (serverChoice.value === 'any') return 'badge-info'
  return 'badge-secondary'
})

const selectionSummary = computed(() => {
  if (serverChoice.value === 'any') {
    return 'Whatever compatible image server is available'
  }

  const server = displayServer.value

  if (!server) {
    return 'No image server selected'
  }

  return getServerDisplayLabel(server)
})

const selectionDetail = computed(() => {
  if (serverChoice.value === 'default') {
    return defaultServer.value
      ? 'Uses your preferred image server. Change this in Server Connections.'
      : 'No preferred image server is currently saved.'
  }

  if (serverChoice.value === 'any') {
    return 'The art store will pick the best compatible server for this request.'
  }

  return 'Uses this server for this generation only.'
})

const usesOwnServer = computed(() => {
  const server = billingServer.value

  if (!server) return false
  if (!server.isActive) return false
  if (server.userId && server.userId === userStore.userId) return true
  if (server.isPublic && !server.isOfficial) return true

  return false
})

const canAfford = computed(() => {
  if (manaStore.isFamily) return true
  if (usesOwnServer.value) return true

  return manaStore.balance > 0
})

const canClick = computed(() => {
  return Boolean(
    artStore.canGenerateArt &&
    !artStore.isGenerating &&
    canAfford.value &&
    hasServerChoices.value,
  )
})

watch(
  () => artStore.artForm.serverId,
  (serverId) => {
    if (!serverId) {
      if (serverChoice.value.startsWith('server:')) {
        serverChoice.value = 'default'
      }

      return
    }

    serverChoice.value = getSpecificServerValue(serverId)
  },
)

onMounted(async () => {
  await artStore.prepareArtGenerator()

  if (artStore.artForm.serverId) {
    serverChoice.value = getSpecificServerValue(artStore.artForm.serverId)
  }
})

function getSpecificServerValue(serverId: number): ServerChoice {
  return `server:${serverId}`
}

function getServerEngineLabel(server: Server): string {
  if (server.serverType === 'OPENAI') return 'OpenAI Images'
  if (server.serverType === 'COMFY') return 'Comfy'
  if (server.serverType === 'A1111') return 'Stable Diffusion'
  if (server.serverType === 'ANTHROPIC') return 'Anthropic'

  return 'Image'
}

function getServerDisplayLabel(server: Server): string {
  const title = server.label || server.title || `Server #${server.id}`
  return `${title} · ${getServerEngineLabel(server)}`
}

function handleServerChoiceChange() {
  if (serverChoice.value === 'default') {
    artStore.selectGenerationServer(null)
    return
  }

  if (serverChoice.value === 'any') {
    artStore.selectGenerationServer(null)
    return
  }

  const serverId = selectedSpecificServerId.value

  if (!serverId) {
    artStore.selectGenerationServer(null)
    serverChoice.value = 'default'
    return
  }

  artStore.selectGenerationServer(serverId)
}

function buildGenerationOverrides(): GenerateArtDataWithRouting {
  const baseOverrides: GenerateArtDataWithRouting = {
    ...props.overrides,
  }

  if (serverChoice.value === 'default') {
    return {
      ...baseOverrides,
      serverId: null,
      serverName: null,
      serverSelectionMode: 'default',
    }
  }

  if (serverChoice.value === 'any') {
    return {
      ...baseOverrides,
      serverId: null,
      serverName: null,
      serverSelectionMode: 'any',
    }
  }

  const server = selectedSpecificServer.value

  return {
    ...baseOverrides,
    serverId: server?.id ?? null,
    serverName: server
      ? server.label || server.title || `Server #${server.id}`
      : null,
    serverSelectionMode: 'specific',
  }
}

async function handleGenerate() {
  const result = await artStore.generateCurrentArt(buildGenerationOverrides())

  if (!result.success || !result.data) {
    const message = result.message || 'Generation failed.'

    if (/mana|⚡/i.test(message)) {
      errorStore.addError(
        ErrorType.INTERACTION_ERROR,
        `${message} Visit your wallet to top up.`,
      )
    } else {
      errorStore.addError(ErrorType.GENERAL_ERROR, message)
    }

    emit('failed', message)
    return
  }

  emit('generated', result.data)
}
</script>
