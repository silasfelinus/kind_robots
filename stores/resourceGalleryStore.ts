// /stores/resourceGalleryStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ArtImage, Resource } from '~/prisma/generated/prisma/client'
import { handleError, performFetch } from '@/stores/utils'
import { blobToDataUri } from '~/utils/artImageSource'
import { useUserStore } from '@/stores/userStore'

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
}

/**
 * One image in a Resource's gallery, tagged with every route that claimed it.
 * `origins` is the server's, not the client's: an image is routinely both the
 * generated preview and a LoRA use, and /api/resources/:id/gallery dedupes by
 * id rather than making the caller ask four times.
 */
export type ResourceArtImage = {
  id: number
  userId?: number | null
  createdAt?: string | null
  fileName?: string | null
  imagePath?: string | null
  path?: string | null
  thumbnailPath?: string | null
  cardPath?: string | null
  promptString?: string | null
  isMature?: boolean | null
  origins: string[]
}

/**
 * One of the model's upstream preview images (ResourcePreview).
 *
 * `Resource.previewImageUrl` is a single url and is normally the first of
 * these; a Civitai model version routinely ships several.
 */
export type ResourceUpstreamPreview = {
  id: number
  url: string
  sortOrder: number
  isMature: boolean
  width: number | null
  height: number | null
  blurHash: string | null
  mediaType: string | null
}

