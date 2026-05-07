// /stores/checkpointStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { useErrorStore, ErrorType } from './errorStore'
import { useServerStore } from './serverStore'
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'
import { validSamplers } from '@/stores/seeds/validSamplers'
import type { Resource, Server } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import {
  createModelStatusReport,
  findComfyCheckpointFromHistory,
  findComfyCheckpointFromWorkflow,
  parseA1111GenerationInfo,
  type A1111OptionsResponse,
  type ModelStatusEngine,
  type ModelStatusReport,
} from '@/stores/helpers/statusHelper'

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

type ModelApiObjectResponse = {
  model?: unknown
  currentModel?: unknown
  currentApiModel?: unknown
  sd_model_checkpoint?: unknown
  checkpoint?: unknown
  data?: unknown
  message?: unknown
}

type ModelApiResponse = string | ModelApiObjectResponse

type RequestServerLike = (
  server: Server,
  path: string,
  init?: RequestInit,
) => Promise<Response>

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)

  return ''
}

function cleanName(value: unknown): string {
  return safeText(value).trim()
}

function extractModelName(value: unknown): string {
  if (typeof value === 'string') return value.trim()

  if (typeof value !== 'object' || value === null) return ''

  const record = value as ModelApiObjectResponse

  const direct =
    cleanName(record.model) ||
    cleanName(record.currentModel) ||
    cleanName(record.currentApiModel) ||
    cleanName(record.sd_model_checkpoint) ||
    cleanName(record.checkpoint)

  if (direct) return direct

  return extractModelName(record.data)
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as {
      message?: unknown
      statusMessage?: unknown
      statusText?: unknown
    }

    return (
      cleanName(record.message) ||
      cleanName(record.statusMessage) ||
      cleanName(record.statusText) ||
      fallback
    )
  }

  return fallback
}

function isSuccessNoise(message: unknown): boolean {
  const cleaned = cleanName(message).toLowerCase()

  return (
    !cleaned ||
    cleaned === 'request completed successfully' ||
    cleaned === 'ok' ||
    cleaned === 'success'
  )
}

function getServerEngine(server: Server | null | undefined): ModelStatusEngine {
  if (!server) return 'UNKNOWN'

  if (server.generationEngine === 'A1111' || server.serverType === 'A1111') {
    return 'A1111'
  }

  if (
    server.generationEngine === 'COMFY' ||
    server.serverType === 'COMFY' ||
    server.supportsComfyWorkflow
  ) {
    return 'COMFY'
  }

  if (server.generationEngine === 'FLUX') return 'FLUX'
  if (server.generationEngine === 'KONTEXT') return 'KONTEXT'

  return 'UNKNOWN'
}

function getServerFallbackModel(server: Server | null | undefined): string {
  if (!server) return ''

  return (
    cleanName(server.model) ||
    cleanName(server.workflowVersion) ||
    cleanName(server.label) ||
    cleanName(server.title)
  )
}

function getRequestServer(
  serverStore: ReturnType<typeof useServerStore>,
): RequestServerLike | null {
  const possibleStore = serverStore as unknown as {
    requestServer?: RequestServerLike
  }

  return typeof possibleStore.requestServer === 'function'
    ? possibleStore.requestServer
    : null
}

