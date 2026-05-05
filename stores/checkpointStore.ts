// /stores/checkpointStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'
import { validSamplers } from '@/stores/seeds/validSamplers'
import type { Resource } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { useErrorStore, ErrorType } from './errorStore'

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

export const useCheckpointStore = defineStore('checkpointStore', () => {
  const userStore = useUserStore()
  const errorStore = useErrorStore()

  const modelUpdating = ref(false)
  const modelLoading = ref(false)
  const fetchModelPromise = ref<Promise<void> | null>(null)

  const allCheckpoints = ref<Partial<Resource>[]>(validCheckpoints)
  const allSamplers = ref<Partial<Resource>[]>(validSamplers)

  const selectedCheckpoint = ref<Partial<Resource> | null>(null)
  const selectedSampler = ref<Partial<Resource> | null>(null)
  const currentApiModel = ref<string | null>(null)

  const visibleCheckpoints = computed(() => {
    return allCheckpoints.value.filter((resource) => {
      return userStore.showMature ? true : !(resource.isMature ?? false)
    })
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

  const serverStore = useServerStore()

  async function fetchCurrentModelFromApi() {
    modelUpdating.value = true

    try {
      const serverId = serverStore.activeArtServer?.id
      const query = serverId ? `?serverId=${serverId}` : ''

      const response = await performFetch<string>(
        `/api/art/sd/currentModel${query}`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch current model.')
      }

      currentApiModel.value = response.data
      return response.data
    } catch (error) {
      currentApiModel.value = ''
      throw error
    } finally {
      modelUpdating.value = false
    }
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
      const res = await performFetch('/api/art/sd/setModel', {
        method: 'POST',
        body: JSON.stringify({ checkpoint: checkpointName }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success) {
        currentApiModel.value = checkpointName
        selectCheckpointByName(checkpointName)
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

  return {
    allCheckpoints,
    allSamplers,
    visibleCheckpoints,
    selectedCheckpoint,
    selectedSampler,
    currentApiModel,
    modelUpdating,
    modelLoading,
    fetchModelPromise,
    initialize,
    isValidSampler,
    isValidCheckpoint,
    selectCheckpointByName,
    selectSamplerByName,
    fetchCurrentModelFromApi,
    setCurrentModelInApi,
    findCheckpointByName,
  }
})
