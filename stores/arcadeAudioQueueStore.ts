import { ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import {
  arcadeAudioCueState,
  type ArcadeAudioQueueData,
  type ArcadeAudioQueueEntry,
} from '~/utils/arcade/audioQueue'

type ApprovalReceipt = {
  jobKey: string
  jobId: number
  status: string
  reused: boolean
}

export const useArcadeAudioQueueStore = defineStore('arcadeAudioQueue', () => {
  const queue = ref<ArcadeAudioQueueData | null>(null)
  const loading = ref(false)
  const approving = ref<string | null>(null)
  const message = ref('')
  const error = ref('')

  function clear() {
    queue.value = null
    approving.value = null
    error.value = ''
    message.value = ''
  }

  async function load() {
    if (!useUserStore().isAdmin || loading.value) return
    loading.value = true
    error.value = ''
    try {
      const response = await performFetch<ArcadeAudioQueueData>(
        '/api/arcade/audio-jobs',
      )
      if (response.success && Array.isArray(response.data?.entries)) {
        queue.value = response.data
      } else {
        error.value = response.message || 'Could not load soundtrack cues.'
      }
    } finally {
      loading.value = false
    }
  }

  function canApprove(entry: ArcadeAudioQueueEntry): boolean {
    return (
      useUserStore().isAdmin &&
      queue.value !== null &&
      arcadeAudioCueState(entry, queue.value).eligible &&
      approving.value === null
    )
  }

  async function approve(entry: ArcadeAudioQueueEntry): Promise<boolean> {
    if (!canApprove(entry)) return false
    approving.value = entry.jobKey
    error.value = ''
    message.value = ''
    try {
      const response = await performFetch<ApprovalReceipt>(
        '/api/arcade/audio-jobs',
        {
          method: 'POST',
          body: JSON.stringify({
            game: entry.game,
            cue: entry.cue,
            approve: true,
          }),
        },
      )
      if (!response.success || !response.data?.jobId) {
        error.value = response.message || 'Approval was not accepted.'
        return false
      }
      message.value = response.data.reused
        ? 'Existing private render reused.'
        : 'Private render queued for processing.'
      await load()
      return true
    } finally {
      approving.value = null
    }
  }

  return {
    queue,
    loading,
    approving,
    message,
    error,
    clear,
    load,
    canApprove,
    approve,
  }
})