export const useCheckpointStore = defineStore('checkpointStore', () => {
  const userStore = useUserStore()
  const errorStore = useErrorStore()
  const serverStore = useServerStore()

  const modelUpdating = ref(false)
  const modelLoading = ref(false)
  const modelStatusLoading = ref(false)
  const modelStatusError = ref('')
  const fetchModelPromise = ref<Promise<void> | null>(null)

  const allCheckpoints = ref<Partial<Resource>[]>(validCheckpoints)
  const allSamplers = ref<Partial<Resource>[]>(validSamplers)

  const selectedCheckpoint = ref<Partial<Resource> | null>(null)
  const selectedSampler = ref<Partial<Resource> | null>(null)
  const currentApiModel = ref<string | null>(null)
  const modelStatus = ref<ModelStatusReport | null>(null)
  const lastGenerationStatus = ref<ModelStatusReport | null>(null)

  const visibleCheckpoints = computed(() => {
    return allCheckpoints.value.filter((resource) => {
      return userStore.showMature ? true : !(resource.isMature ?? false)
    })
  })

  const selectedCheckpointName = computed(() => {
    return cleanName(selectedCheckpoint.value?.name)
  })

  const selectedSamplerName = computed(() => {
    return cleanName(selectedSampler.value?.name)
  })

  const activeEngine = computed<ModelStatusEngine>(() => {
    return getServerEngine(serverStore.activeArtServer)
  })

  const hasModelMismatch = computed(() => {
    const report = lastGenerationStatus.value || modelStatus.value

    return report?.tone === 'warning' || report?.tone === 'error'
  })

  function isValidSampler(name: unknown) {
    const target = cleanName(name)

    if (!target) return false

    return allSamplers.value.some((sampler) => {
      return cleanName(sampler.name) === target
    })
  }

  function isValidCheckpoint(name: unknown) {
    const target = cleanName(name)

    if (!target) return false

    return allCheckpoints.value.some((resource) => {
      return cleanName(resource.name) === target
    })
  }

  function initialize() {
    if (!selectedCheckpoint.value && visibleCheckpoints.value.length > 0) {
      selectedCheckpoint.value = visibleCheckpoints.value[0] || null
    }

    if (!selectedSampler.value && allSamplers.value.length > 0) {
      selectedSampler.value = allSamplers.value[0] || null
    }
  }

  function findCheckpointByName(name: unknown): Partial<Resource> | undefined {
    const target = cleanName(name)

    if (!target) return undefined

    return allCheckpoints.value.find((resource) => {
      return cleanName(resource.name) === target
    })
  }

  function findSamplerByName(name: unknown): Partial<Resource> | undefined {
    const target = cleanName(name)

    if (!target) return undefined

    return allSamplers.value.find((sampler) => {
      return cleanName(sampler.name) === target
    })
  }

  function selectCheckpointByName(name: unknown) {
    const target = cleanName(name)

    if (!target) {
      selectedCheckpoint.value = null
      return
    }

    selectedCheckpoint.value = findCheckpointByName(target) || null
  }

  function selectSamplerByName(name: unknown) {
    const target = cleanName(name)

    if (!target) {
      selectedSampler.value = null
      return
    }

    const found = findSamplerByName(target)

    if (!found) {
      console.warn(`[❌ Sampler Not Found] "${target}"`)
    }

    selectedSampler.value = found || null
  }

  function getActiveServer(server?: Server | null): Server | null {
    return server || serverStore.activeArtServer || null
  }

  function setModelStatusReport(report: ModelStatusReport) {
    modelStatus.value = report

    if (report.activeModel) {
      currentApiModel.value = report.activeModel
    }
  }

  async function fetchCurrentModelFromApi() {
    modelUpdating.value = true

    try {
      const server = getActiveServer()

      if (!server) {
        currentApiModel.value = ''
        return ''
      }

      if (getServerEngine(server) !== 'A1111') {
        const modelName = getServerFallbackModel(server)

        currentApiModel.value = modelName

        setModelStatusReport(
          createModelStatusReport({
            server,
            selectedCheckpoint: selectedCheckpointName.value,
            activeModel: modelName,
            source: 'server-fallback',
          }),
        )

        return modelName
      }

      const query = server.id ? `?serverId=${server.id}` : ''

      const response = await performFetch<ModelApiResponse>(
        `/api/art/sd/currentModel${query}`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch current model.')
      }

      const modelName = extractModelName(response.data)

      if (!modelName) {
        throw new Error('Model fetch returned no model name.')
      }

      currentApiModel.value = modelName

      setModelStatusReport(
        createModelStatusReport({
          server,
          selectedCheckpoint: selectedCheckpointName.value,
          activeModel: modelName,
          source: 'options',
          raw: response.data,
        }),
      )

      return modelName
    } catch (error) {
      currentApiModel.value = ''
      throw error
    } finally {
      modelUpdating.value = false
    }
  }

  async function fetchA1111ModelStatus(
    server?: Server | null,
  ): Promise<ModelStatusReport> {
    const activeServer = getActiveServer(server)

    if (!activeServer) {
      return createModelStatusReport({
        server: null,
        selectedCheckpoint: selectedCheckpointName.value,
        source: 'unknown',
      })
    }

    const query = activeServer.id ? `?serverId=${activeServer.id}` : ''

    const response = await performFetch<
      ModelApiResponse | A1111OptionsResponse
    >(`/api/art/sd/currentModel${query}`)

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch A1111 model status.')
    }

    const activeModel = extractModelName(response.data)
    const data = response.data as A1111OptionsResponse

    const report = createModelStatusReport({
      server: activeServer,
      selectedCheckpoint: selectedCheckpointName.value,
      activeModel,
      modelHash: cleanName(data.sd_checkpoint_hash),
      source: 'options',
      raw: response.data,
    })

    setModelStatusReport(report)
    return report
  }

  async function fetchComfyModelStatus(
    server?: Server | null,
  ): Promise<ModelStatusReport> {
    const activeServer = getActiveServer(server)

    if (!activeServer) {
      return createModelStatusReport({
        server: null,
        selectedCheckpoint: selectedCheckpointName.value,
        source: 'unknown',
      })
    }

    const requestServer = getRequestServer(serverStore)

    if (!requestServer) {
      const fallbackModel = getServerFallbackModel(activeServer)

      const report = createModelStatusReport({
        server: activeServer,
        selectedCheckpoint: selectedCheckpointName.value,
        activeModel: fallbackModel,
        source: 'server-fallback',
      })

      setModelStatusReport(report)
      return report
    }

    const response = await requestServer(activeServer, '/history', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(
        `Comfy model status failed with ${response.status} ${response.statusText}`,
      )
    }

    const data = await response.json()
    const activeModel = findComfyCheckpointFromHistory(data)

    const report = createModelStatusReport({
      server: activeServer,
      selectedCheckpoint: selectedCheckpointName.value,
      activeModel,
      source: activeModel ? 'comfy-history' : 'server-fallback',
      raw: data,
    })

    setModelStatusReport(report)
    return report
  }

  async function checkActiveModel(
    server?: Server | null,
  ): Promise<ModelStatusReport> {
    modelStatusLoading.value = true
    modelStatusError.value = ''

    try {
      const activeServer = getActiveServer(server)

      if (!activeServer) {
        const report = createModelStatusReport({
          server: null,
          selectedCheckpoint: selectedCheckpointName.value,
          source: 'unknown',
        })

        setModelStatusReport(report)
        return report
      }

      const engine = getServerEngine(activeServer)

      if (engine === 'A1111') {
        return await fetchA1111ModelStatus(activeServer)
      }

      if (engine === 'COMFY') {
        return await fetchComfyModelStatus(activeServer)
      }

      const fallbackModel = getServerFallbackModel(activeServer)

      const report = createModelStatusReport({
        server: activeServer,
        selectedCheckpoint: selectedCheckpointName.value,
        activeModel: fallbackModel,
        source: 'server-fallback',
      })

      setModelStatusReport(report)
      return report
    } catch (error) {
      const message = getErrorMessage(error, 'Could not check active model.')

      modelStatusError.value = message
      errorStore.setError(ErrorType.NETWORK_ERROR, message)

      const report = {
        ...createModelStatusReport({
          server: getActiveServer(server),
          selectedCheckpoint: selectedCheckpointName.value,
          source: 'unknown',
        }),
        success: false,
        tone: 'error' as const,
        message,
      }

      setModelStatusReport(report)
      return report
    } finally {
      modelStatusLoading.value = false
    }
  }

  function recordA1111GenerationStatus(input: {
    server?: Server | null
    selectedCheckpoint?: string
    requestedCheckpoint?: string
    info?: unknown
  }): ModelStatusReport {
    const activeServer = getActiveServer(input.server || null)
    const info = parseA1111GenerationInfo(input.info)

    const report = createModelStatusReport({
      server: activeServer,
      selectedCheckpoint:
        input.selectedCheckpoint || selectedCheckpointName.value,
      requestedCheckpoint: input.requestedCheckpoint || '',
      actualGenerationModel: info.sd_model_name || '',
      modelHash: info.sd_model_hash || '',
      sampler: info.sampler_name || selectedSamplerName.value,
      source: 'generation-info',
      raw: input.info,
    })

    lastGenerationStatus.value = report

    if (report.actualGenerationModel) {
      currentApiModel.value = report.actualGenerationModel
    }

    return report
  }

  function recordComfyGenerationStatus(input: {
    server?: Server | null
    selectedCheckpoint?: string
    requestedCheckpoint?: string
    workflow?: unknown
    history?: unknown
  }): ModelStatusReport {
    const activeServer = getActiveServer(input.server || null)

    const actualGenerationModel =
      findComfyCheckpointFromHistory(input.history) ||
      findComfyCheckpointFromWorkflow(input.workflow)

    const report = createModelStatusReport({
      server: activeServer,
      selectedCheckpoint:
        input.selectedCheckpoint || selectedCheckpointName.value,
      requestedCheckpoint: input.requestedCheckpoint || '',
      actualGenerationModel,
      sampler: selectedSamplerName.value,
      source: actualGenerationModel ? 'comfy-history' : 'unknown',
      raw: input.history || input.workflow,
    })

    lastGenerationStatus.value = report

    if (report.actualGenerationModel) {
      currentApiModel.value = report.actualGenerationModel
    }

    return report
  }

  async function setCurrentModelInApi(
    name: unknown,
  ): Promise<ApiResponse<unknown>> {
    const checkpointName = cleanName(name)

    if (!checkpointName) {
      const message = 'Cannot set model without a checkpoint name.'

      errorStore.setError(ErrorType.GENERAL_ERROR, message)

      return {
        success: false,
        message,
      }
    }

    modelUpdating.value = true

    try {
      const server = getActiveServer()
      const body = server?.id
        ? { checkpoint: checkpointName, serverId: server.id }
        : { checkpoint: checkpointName }

      const res = await performFetch('/api/art/sd/setModel', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success) {
        currentApiModel.value = checkpointName
        selectCheckpointByName(checkpointName)

        setModelStatusReport(
          createModelStatusReport({
            server,
            selectedCheckpoint: checkpointName,
            activeModel: checkpointName,
            source: 'options',
            raw: res.data || res,
          }),
        )
      } else {
        const message = isSuccessNoise(res.message)
          ? 'Failed to set current model.'
          : cleanName(res.message)

        errorStore.setError(ErrorType.GENERAL_ERROR, message)
      }

      return res
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to set current model.')

      errorStore.setError(ErrorType.NETWORK_ERROR, message)

      return {
        success: false,
        message,
      }
    } finally {
      modelUpdating.value = false
    }
  }

  function clearModelStatus() {
    modelStatus.value = null
    lastGenerationStatus.value = null
    modelStatusError.value = ''
  }

  return {
    allCheckpoints,
    allSamplers,
    visibleCheckpoints,
    selectedCheckpoint,
    selectedSampler,
    selectedCheckpointName,
    selectedSamplerName,
    currentApiModel,
    modelStatus,
    lastGenerationStatus,
    modelStatusLoading,
    modelStatusError,
    modelUpdating,
    modelLoading,
    fetchModelPromise,
    activeEngine,
    hasModelMismatch,
    initialize,
    isValidSampler,
    isValidCheckpoint,
    selectCheckpointByName,
    selectSamplerByName,
    fetchCurrentModelFromApi,
    fetchA1111ModelStatus,
    fetchComfyModelStatus,
    checkActiveModel,
    recordA1111GenerationStatus,
    recordComfyGenerationStatus,
    setCurrentModelInApi,
    clearModelStatus,
    findCheckpointByName,
    findSamplerByName,
  }
})
