// /stores/uploadStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

export type ImageUploadModel =
  | 'Art'
  | 'Bot'
  | 'Butterfly'
  | 'Character'
  | 'Chat'
  | 'Component'
  | 'Dream'
  | 'Pitch'
  | 'Prompt'
  | 'Reaction'
  | 'Resource'
  | 'Reward'
  | 'Scenario'
  | 'Tag'
  | 'User'

export type ConnectableModel =
  | 'ArtCollection'
  | 'Bot'
  | 'Character'
  | 'Dream'
  | 'Pitch'
  | 'Reward'
  | 'Scenario'

export interface ImageUploadApplyData {
  artImageId: number
  artId: number
  imageData?: string | null
  imagePath?: string | null
  artImage: ArtImage
  art: Art
}

export interface CollectionApplyData {
  artIds: number[]
  artImageIds: number[]
  collectionLabel: string
  arts: Art[]
  artImages: ArtImage[]
  connectedModelType?: ConnectableModel | null
  connectedModelId?: number | null
}

export interface ImageUploadTarget {
  model: ImageUploadModel
  modelId?: number | null
  galleryId?: number | null
  galleryName?: string
  collectionLabel?: string | null
  promptString?: string
  path?: string
  buttonLabel?: string
  icon?: string
  showPreview?: boolean
  applyImage?: (data: ImageUploadApplyData) => Promise<void> | void
  applyCollection?: (data: CollectionApplyData) => Promise<void> | void
}

export interface ImageUploadResult {
  success: boolean
  message: string
  fileName?: string
  artImage?: ArtImage
  art?: Art
}

export interface BatchUploadResult {
  succeeded: ImageUploadResult[]
  failed: ImageUploadResult[]
  total: number
}

const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