export type ResourceArtGallery = {
  resourceId: number
  /** A URL on the Resource row, not an ArtImage: Civitai's own cover. */
  civitaiPreviewUrl: string | null
  images: ResourceArtImage[]
  /** The rest of the upstream set, in the author's own order. */
  upstreamPreviews?: ResourceUpstreamPreview[]
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

export const useResourceGalleryStore = defineStore(
  'resourceGalleryStore',
  () => {
    const resources = ref<ResourceGalleryRecord[]>([])
    const isLoading = ref(false)
    const error = ref('')
    const previewJobs = ref<Record<number, PreviewJob>>({})

    /*
     * A Resource's full gallery, by resource id. AGENTS.md: "Components never
     * call APIs or localStorage directly. Stores own API calls, localStorage,
     * and state. This is the rule most often broken by well-meaning edits" --
     * and it was broken here first, by resource-art-gallery.vue reaching for
     * performFetch itself. Caching per id is the other half of why it belongs
     * here: the card back is opened and closed repeatedly over the same few
     * resources.
     */
    const resourceArt = ref<Record<number, ResourceArtGallery>>({})
    const resourceArtLoading = ref<Record<number, boolean>>({})
    const resourceArtError = ref<Record<number, string>>({})

    function replaceResource(resource: ResourceGalleryRecord): void {
      const index = resources.value.findIndex(
        (entry) => entry.id === resource.id,
      )

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
        const response =
          await performFetch<ResourceGalleryRecord[]>('/api/resources')

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

    async function getResource(
      id: number,
    ): Promise<ResourceGalleryRecord | null> {
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

    /**
     * Delete a Resource, optionally taking the images it produced with it.
     *
     * Silas, 2026-09-17: "we should also be able to delete resources, with the
     * option to cascade them to the generated image(s)."
     *
     * Returns what the server actually did rather than a bare boolean, because
     * the cascade is partial by design: images belonging to other people are
     * left in place, and the caller has to be able to say so.
     */
    async function deleteResource(
      id: number,
      options: { cascadeImages?: boolean } = {},
    ): Promise<{ deletedImages: number; keptImages: number } | null> {
      try {
        const query = options.cascadeImages ? '?cascade=images' : ''
        const response = await performFetch<{
          cascadeImages: boolean
          deletedImages: number
          keptImages: number
        }>(`/api/resources/${id}${query}`, { method: 'DELETE' })

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete Resource.')
        }

        resources.value = resources.value.filter((entry) => entry.id !== id)

        /*
         * Rest-destructured rather than `delete obj[key]`: the ESLint ratchet
         * counts @typescript-eslint/no-dynamic-delete and only ever allows it
         * to shrink. It also keeps these refs replaced rather than mutated,
         * which is what the reads above already assume.
         */
        const { [id]: _droppedJob, ...remainingJobs } = previewJobs.value
        previewJobs.value = remainingJobs

        const { [id]: _droppedArt, ...remainingArt } = resourceArt.value
        resourceArt.value = remainingArt

        return {
          deletedImages: response.data?.deletedImages ?? 0,
          keptImages: response.data?.keptImages ?? 0,
        }
      } catch (cause) {
        error.value =
          cause instanceof Error ? cause.message : 'Failed to delete Resource.'
        handleError(cause, `deleting Resource ${id}`)
        return null
      }
    }

    /**
     * Load every image that belongs to a Resource: its generated preview, the
     * Civitai preview URL, everything rendered with it as a LoRA or on it as a
     * checkpoint, and its entity art history.
     *
     * The viewer's maturity preference travels with the request, the same way
     * the art listings send it. The server still refuses a maturity-restricted
     * account whatever this says -- isMaturityRestricted reads the ROLE, so
     * `?showMature=true` cannot lift it.
     */
    async function loadResourceArt(
      id: number,
      options: { force?: boolean } = {},
    ): Promise<ResourceArtGallery | null> {
      if (!Number.isInteger(id) || id <= 0) return null
      if (resourceArtLoading.value[id]) return resourceArt.value[id] ?? null
      if (!options.force && resourceArt.value[id]) return resourceArt.value[id]

      const userStore = useUserStore()
      resourceArtLoading.value = { ...resourceArtLoading.value, [id]: true }
      const { [id]: _clearedError, ...restErrors } = resourceArtError.value
      resourceArtError.value = restErrors

      try {
        const query = userStore.showMature ? '?showMature=true' : ''
        const response = await performFetch<ResourceArtGallery>(
          `/api/resources/${id}/gallery${query}`,
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load images.')
        }

        resourceArt.value = { ...resourceArt.value, [id]: response.data }
        return response.data
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Failed to load images.'
        resourceArtError.value = { ...resourceArtError.value, [id]: message }
        handleError(cause, `loading art for Resource ${id}`)
        return null
      } finally {
        const { [id]: _done, ...rest } = resourceArtLoading.value
        resourceArtLoading.value = rest
      }
    }

    /*
     * BYTES FOR A GENERATION SOURCE.
     *
     * Silas, 2026-09-18: "we should be able to select them and modify them,
     * even if they come from a civitai sample."
     *
     * Two routes, because the two kinds of gallery image are not the same
     * thing. A generated ArtImage is ours and has a bytes route. An upstream
     * Civitai preview is a url on someone else's host, and a browser cannot
     * read cross-origin pixels back out of an <img> -- so the server fetches it
     * (see /api/resources/previews/:id/source, which takes a ROW id, never a
     * caller-supplied url).
     *
     * Both return a `data:` URI, which is the shape artForm.sourceImageBase64
     * and the enqueue payload already speak.
     */
    const sourceLoadingKeys = ref<string[]>([])

    function isSourceLoading(key: string): boolean {
      return sourceLoadingKeys.value.includes(key)
    }

    async function loadArtImageSource(artImageId: number): Promise<string> {
      const key = `art:${artImageId}`
      sourceLoadingKeys.value = [...sourceLoadingKeys.value, key]
      try {
        /*
         * This endpoint can return private/mature ArtImages to their owner, but
         * only when the browser sends the same Bearer token as performFetch.
         * credentials:'include' alone sends cookies, while Kind Robots auth is
         * token-backed, so owner-only images were always a 403 here.
         */
        const userStore = useUserStore()
        const token = userStore.token || userStore.user?.token || ''
        const headers = new Headers()
        if (token) headers.set('Authorization', `Bearer ${token}`)

        const response = await fetch(`/api/art/images/${artImageId}/file`, {
          credentials: 'include',
          cache: 'no-store',
          headers,
        })
        if (!response.ok) {
          throw new Error(
            `That image could not be loaded as a source (${response.status}).`,
          )
        }
        const blob = await response.blob()
        if (!blob.type.startsWith('image/')) {
          throw new Error(
            'That file is not an image, so it cannot be a source.',
          )
        }
        return await blobToDataUri(blob)
      } finally {
        sourceLoadingKeys.value = sourceLoadingKeys.value.filter(
          (entry) => entry !== key,
        )
      }
    }

    async function loadPreviewSource(previewId: number): Promise<string> {
      const key = `preview:${previewId}`
      sourceLoadingKeys.value = [...sourceLoadingKeys.value, key]
      try {
        const response = await performFetch<{ dataUri: string }>(
          `/api/resources/previews/${previewId}/source`,
        )
        if (!response.success || !response.data?.dataUri) {
          throw new Error(
            response.message || 'That preview could not be loaded as a source.',
          )
        }
        return response.data.dataUri
      } finally {
        sourceLoadingKeys.value = sourceLoadingKeys.value.filter(
          (entry) => entry !== key,
        )
      }
    }

    async function queuePreview(
      id: number,
    ): Promise<PreviewQueueResult | null> {
      try {
        const response = await performFetch<PreviewQueueResult>(
          `/api/resources/${id}/generate-preview`,
          { method: 'POST' },
        )

        if (!response.success || !response.data) {
          throw new Error(
            response.message || 'Failed to queue Resource preview.',
          )
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
        if (
          result.job.status === 'FAILED' ||
          result.job.status === 'CANCELLED'
        ) {
          throw new Error(
            result.job.error || `Preview job ${result.job.status}.`,
          )
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2500))
      }

      throw new Error(
        'Preview generation is still running. Check the ArtJob queue.',
      )
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
          throw new Error(
            response.message || 'Failed to upload Resource preview.',
          )
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
      resourceArt,
      resourceArtLoading,
      sourceLoadingKeys,
      isSourceLoading,
      loadArtImageSource,
      loadPreviewSource,
      resourceArtError,
      loadResources,
      getResource,
      loadResourceArt,
      deleteResource,
      queuePreview,
      refreshPreviewJob,
      waitForPreview,
      generatePreview,
      uploadPreview,
    }
  },
)
