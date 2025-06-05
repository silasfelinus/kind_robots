// /stores/checkpointStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './userStore'
import { validCheckpoints } from '@/stores/seeds/validCheckpoints'
import { validSamplers } from '@/stores/seeds/validSamplers'
import type { Resource } from '@prisma/client'

export const useCheckpointStore = defineStore('checkpointStore', () => {
  const userStore = useUserStore()

  const allCheckpoints = ref<Partial<Resource>[]>(validCheckpoints)
  const allSamplers = ref<Partial<Resource>[]>(validSamplers)

  const selectedCheckpoint = ref<Partial<Resource> | null>(null)
  const selectedSampler = ref<Partial<Resource> | null>(null)

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

  return {
    allCheckpoints,
    allSamplers,
    visibleCheckpoints,
    selectedCheckpoint,
    selectedSampler,
    isValidSampler,
    isValidCheckpoint,
    selectCheckpointByName,
    selectSamplerByName,
  }
})
