// /stores/artJobPriorityStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'

const FRONT_OF_QUEUE_PRIORITY = 100

export const useArtJobPriorityStore = defineStore('artJobPriorityStore', () => {
  const prioritizingJobIds = ref<number[]>([])
  const error = ref<string | null>(null)

  async function setPriority(id: number, priority: number): Promise<boolean> {
    if (prioritizingJobIds.value.includes(id)) return false

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
        return false
      }

      const artJobStore = useArtJobStore()
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
    return setPriority(id, 0)
  }

  return {
    prioritizingJobIds,
    error,
    setPriority,
    moveToFront,
    returnToNormal,
  }
})
