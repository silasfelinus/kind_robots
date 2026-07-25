// /stores/resourceGalleryStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ArtImage, Resource } from '~/prisma/generated/prisma/client'
import { handleError, performFetch } from '@/stores/utils'

export type ResourcePreviewArtImage = Pick<
  ArtImage,
  | 'id'
  | 'imagePath'
  | 'path'
  | 'thumbnailPath'
  | 'fileName'
  | 'fileType'
  | 'isMature'
>

export type ResourceGalleryRecord = Resource & {
  ArtImage?: ResourcePreviewArtImage | null
  _count?: {
    ArtImages: number
    UsedInImages: number
  }
}

type PreviewJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
}

type PreviewQueueResult = {
  jobId: number
  resourceId: number
  status: PreviewJob['status']
}

type PreviewStatusResult = {
  job: PreviewJob
  resource: ResourceGalleryRecord | null
}

export const useResourceGalleryStore = defineStore('resourceGalleryStore', () => {
  const resources = ref<ResourceGalleryRecord[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const previewJobs = ref<Record<number, PreviewJob>>({})

  function replaceResource(resource: ResourceGalleryRecord): void {
    const index = resources.value.findIndex((entry) => entry.id === resource.id)

    if (index === -1) {
      resources.value.push(resource)
    } else {
      resources.value[index] = resource
    }
  }

  async function loadResources(): Promise<ResourceGalleryRecord[]> {
    isLoading.value = true
    error.value = ''

    try {
      const response = await performFetch<ResourceGalleryRecord[]>('/api/resources')

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load Resources.')
      }

      resources.value = response.data
      return resources.value
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Failed to load Resources.'
      handleError(cause, 'loading Resource gallery')
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function getResource(id: number): Promise<ResourceGalleryRecord | null> {
    try {
      const response = await performFetch<ResourceGalleryRecord>(
        `/api/resources/${id}`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load Resource.')
      }

      replaceResource(response.data)
      return response.data
    } catch (cause) {
      handleError(cause, `loading Resource ${id}`)
      return null
    }
  }

  async function queuePreview(id: number): Promise<PreviewQueueResult | null> {
    try {
      const response = await performFetch<PreviewQueueResult>(
        `/api/resources/${id}/generate-preview`,
        { method: 'POST' },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to queue Resource preview.')
      }

      previewJobs.value[id] = {
        id: response.data.jobId,
        status: response.data.status,
      }
      return response.data
    } catch (cause) {
      handleError(cause, `queueing Resource ${id} preview`)
      throw cause
    }
  }

  async function refreshPreviewJob(
    resourceId: number,
    jobId: number,
  ): Promise<PreviewStatusResult | null> {
    try {
      const response = await performFetch<PreviewStatusResult>(
        `/api/resources/${resourceId}/preview-job/${jobId}`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to inspect preview job.')
      }

      previewJobs.value[resourceId] = response.data.job

      if (response.data.resource) {
        replaceResource(response.data.resource)
      }

      return response.data
    } catch (cause) {
      handleError(cause, `checking Resource ${resourceId} preview`)
      return null
    }
  }

  async function waitForPreview(
    resourceId: number,
    jobId: number,
    attempts = 120,
  ): Promise<ResourceGalleryRecord | null> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await refreshPreviewJob(resourceId, jobId)

      if (!result) return null
      if (result.resource) return result.resource
      if (result.job.status === 'FAILED' || result.job.status === 'CANCELLED') {
        throw new Error(result.job.error || `Preview job ${result.job.status}.`)
      }

      await new Promise((resolve) => window.setTimeout(resolve, 2500))
    }

    throw new Error('Preview generation is still running. Check the ArtJob queue.')
  }

  async function generatePreview(
    resourceId: number,
  ): Promise<ResourceGalleryRecord | null> {
    const queued = await queuePreview(resourceId)
    if (!queued) return null
    return await waitForPreview(resourceId, queued.jobId)
  }

  async function uploadPreview(input: {
    resourceId: number
    imageData: string
    fileName: string
    fileType?: string
  }): Promise<ResourceGalleryRecord | null> {
    try {
      const response = await performFetch<{
        artImageId: number
        resource: ResourceGalleryRecord
      }>(`/api/resources/${input.resourceId}/preview-image`, {
        method: 'POST',
        body: JSON.stringify({
          imageData: input.imageData,
          fileName: input.fileName,
          fileType: input.fileType,
        }),
      })

      if (!response.success || !response.data?.resource) {
        throw new Error(response.message || 'Failed to upload Resource preview.')
      }

      replaceResource(response.data.resource)
      return response.data.resource
    } catch (cause) {
      handleError(cause, `uploading Resource ${input.resourceId} preview`)
      throw cause
    }
  }

  return {
    resources,
    isLoading,
    error,
    previewJobs,
    loadResources,
    getResource,
    queuePreview,
    refreshPreviewJob,
    waitForPreview,
    generatePreview,
    uploadPreview,
  }
})
