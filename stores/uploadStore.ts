// /stores/uploadStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

export type ImageUploadModel =
  | 'ArtImage'
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
  imageData?: string | null
  imagePath?: string | null
  artImage: ArtImage
}

export interface CollectionApplyData {
  artImageIds: number[]
  collectionLabel: string
  artImages: ArtImage[]
  connectedModelType?: ConnectableModel | null
  connectedModelId?: number | null
}

export interface ImageUploadTarget {
  model: ImageUploadModel
  modelId?: number | null
  galleryId?: number | null
  galleryName?: string
  collectionId?: number | null
  collectionLabel?: string | null
  promptString?: string
  artPrompt?: string
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

  const uploadProgress = ref(0)
  const uploadTotal = ref(0)
  const lastBatchArtImages = ref<ArtImage[]>([])

  const hasActiveTarget = computed(() => Boolean(activeTarget.value?.model))

  const uploadPercent = computed(() => {
    if (uploadTotal.value <= 0) return 0
    return Math.round((uploadProgress.value / uploadTotal.value) * 100)
  })

  function setTarget(target: ImageUploadTarget): void {
    activeTarget.value = {
      galleryId: 21,
      galleryName: 'userUpload',
      collectionId: null,
      collectionLabel: null,
      promptString: '[UploadedImage]',
      artPrompt: '[UploadedImage]',
      path: '[UploadedImage]',
      buttonLabel: 'Upload image',
      icon: 'kind-icon:camera',
      showPreview: true,
      ...target,
      model: target.model === 'ArtImage' ? 'ArtImage' : target.model,
    }

    error.value = null
    message.value = null
  }

  function clearTarget(): void {
    activeTarget.value = null
    error.value = null
    message.value = null
    lastArtImage.value = null
    lastBatchArtImages.value = []
    uploadProgress.value = 0
    uploadTotal.value = 0
  }

  function validateFile(file: File): string | null {
    return allowedFileTypes.includes(file.type)
      ? null
      : 'PNG, JPEG, or WebP only'
  }

  function appendOptionalString(
    formData: FormData,
    key: string,
    value: string | null | undefined,
  ): void {
    const cleanValue = typeof value === 'string' ? value.trim() : ''
    if (cleanValue) formData.append(key, cleanValue)
  }

  function appendOptionalNumber(
    formData: FormData,
    key: string,
    value: number | null | undefined,
  ): void {
    if (typeof value === 'number' && Number.isFinite(value)) {
      formData.append(key, String(value))
    }
  }

  function getCurrentUser() {
    const userStore = useUserStore()

    return {
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      username: userStore.username ?? userStore.user?.username ?? 'Kind Guest',
    }
  }

  function getSelectedCollectionId(target: ImageUploadTarget): number | null {
    const collectionStore = useCollectionStore()
    const targetCollectionId = target.collectionId ?? null

    if (targetCollectionId && targetCollectionId > 0) {
      return targetCollectionId
    }

    const selectedCollectionId = collectionStore.currentCollection?.id ?? null

    return selectedCollectionId && selectedCollectionId > 0
      ? selectedCollectionId
      : null
  }

  function getSelectedCollectionLabel(
    target: ImageUploadTarget,
    fallback?: string,
  ): string {
    const collectionStore = useCollectionStore()

    return (
      collectionStore.currentCollection?.label?.trim() ||
      fallback?.trim() ||
      target.collectionLabel?.trim() ||
      'My Uploads'
    )
  }

  function buildUploadFormData(
    file: File,
    target: ImageUploadTarget,
    userId: number,
    username: string,
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
  ): FormData {
    const formData = new FormData()
    const galleryId = target.galleryId ?? 21
    const galleryName = target.galleryName ?? 'userUpload'
    const collectionId = getSelectedCollectionId(target)

    formData.append('image', file)
    formData.append('galleryName', galleryName)
    formData.append('galleryId', String(galleryId))
    formData.append('userId', String(userId))
    formData.append('fileType', file.type)
    formData.append('fileName', file.name)
    formData.append('designer', username)

    appendOptionalString(
      formData,
      'promptString',
      target.promptString || target.artPrompt || '[UploadedImage]',
    )
    appendOptionalString(
      formData,
      'artPrompt',
      target.artPrompt || target.promptString || '[UploadedImage]',
    )
    appendOptionalString(formData, 'path', target.path || '[UploadedImage]')
    appendOptionalString(formData, 'collectionLabel', collectionLabel)

    appendOptionalNumber(formData, 'artCollectionId', collectionId)
    appendOptionalNumber(formData, 'collectionId', collectionId)

    if (connectedModelType && connectedModelId) {
      formData.append('connectedModelType', connectedModelType)
      formData.append('connectedModelId', String(connectedModelId))
    }

    return formData
  }