export const useUploadStore = defineStore('UploadStore', () => {
  const activeTarget = ref<ImageUploadTarget | null>(null)
  const isUploading = ref(false)
  const error = ref<string | null>(null)
  const message = ref<string | null>(null)
  const lastArtImage = ref<ArtImage | null>(null)
  const lastArt = ref<Art | null>(null)

  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const lastBatchArts = ref<Art[]>([])
  const lastBatchArtImages = ref<ArtImage[]>([])

  const hasActiveTarget = computed(() => Boolean(activeTarget.value?.model))
  const uploadPercent = computed(() =>
    uploadTotal.value > 0
      ? Math.round((uploadProgress.value / uploadTotal.value) * 100)
      : 0,
  )

  function setTarget(target: ImageUploadTarget): void {
    activeTarget.value = {
      galleryId: 21,
      galleryName: 'userUpload',
      collectionLabel: null,
      promptString: '[UploadedImage]',
      path: '[UploadedImage]',
      buttonLabel: 'Upload image',
      icon: 'kind-icon:camera',
      showPreview: true,
      ...target,
    }
    error.value = null
    message.value = null
  }

  function clearTarget(): void {
    activeTarget.value = null
    error.value = null
    message.value = null
    lastArtImage.value = null
    lastArt.value = null
    lastBatchArts.value = []
    lastBatchArtImages.value = []
    uploadProgress.value = 0
    uploadTotal.value = 0
  }

  function validateFile(file: File): string | null {
    return allowedFileTypes.includes(file.type)
      ? null
      : 'PNG, JPEG, or WebP only'
  }

  // ── Core per-file pipeline ────────────────────────────────────────────────
  // artStore.uploadImage returns { success, data } where data is the freshly
  // created ArtImage. We capture that return value directly — the previous bug
  // used artStore.artImages.at(-1) which returned whatever was already last in
  // the store array (image 343) instead of the image that was just created.
  async function uploadSingleFile(
    file: File,
    target: ImageUploadTarget,
    userId: number,
    username: string,
    collectionLabel?: string,
  ): Promise<{ artImage: ArtImage; art: Art }> {
    const artStore = useArtStore()
    const collectionStore = useCollectionStore()

    const galleryName = target.galleryName ?? 'userUpload'
    const galleryId = target.galleryId ?? 21

    // Step 1 — upload and capture the returned ArtImage directly.
    const formData = new FormData()
    formData.append('image', file)
    formData.append('galleryName', galleryName)
    formData.append('galleryId', String(galleryId))
    formData.append('userId', String(userId))
    formData.append('fileType', file.type)

    const uploadResult = await artStore.uploadImage(formData)

    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.message || 'Image upload failed')
    }

    const artImage = uploadResult.data // real ID, not .at(-1)

    // Step 2 — create Art record with the explicit artImageId from step 1.
    const art = await artStore.createArt({
      promptString: target.promptString ?? '[UploadedImage]',
      path: target.path ?? '[UploadedImage]',
      galleryId,
      userId,
      designer: username,
      artImageId: artImage.id,
      pitchId: null,
      promptId: null,
      seed: null,
      steps: null,
    })

    // Step 3 — back-link ArtImage → Art.
    await artStore.updateArtImageWithArtId(artImage.id, art.id)

    // Step 4 — add to collection if requested.
    const selectedCollection = collectionStore.currentCollection

    if (selectedCollection?.id && selectedCollection.id > 0) {
      await collectionStore.addArtToCollection({
        artId: art.id,
        collectionId: selectedCollection.id,
      })
    } else {
      const label = collectionLabel?.trim() || target.collectionLabel

      if (label) {
        await collectionStore.addArtToCollection({ artId: art.id, label })
      }
    }

    // Step 5 — push into store so the gallery updates without a full refresh.
    artStore.addOrUpdateArt(art)

    return { artImage, art }
  }

  async function uploadForActiveTarget(file: File): Promise<ImageUploadResult> {
    const target = activeTarget.value
    if (!target) {
      error.value = 'No upload target selected'
      return { success: false, message: error.value }
    }

    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      return { success: false, message: validationError }
    }

    isUploading.value = true
    error.value = null
    message.value = null

    try {
      const userStore = useUserStore()
      const userId = userStore.userId ?? userStore.user?.id ?? 10
      const username =
        userStore.username ?? userStore.user?.username ?? 'Kind Guest'

      const { artImage, art } = await uploadSingleFile(
        file,
        target,
        userId,
        username,
      )

      lastArtImage.value = artImage
      lastArt.value = art

      if (target.applyImage) {
        await target.applyImage({
          artImageId: artImage.id,
          artId: art.id,
          imageData: artImage.imageData,
          imagePath: art.path,
          artImage,
          art,
        })
      }

      message.value = 'Image uploaded'
      return { success: true, message: message.value, artImage, art }
    } catch (caught) {
      const fallback =
        caught instanceof Error ? caught.message : 'Upload failed'
      error.value = fallback
      return { success: false, message: fallback }
    } finally {
      isUploading.value = false
    }
  }

  async function uploadBatchForActiveTarget(
    files: File[],
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
  ): Promise<BatchUploadResult> {
    const target = activeTarget.value
    if (!target) {
      error.value = 'No upload target selected'
      return {
        succeeded: [],
        failed: [{ success: false, message: 'No upload target' }],
        total: 0,
      }
    }

    const validFiles = files.filter((f) => !validateFile(f))
    if (validFiles.length === 0) {
      error.value = 'No valid image files to upload'
      return { succeeded: [], failed: [], total: 0 }
    }

    isUploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = validFiles.length
    error.value = null
    message.value = null
    lastBatchArts.value = []
    lastBatchArtImages.value = []

    const userStore = useUserStore()
    const userId = userStore.userId ?? userStore.user?.id ?? 10
    const username =
      userStore.username ?? userStore.user?.username ?? 'Kind Guest'
    const selectedCollection = useCollectionStore().currentCollection

    const label =
      selectedCollection?.label?.trim() ||
      collectionLabel?.trim() ||
      target.collectionLabel ||
      'My Uploads'

    const succeeded: ImageUploadResult[] = []
    const failed: ImageUploadResult[] = []

    for (const file of validFiles) {
      try {
        const { artImage, art } = await uploadSingleFile(
          file,
          target,
          userId,
          username,
        )

        lastBatchArts.value.push(art)
        lastBatchArtImages.value.push(artImage)
        lastArt.value = art
        lastArtImage.value = artImage

        succeeded.push({
          success: true,
          message: `${file.name} uploaded`,
          fileName: file.name,
          artImage,
          art,
        })
      } catch (caught) {
        const msg = caught instanceof Error ? caught.message : 'Upload failed'
        failed.push({ success: false, message: msg, fileName: file.name })
      } finally {
        uploadProgress.value++
      }
    }

    if (target.applyCollection && lastBatchArts.value.length > 0) {
      await target.applyCollection({
        artIds: lastBatchArts.value.map((a) => a.id),
        artImageIds: lastBatchArtImages.value.map((i) => i.id),
        collectionLabel: label,
        arts: [...lastBatchArts.value],
        artImages: [...lastBatchArtImages.value],
        connectedModelType: connectedModelType ?? null,
        connectedModelId: connectedModelId ?? null,
      })
    }

    const skipped = files.length - validFiles.length
    const parts: string[] = [
      `${succeeded.length} image${succeeded.length !== 1 ? 's' : ''} uploaded to "${label}"`,
    ]
    if (failed.length) parts.push(`${failed.length} failed`)
    if (skipped) parts.push(`${skipped} skipped (invalid type)`)

    message.value = parts.join(' · ')
    isUploading.value = false

    return { succeeded, failed, total: validFiles.length }
  }

  return {
    activeTarget,
    isUploading,
    error,
    message,
    lastArtImage,
    lastArt,
    hasActiveTarget,
    uploadProgress,
    uploadTotal,
    uploadPercent,
    lastBatchArts,
    lastBatchArtImages,
    setTarget,
    clearTarget,
    validateFile,
    uploadForActiveTarget,
    uploadBatchForActiveTarget,
  }
})
