<!-- /components/content/art/server-model-status.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-col gap-4">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Icon :name="statusIcon" class="h-5 w-5 shrink-0" />

            <h2 class="text-lg font-black text-base-content">
              Server Runtime Status
            </h2>
          </div>

          <p class="mt-1 text-sm text-base-content/60">
            Checks health, runtime state, model routing, and generation
            receipts.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 lg:justify-end">
          <button
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            :disabled="isBusy || isCreatingResources || !activeServer"
            @click="createServerResources"
          >
            <span
              v-if="isCreatingResources"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:database" class="h-4 w-4" />
            Add Resources
          </button>
          <button
            class="btn btn-sm rounded-xl"
            :class="statusButtonClass"
            type="button"
            :disabled="isBusy || !activeServer"
            @click="refreshRuntime"
          >
            <span v-if="isBusy" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Refresh
          </button>

          <button
            v-if="isA1111"
            class="btn btn-sm btn-outline rounded-xl"
            type="button"
            :disabled="isBusy || !activeServer"
            @click="refreshA1111"
          >
            <Icon name="kind-icon:server" class="h-4 w-4" />
            A1111
          </button>

          <button
            v-if="isComfy"
            class="btn btn-sm btn-outline rounded-xl"
            type="button"
            :disabled="isBusy || !activeServer"
            @click="refreshComfy"
          >
            <Icon name="kind-icon:workflow" class="h-4 w-4" />
            Comfy
          </button>

          <button
            v-if="isA1111 && selectedCheckpointValue"
            class="btn btn-sm btn-warning rounded-xl"
            type="button"
            :disabled="isBusy || !activeServer"
            @click="setServerToSelectedCheckpoint"
          >
            <Icon name="kind-icon:bolt" class="h-4 w-4" />
            Set Selected
          </button>
        </div>
      </div>

      <div class="rounded-2xl border p-3 text-sm" :class="statusPanelClass">
        <div
          class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
        >
          <div class="min-w-0">
            <p class="font-bold">
              {{ statusMessage }}
            </p>

            <p class="mt-1 text-xs opacity-75">
              {{ runtimeTimestamp }}
            </p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Resource Import
            </p>
            <p class="mt-1 break-all font-mono">
              {{ runtimeResourceCountLabel }}
            </p>
          </div>

          <div
            class="w-fit rounded-full px-3 py-1 text-xs font-black uppercase"
            :class="statusBadgeClass"
          >
            {{ statusToneLabel }}
          </div>
        </div>

        <div :class="statusGridClass">
          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Server</p>
            <p class="mt-1 break-all font-mono">{{ serverLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Engine</p>
            <p class="mt-1 break-all font-mono">{{ engineLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Health</p>
            <p class="mt-1 break-all font-mono">{{ healthLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Transport</p>
            <p class="mt-1 break-all font-mono">{{ transportLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Selected In App
            </p>
            <p class="mt-1 break-all font-mono">
              {{ selectedCheckpointLabel }}
            </p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Live Server Model
            </p>
            <p class="mt-1 break-all font-mono">{{ liveServerModelLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Last Requested
            </p>
            <p class="mt-1 break-all font-mono">{{ lastRequestedLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Last Actual</p>
            <p class="mt-1 break-all font-mono">{{ lastActualLabel }}</p>
          </div>

          <div v-if="isA1111" class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">A1111 Models</p>
            <p class="mt-1 break-all font-mono">{{ a1111ModelCountLabel }}</p>
          </div>

          <div v-if="isA1111" class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              A1111 Samplers
            </p>
            <p class="mt-1 break-all font-mono">{{ a1111SamplerCountLabel }}</p>
          </div>

          <div v-if="isComfy" class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Comfy Stats</p>
            <p class="mt-1 break-all font-mono">{{ comfyStatsLabel }}</p>
          </div>

          <div v-if="isComfy" class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Comfy History
            </p>
            <p class="mt-1 break-all font-mono">{{ comfyHistoryLabel }}</p>
          </div>
        </div>

        <div
          v-if="runtimeError"
          class="mt-3 rounded-xl bg-error/10 p-2 text-xs font-semibold text-error"
        >
          {{ runtimeError }}
        </div>

        <div
          v-if="resourceImportMessage"
          class="mt-3 rounded-xl bg-info/10 p-2 text-xs font-semibold text-info"
        >
          {{ resourceImportMessage }}
        </div>

        <div
          v-if="checkpointStore.modelStatusError"
          class="mt-3 rounded-xl bg-error/10 p-2 text-xs font-semibold text-error"
        >
          {{ checkpointStore.modelStatusError }}
        </div>
      </div>

      <div
        v-if="showA1111Controls"
        class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="form-control min-w-0">
          <span class="label py-1">
            <span
              class="label-text text-xs font-bold uppercase text-base-content/50"
            >
              Set A1111 Checkpoint
            </span>
          </span>

          <select
            v-model="manualCheckpoint"
            class="select select-bordered select-sm w-full rounded-xl bg-base-100"
            :disabled="isBusy || modelOptions.length === 0"
          >
            <option value="">Choose model...</option>
            <option
              v-for="model in modelOptions"
              :key="model.value"
              :value="model.value"
            >
              {{ model.label }}
            </option>
          </select>
        </label>

        <div class="flex flex-wrap items-end gap-2">
          <button
            class="btn btn-sm btn-primary rounded-xl text-white"
            type="button"
            :disabled="isBusy || !manualCheckpoint || !activeServer"
            @click="setManualCheckpoint"
          >
            <span v-if="isBusy" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:check" class="h-4 w-4" />
            Set Model
          </button>

          <button
            class="btn btn-sm btn-outline rounded-xl"
            type="button"
            :disabled="isBusy || !activeServer"
            @click="fetchModelOptions"
          >
            <Icon name="kind-icon:list" class="h-4 w-4" />
            Models
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useServerStore } from '@/stores/serverStore'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'

const checkpointStore = useCheckpointStore()
const serverStore = useServerStore()
const resourceStore = useResourceStore()
const userStore = useUserStore()

const props = withDefaults(
  defineProps<{
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    compact: false,
    autoLoad: false,
  },
)

const manualCheckpoint = ref('')
const isCreatingResources = ref(false)
const resourceImportMessage = ref('')

const activeServer = computed(() => {
  return serverStore.currentServer || serverStore.activeArtServer
})
const runtimeResourceCandidates = computed(() => {
  if (!activeServer.value) return []

  return resourceStore.buildResourcesFromServerRuntime({
    server: activeServer.value,
    report: runtimeReport.value,
    userId: userStore.user?.id ?? null,
  })
})

const statusGridClass = computed(() => {
  return props.compact
    ? 'mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2'
    : 'mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2 xl:grid-cols-4'
})

const runtimeResourceCountLabel = computed(() => {
  const count = runtimeResourceCandidates.value.length

  if (count === 0) return 'No new resources'

  return `${count} resource${count === 1 ? '' : 's'} ready`
})

async function createServerResources() {
  if (!activeServer.value) return

  isCreatingResources.value = true
  resourceImportMessage.value = ''

  try {
    if (isA1111.value) {
      await refreshA1111()
    }

    if (isComfy.value) {
      await refreshComfy()
    }

    const result = await resourceStore.createResourcesForServerRuntime({
      server: activeServer.value,
      report: runtimeReport.value,
      userId: userStore.user?.id ?? null,
    })

    resourceImportMessage.value = result.message
  } catch (error) {
    resourceImportMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not create server resources.'
  } finally {
    isCreatingResources.value = false
  }
}

const runtimeReport = computed(() => {
  return activeServer.value
    ? serverStore.getRuntimeReportForServer(activeServer.value)
    : null
})

const modelReport = computed(() => {
  return checkpointStore.lastGenerationStatus || checkpointStore.modelStatus
})

const isRuntimeLoading = computed(() => {
  return activeServer.value?.id
    ? Boolean(serverStore.runtimeLoadingByServerId[activeServer.value.id])
    : false
})

const isBusy = computed(() => {
  return Boolean(isRuntimeLoading.value || checkpointStore.modelStatusLoading)
})

const runtimeError = computed(() => {
  return activeServer.value?.id
    ? serverStore.runtimeErrorByServerId[activeServer.value.id] || ''
    : ''
})

const serverLabel = computed(() => {
  return (
    activeServer.value?.label ||
    activeServer.value?.title ||
    'No server selected'
  )
})

const engineLabel = computed(() => {
  return (
    runtimeReport.value?.engine ||
    activeServer.value?.generationEngine ||
    activeServer.value?.serverType ||
    'UNKNOWN'
  )
})

const isA1111 = computed(() => {
  return engineLabel.value === 'A1111'
})

const isComfy = computed(() => {
  return engineLabel.value === 'COMFY'
})

const transportLabel = computed(() => {
  if (!activeServer.value) return 'No server'

  return [
    activeServer.value.defaultTransport || 'transport?',
    activeServer.value.accessMode || 'access?',
    activeServer.value.allowBrowserRequests ? 'browser' : 'no-browser',
  ].join(' / ')
})

const healthLabel = computed(() => {
  const health = runtimeReport.value?.health

  if (!health) return 'Not checked'

  return `${health.ok ? 'online' : 'offline'} · ${health.status} · ${health.latencyMs}ms`
})

const selectedCheckpointValue = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.name ||
    checkpointStore.selectedCheckpoint?.customLabel ||
    ''
  )
})

const selectedCheckpointLabel = computed(() => {
  return selectedCheckpointValue.value || 'No checkpoint selected'
})

const liveServerModelLabel = computed(() => {
  const a1111 = runtimeReport.value?.a1111 || {}
  const modelFromRuntime = a1111.currentModel

  if (typeof modelFromRuntime === 'string' && modelFromRuntime.trim()) {
    return modelFromRuntime
  }

  return (
    checkpointStore.modelStatus?.activeModel ||
    checkpointStore.currentApiModel ||
    'Not checked'
  )
})

const lastRequestedLabel = computed(() => {
  return (
    checkpointStore.lastGenerationStatus?.requestedCheckpoint ||
    'No generation yet'
  )
})

const lastActualLabel = computed(() => {
  return (
    checkpointStore.lastGenerationStatus?.actualGenerationModel ||
    'No generation yet'
  )
})

const a1111Models = computed(() => {
  const models = runtimeReport.value?.a1111?.models
  return Array.isArray(models) ? models : []
})

const a1111Samplers = computed(() => {
  const samplers = runtimeReport.value?.a1111?.samplers
  return Array.isArray(samplers) ? samplers : []
})

const a1111ModelCountLabel = computed(() => {
  return a1111Models.value.length
    ? `${a1111Models.value.length} available`
    : 'Not loaded'
})

const a1111SamplerCountLabel = computed(() => {
  return a1111Samplers.value.length
    ? `${a1111Samplers.value.length} available`
    : 'Not loaded'
})

const comfyStatsLabel = computed(() => {
  return runtimeReport.value?.comfy?.systemStats ? 'Loaded' : 'Not loaded'
})

const comfyHistoryLabel = computed(() => {
  return runtimeReport.value?.comfy?.history ? 'Loaded' : 'Not loaded'
})

const runtimeTimestamp = computed(() => {
  if (!runtimeReport.value?.checkedAt) return 'Runtime has not been refreshed.'

  return `Last runtime refresh: ${new Date(
    runtimeReport.value.checkedAt,
  ).toLocaleString()}`
})

const statusTone = computed(() => {
  if (runtimeError.value || checkpointStore.modelStatusError) return 'error'
  if (modelReport.value?.tone) return modelReport.value.tone
  if (runtimeReport.value?.success === false) return 'error'
  if (runtimeReport.value?.success === true) return 'safe'
  return 'unknown'
})

const statusToneLabel = computed(() => {
  if (statusTone.value === 'safe') return 'safe'
  if (statusTone.value === 'warning') return 'warning'
  if (statusTone.value === 'error') return 'error'
  return 'unknown'
})

const statusMessage = computed(() => {
  if (!activeServer.value) return 'No server selected.'
  if (runtimeError.value) return runtimeError.value
  if (checkpointStore.modelStatusError) return checkpointStore.modelStatusError
  if (modelReport.value?.message) return modelReport.value.message
  if (runtimeReport.value?.message) return runtimeReport.value.message
  return 'No runtime check has run yet.'
})

const statusButtonClass = computed(() => {
  if (statusTone.value === 'safe') return 'btn-success'
  if (statusTone.value === 'warning') return 'btn-warning'
  if (statusTone.value === 'error') return 'btn-error'
  return 'btn-outline'
})

const statusPanelClass = computed(() => {
  if (statusTone.value === 'safe') {
    return 'border-success/40 bg-success/10 text-success'
  }

  if (statusTone.value === 'warning') {
    return 'border-warning/40 bg-warning/10 text-warning'
  }

  if (statusTone.value === 'error') {
    return 'border-error/40 bg-error/10 text-error'
  }

  return 'border-base-300 bg-base-200 text-base-content/70'
})

const statusBadgeClass = computed(() => {
  if (statusTone.value === 'safe') return 'bg-success/20 text-success'
  if (statusTone.value === 'warning') return 'bg-warning/20 text-warning'
  if (statusTone.value === 'error') return 'bg-error/20 text-error'
  return 'bg-base-300 text-base-content/60'
})

const statusIcon = computed(() => {
  if (statusTone.value === 'safe') return 'kind-icon:check'
  if (statusTone.value === 'warning') return 'kind-icon:warning'
  if (statusTone.value === 'error') return 'kind-icon:close'
  return 'kind-icon:server'
})

const showA1111Controls = computed(() => {
  return Boolean(isA1111.value && activeServer.value)
})

const modelOptions = computed(() => {
  return a1111Models.value
    .map((model) => {
      if (!model || typeof model !== 'object') return null

      const record = model as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title : ''
      const modelName =
        typeof record.model_name === 'string'
          ? record.model_name
          : typeof record.modelName === 'string'
            ? record.modelName
            : ''

      const value = modelName || title
      const label = title || modelName

      if (!value || !label) return null

      return {
        value,
        label,
      }
    })
    .filter((item): item is { value: string; label: string } => Boolean(item))
})

async function refreshHealth() {
  if (!activeServer.value?.id) return

  await serverStore.testServerHealth(activeServer.value.id)
}

async function refreshModelStatus() {
  await checkpointStore.checkActiveModel()
}

async function fetchModelOptions() {
  if (!activeServer.value) return

  await serverStore.fetchA1111Models(activeServer.value)
}

async function refreshA1111() {
  if (!activeServer.value) return

  await Promise.allSettled([
    serverStore.fetchA1111Options(activeServer.value),
    serverStore.fetchA1111Models(activeServer.value),
    serverStore.fetchA1111Samplers(activeServer.value),
    serverStore.fetchA1111Loras(activeServer.value),
    serverStore.fetchA1111Embeddings(activeServer.value),
  ])

  await refreshModelStatus()
}

async function refreshComfy() {
  if (!activeServer.value) return

  await Promise.allSettled([
    serverStore.fetchComfySystemStats(activeServer.value),
    serverStore.fetchComfyObjectInfo(activeServer.value),
    serverStore.fetchComfyHistory(activeServer.value),
  ])
}

async function refreshRuntime() {
  if (!activeServer.value) return

  await refreshHealth()

  if (isA1111.value) {
    await refreshA1111()
    return
  }

  if (isComfy.value) {
    await refreshComfy()
    return
  }

  await refreshModelStatus()
}

async function setServerCheckpoint(checkpoint: string) {
  if (!activeServer.value) return

  const cleanCheckpoint = checkpoint.trim()

  if (!cleanCheckpoint) return

  await serverStore.setA1111Model(activeServer.value, cleanCheckpoint)
  await refreshA1111()
}

async function setServerToSelectedCheckpoint() {
  await setServerCheckpoint(selectedCheckpointValue.value)
}

async function setManualCheckpoint() {
  await setServerCheckpoint(manualCheckpoint.value)
}

watch(
  () => activeServer.value?.id,
  async () => {
    manualCheckpoint.value = ''

    if (!props.autoLoad) return

    await refreshRuntime()
  },
)

onMounted(async () => {
  if (!props.autoLoad) return

  await refreshRuntime()
})
</script>