  async function attachImageToSelectedCollection(
    artImage: ArtImage,
    target: ImageUploadTarget,
    collectionLabel?: string,
  ): Promise<void> {
    const collectionStore = useCollectionStore()
    const selectedCollection = collectionStore.currentCollection
    const selectedCollectionId =
      target.collectionId && target.collectionId > 0
        ? target.collectionId
        : selectedCollection?.id

    if (selectedCollectionId && selectedCollectionId > 0) {
      if (typeof collectionStore.addArtImageToCollection === 'function') {
        await collectionStore.addArtImageToCollection({
          artImageId: artImage.id,
          collectionId: selectedCollectionId,
        })
      }
      return
    }

    const label = collectionLabel?.trim() || target.collectionLabel?.trim()

    if (!label) return

    if (typeof collectionStore.addArtImageToCollection === 'function') {
      await collectionStore.addArtImageToCollection({
        artImageId: artImage.id,
        label,
      })
    }
  }

  async function uploadSingleFile(
    file: File,
    target: ImageUploadTarget,
    userId: number,
    username: string,
    collectionLabel?: string,
    connectedModelType?: ConnectableModel | null,
    connectedModelId?: number | null,
  ): Promise<ArtImage> {
    const artStore = useArtStore()

    const formData = buildUploadFormData(
      file,
      target,
      userId,
      username,
      collectionLabel,
      connectedModelType,
      connectedModelId,
    )

    const uploadResult = await artStore.uploadImage(formData)

    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.message || 'Image upload failed.')
    }

    const artImage = uploadResult.data

    await attachImageToSelectedCollection(artImage, target, collectionLabel)

    return artImage
  }

  async function uploadForActiveTarget(file: File): Promise<ImageUploadResult> {
    const target = activeTarget.value

    if (!target) {
      error.value = 'No upload target selected.'
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
      const { userId, username } = getCurrentUser()

      const artImage = await uploadSingleFile(file, target, userId, username)

      lastArtImage.value = artImage

      if (target.applyImage) {
        await target.applyImage({
          artImageId: artImage.id,
          imageData: artImage.imageData,
          imagePath: artImage.imagePath || artImage.path,
          artImage,
        })
      }

      message.value = 'Image uploaded.'

      return {
        success: true,
        message: message.value,
        artImage,
      }
    } catch (caught) {
      const fallback =
        caught instanceof Error ? caught.message : 'Upload failed.'
      error.value = fallback

      return {
        success: false,
        message: fallback,
      }
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
      error.value = 'No upload target selected.'
      return {
        succeeded: [],
        failed: [{ success: false, message: 'No upload target selected.' }],
        total: 0,
      }
    }

    const validFiles = files.filter((file) => !validateFile(file))

    if (!validFiles.length) {
      error.value = 'No valid image files to upload.'
      return {
        succeeded: [],
        failed: [],
        total: 0,
      }
    }

    isUploading.value = true
    uploadProgress.value = 0
    uploadTotal.value = validFiles.length
    error.value = null
    message.value = null
    lastBatchArtImages.value = []

    const { userId, username } = getCurrentUser()
    const label = getSelectedCollectionLabel(target, collectionLabel)
    const succeeded: ImageUploadResult[] = []
    const failed: ImageUploadResult[] = []

    for (const file of validFiles) {
      try {
        const artImage = await uploadSingleFile(
          file,
          target,
          userId,
          username,
          label,
          connectedModelType,
          connectedModelId,
        )

        lastBatchArtImages.value.push(artImage)
        lastArtImage.value = artImage

        succeeded.push({
          success: true,
          message: `${file.name} uploaded.`,
          fileName: file.name,
          artImage,
        })
      } catch (caught) {
        const fallback =
          caught instanceof Error ? caught.message : 'Upload failed.'

        failed.push({
          success: false,
          message: fallback,
          fileName: file.name,
        })
      } finally {
        uploadProgress.value++
      }
    }

    if (target.applyCollection && lastBatchArtImages.value.length) {
      await target.applyCollection({
        artImageIds: lastBatchArtImages.value.map((image) => image.id),
        collectionLabel: label,
        artImages: [...lastBatchArtImages.value],
        connectedModelType: connectedModelType ?? null,
        connectedModelId: connectedModelId ?? null,
      })
    }

    const skipped = files.length - validFiles.length
    const parts: string[] = [
      `${succeeded.length} image${succeeded.length === 1 ? '' : 's'} uploaded to "${label}"`,
    ]

    if (failed.length) parts.push(`${failed.length} failed`)
    if (skipped) parts.push(`${skipped} skipped, invalid type`)

    message.value = parts.join(' · ')
    isUploading.value = false

    return {
      succeeded,
      failed,
      total: validFiles.length,
    }
  }

  return {
    activeTarget,
    isUploading,
    error,
    message,
    lastArtImage,
    hasActiveTarget,
    uploadProgress,
    uploadTotal,
    uploadPercent,
    lastBatchArtImages,
    setTarget,
    clearTarget,
    validateFile,
    uploadForActiveTarget,
    uploadBatchForActiveTarget,
  }
})
