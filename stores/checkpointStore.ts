// /stores/checkpointStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'
import { validSamplers } from '@/stores/seeds/validSamplers'
import type { Resource } from '@prisma/client'
import { performFetch } from '@/stores/utils'
import { useErrorStore, ErrorType } from './errorStore'


export const useCheckpointStore = defineStore('checkpointStore', () => {
  const userStore = useUserStore()
  const modelUpdating = ref(false)

  const allCheckpoints = ref<Partial<Resource>[]>(validCheckpoints)
  const allSamplers = ref<Partial<Resource>[]>(validSamplers)

  const selectedCheckpoint = ref<Partial<Resource> | null>(null)
  const selectedSampler = ref<Partial<Resource> | null>(null)
  const currentApiModel = ref<string | null>(null)

  const visibleCheckpoints = computed(() =>
    allCheckpoints.value.filter((r) =>
      userStore.showMature ? true : !r.isMature,
    ),
  )

  const isValidSampler = (name: string) =>
    allSamplers.value.some((s) => s.name === name)

  const isValidCheckpoint = (name: string) =>
    allCheckpoints.value.some((r) => r.name === name)

  function selectCheckpointByName(name: string) {
    selectedCheckpoint.value =
      allCheckpoints.value.find((r) => r.name === name) || null
  }

  function selectSamplerByName(name: string) {
    selectedSampler.value =
      allSamplers.value.find((s) => s.name === name) || null
  }



async function fetchCurrentModelFromApi() {
  const errorStore = useErrorStore()

  try {
    const res = await performFetch<{ data: string }>('/api/art/sd/currentModel')

    if (res.success && res.data) {
      currentApiModel.value = res.data
    } else {
      errorStore.setError(ErrorType.GENERAL_ERROR, res.message || 'Model fetch failed.')
      currentApiModel.value = null
    }
  } catch (error) {
    errorStore.setError(ErrorType.NETWORK_ERROR, error)
    currentApiModel.value = null
  }
}

  async function setCurrentModelInApi(name: string) {
    const res = await performFetch('/api/art/sd/setModel', {
      method: 'POST',
      body: JSON.stringify({ checkpoint: name }),
    })

    if (res.success) {
      currentApiModel.value = name
    }

    return res
  }

  return {
    allCheckpoints,
    allSamplers,
    visibleCheckpoints,
    selectedCheckpoint,
    selectedSampler,
    currentApiModel,
    isValidSampler,
    isValidCheckpoint,
    selectCheckpointByName,
    selectSamplerByName,
    fetchCurrentModelFromApi,
    setCurrentModelInApi,
    modelUpdating,
  }
})
