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

  // Batch state
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
    if (!allowedFileTypes.includes(file.type)) {
      return 'PNG, JPEG, or WebP only'
    }
    return null
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
      const artStore = useArtStore()
      const userStore = useUserStore()
      const collectionStore = useCollectionStore()

      const userId = userStore.userId ?? userStore.user?.id ?? 10
      const username =
        userStore.username ?? userStore.user?.username ?? 'Kind Guest'

      const formData = new FormData()
      formData.append('image', file)
      formData.append('galleryName', target.galleryName ?? 'userUpload')
      formData.append('galleryId', String(target.galleryId ?? 21))
      formData.append('userId', String(userId))
      formData.append('fileType', file.type)

      await artStore.uploadImage(formData)

      const uploadedImage = artStore.artImages.at(-1)

      if (!uploadedImage?.id) {
        throw new Error('Upload returned no ArtImage')
      }

      lastArtImage.value = uploadedImage

      const createdArt = await artStore.createArt({
        promptString: target.promptString ?? '[UploadedImage]',
        path: target.path ?? '[UploadedImage]',
        seed: null,
        steps: null,
        galleryId: target.galleryId ?? 21,
        promptId: null,
        pitchId: null,
        userId,
        designer: username,
        artImageId: uploadedImage.id,
      })

      if (!createdArt?.id) {
        throw new Error('Art creation failed')
      }

      lastArt.value = createdArt

      await artStore.updateArtImageWithArtId(uploadedImage.id, createdArt.id)

      if (target.collectionLabel) {
        await collectionStore.addArtToCollection({
          artId: createdArt.id,
          label: target.collectionLabel,
        })
      }

      if (target.applyImage) {
        await target.applyImage({
          artImageId: uploadedImage.id,
          artId: createdArt.id,
          imageData: uploadedImage.imageData,
          imagePath: createdArt.path,
          artImage: uploadedImage,
          art: createdArt,
        })
      }

      message.value = 'Image uploaded'

      return {
        success: true,
        message: message.value,
        artImage: uploadedImage,
        art: createdArt,
      }
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

    const artStore = useArtStore()
    const userStore = useUserStore()
    const collectionStore = useCollectionStore()

    const userId = userStore.userId ?? userStore.user?.id ?? 10
    const username =
      userStore.username ?? userStore.user?.username ?? 'Kind Guest'
    const label =
      collectionLabel?.trim() || target.collectionLabel || 'My Uploads'

    const succeeded: ImageUploadResult[] = []
    const failed: ImageUploadResult[] = []

    for (const file of validFiles) {
      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('galleryName', target.galleryName ?? 'userUpload')
        formData.append('galleryId', String(target.galleryId ?? 21))
        formData.append('userId', String(userId))
        formData.append('fileType', file.type)

        await artStore.uploadImage(formData)
        const uploadedImage = artStore.artImages.at(-1)

        if (!uploadedImage?.id) throw new Error('Upload returned no ArtImage')

        const createdArt = await artStore.createArt({
          promptString: target.promptString ?? '[UploadedImage]',
          path: target.path ?? '[UploadedImage]',
          seed: null,
          steps: null,
          galleryId: target.galleryId ?? 21,
          promptId: null,
          pitchId: null,
          userId,
          designer: username,
          artImageId: uploadedImage.id,
        })

        if (!createdArt?.id) throw new Error('Art creation failed')

        await artStore.updateArtImageWithArtId(uploadedImage.id, createdArt.id)

        await collectionStore.addArtToCollection({
          artId: createdArt.id,
          label,
        })

        lastBatchArts.value.push(createdArt)
        lastBatchArtImages.value.push(uploadedImage)
        lastArt.value = createdArt
        lastArtImage.value = uploadedImage

        succeeded.push({
          success: true,
          message: `${file.name} uploaded`,
          fileName: file.name,
          artImage: uploadedImage,
          art: createdArt,
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
