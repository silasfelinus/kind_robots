// /stores/artTrainerStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'
import type { ArtJobRecord } from '@/stores/artJobStore'

export type ArtTrainerRedoMode = 'TEXT' | 'IMG2IMG'
export type ArtTrainerRedoModel = 'SDXL' | 'KONTEXT'

export type ArtTrainerRedoInput = {
  mode: ArtTrainerRedoMode
  model: ArtTrainerRedoModel
  promptString: string
}

type TrainerRedoResponse = {
  job: ArtJobRecord
  sourceJobId: number
  sourceArtImageId: number
  mode: ArtTrainerRedoMode
  model: ArtTrainerRedoModel
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('The source image could not be read.'))
    reader.readAsDataURL(blob)
  })
}

export const useArtTrainerStore = defineStore('artTrainerStore', () => {
  const submittingJobIds = ref<number[]>([])
  const error = ref<string | null>(null)

  function isSubmitting(jobId: number): boolean {
    return submittingJobIds.value.includes(jobId)
  }

  async function sourceImageDataUri(artImageId: number): Promise<string> {
    const response = await fetch(`/api/art/images/${artImageId}/file`, {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(
        `The finished image could not be loaded for img2img (${response.status}).`,
      )
    }
    return blobToDataUri(await response.blob())
  }

  async function queueRedo(
    job: ArtJobRecord,
    input: ArtTrainerRedoInput,
  ): Promise<{ success: boolean; message: string; jobId: number | null }> {
    if (isSubmitting(job.id)) {
      return { success: false, message: 'This revision is already being queued.', jobId: null }
    }

    submittingJobIds.value = [...submittingJobIds.value, job.id]
    error.value = null

    try {
      const promptString = input.promptString.trim()
      if (promptString.length < 3) {
        throw new Error('Add a usable revised prompt before queuing the redo.')
      }
      if (input.mode === 'IMG2IMG' && (!job.artImageId || job.artImageId <= 0)) {
        throw new Error('This finished job has no ArtImage to use as img2img input.')
      }

      const sourceImageBase64 =
        input.mode === 'IMG2IMG' && job.artImageId
          ? await sourceImageDataUri(job.artImageId)
          : undefined

      const response = await performFetch<TrainerRedoResponse>(
        `/api/art/queue/${job.id}/trainer-redo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: input.mode,
            model: input.mode === 'TEXT' ? 'SDXL' : input.model,
            promptString,
            ...(sourceImageBase64 ? { sourceImageBase64 } : {}),
          }),
        },
        0,
        60_000,
      )

      const jobId = Number(response.data?.job?.id)
      if (!response.success || !Number.isInteger(jobId) || jobId <= 0) {
        throw new Error(response.message || 'Trainer revision could not be queued.')
      }

      return {
        success: true,
        message: response.message || `Queued trainer revision as ArtJob ${jobId}.`,
        jobId,
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Trainer revision could not be queued.'
      error.value = message
      return { success: false, message, jobId: null }
    } finally {
      submittingJobIds.value = submittingJobIds.value.filter((id) => id !== job.id)
    }
  }

  return {
    submittingJobIds,
    error,
    isSubmitting,
    queueRedo,
  }
})
