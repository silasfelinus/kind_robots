// /stores/checkpointStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'
import { validSamplers } from '@/stores/seeds/validSamplers'
import type { Resource } from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import { useErrorStore, ErrorType } from './errorStore'

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

  const visibleCheckpoints = computed(() =>
    allCheckpoints.value.filter((resource) =>
      userStore.showMature ? true : !(resource.isMature ?? false),
    ),
  )

  const isValidSampler = (name: string) =>
    allSamplers.value.some(
      (sampler) => (sampler.name ?? '').trim() === name.trim(),
    )

  const isValidCheckpoint = (name: string) =>
    allCheckpoints.value.some(
      (resource) => (resource.name ?? '').trim() === name.trim(),
    )

  function initialize() {
    if (!selectedCheckpoint.value && visibleCheckpoints.value.length > 0) {
      selectedCheckpoint.value = visibleCheckpoints.value[0] || null
    }

    if (!selectedSampler.value && allSamplers.value.length > 0) {
      selectedSampler.value = allSamplers.value[0] || null
    }
  }

  function selectCheckpointByName(name: string) {
    const trimmed = name.trim()
    selectedCheckpoint.value =
      allCheckpoints.value.find(
        (resource) => (resource.name ?? '').trim() === trimmed,
      ) || null
  }

  function selectSamplerByName(name: string) {
    const trimmed = name.trim()
    const found = allSamplers.value.find(
      (sampler) => (sampler.name ?? '').trim() === trimmed,
    )

    if (!found) {
      console.warn(`[❌ Sampler Not Found] "${name}"`)
    }

    selectedSampler.value = found || null
  }

  function findCheckpointByName(name: string): Partial<Resource> | undefined {
    const trimmed = name.trim()
    return allCheckpoints.value.find(
      (resource) => (resource.name ?? '').trim() === trimmed,
    )
  }

  async function fetchCurrentModelFromApi(force = false) {
    if (!force && currentApiModel.value) return
    if (fetchModelPromise.value) return fetchModelPromise.value

    fetchModelPromise.value = (async () => {
      modelLoading.value = true

      try {
        const res = await performFetch<string>('/api/art/sd/currentModel')

        if (res.success && res.data) {
          currentApiModel.value = res.data

          const matchingCheckpoint = findCheckpointByName(res.data)
          if (matchingCheckpoint) {
            selectedCheckpoint.value = matchingCheckpoint
          }

          return
        }

        errorStore.setError(
          ErrorType.GENERAL_ERROR,
          res.message || 'Model fetch failed.',
        )
        currentApiModel.value = null
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, error)
        currentApiModel.value = null
      } finally {
        modelLoading.value = false
        fetchModelPromise.value = null
      }
    })()

    return fetchModelPromise.value
  }

  async function setCurrentModelInApi(name: string) {
    modelUpdating.value = true

    try {
      const res = await performFetch('/api/art/sd/setModel', {
        method: 'POST',
        body: JSON.stringify({ checkpoint: name }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success) {
        currentApiModel.value = name
        selectCheckpointByName(name)
      } else {
        errorStore.setError(
          ErrorType.GENERAL_ERROR,
          res.message || 'Failed to set current model.',
        )
      }

      return res
    } catch (error) {
      errorStore.setError(ErrorType.NETWORK_ERROR, error)
      throw error
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
