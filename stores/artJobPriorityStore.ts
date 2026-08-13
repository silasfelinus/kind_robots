// /stores/artJobPriorityStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'
// Shared with the endpoint that validates them (utils/artJobPriority.ts) so the
// dashboard cannot offer a value the API rejects.
import {
  BACK_OF_QUEUE_PRIORITY,
  FRONT_OF_QUEUE_PRIORITY,
  NORMAL_QUEUE_PRIORITY,
} from '@/utils/artJobPriority'

export const useArtJobPriorityStore = defineStore('artJobPriorityStore', () => {
  const prioritizingJobIds = ref<number[]>([])
  const error = ref<string | null>(null)

  async function setPriority(id: number, priority: number): Promise<boolean> {
    if (prioritizingJobIds.value.includes(id)) return false

    const artJobStore = useArtJobStore()
    prioritizingJobIds.value = [...prioritizingJobIds.value, id]
    error.value = null

    try {
      const res = await performFetch<{ job: ArtJobRecord }>(
        `/api/art/queue/${id}/priority`,
        {
          method: 'POST',
          body: JSON.stringify({ priority }),
        },
      )

      if (!res.success || !res.data?.job) {
        error.value = res.message || `Failed to update priority for job ${id}.`
        artJobStore.error = error.value
        return false
      }

      await Promise.all([artJobStore.fetchJobs(), artJobStore.fetchStats()])
      return true
    } finally {
      prioritizingJobIds.value = prioritizingJobIds.value.filter(
        (jobId) => jobId !== id,
      )
    }
  }

  function moveToFront(id: number): Promise<boolean> {
    return setPriority(id, FRONT_OF_QUEUE_PRIORITY)
  }

  function returnToNormal(id: number): Promise<boolean> {
    return setPriority(id, NORMAL_QUEUE_PRIORITY)
  }

  // Below every bulk lane in use, so a demoted job loses to the existing
  // backlog instead of landing in the middle of it.
  function sendToBack(id: number): Promise<boolean> {
    return setPriority(id, BACK_OF_QUEUE_PRIORITY)
  }

  return {
    prioritizingJobIds,
    error,
    setPriority,
    moveToFront,
    returnToNormal,
    sendToBack,
  }
})
