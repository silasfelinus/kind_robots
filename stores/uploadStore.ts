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

export interface ImageUploadApplyData {
  artImageId: number
  artId: number
  imageData?: string | null
  imagePath?: string | null
  artImage: ArtImage
  art: Art
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
}

export interface ImageUploadResult {
  success: boolean
  message: string
  artImage?: ArtImage
  art?: Art
}

const allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']

export const useUploadStore = defineStore('UploadStore', () => {
  const activeTarget = ref<ImageUploadTarget | null>(null)
  const isUploading = ref(false)
  const error = ref<string | null>(null)
  const message = ref<string | null>(null)
  const lastArtImage = ref<ArtImage | null>(null)
  const lastArt = ref<Art | null>(null)

  const hasActiveTarget = computed(() => Boolean(activeTarget.value?.model))

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

      return {
        success: false,
        message: fallback,
      }
    } finally {
      isUploading.value = false
    }
  }

  return {
    activeTarget,
    isUploading,
    error,
    message,
    lastArtImage,
    lastArt,
    hasActiveTarget,
    setTarget,
    clearTarget,
    uploadForActiveTarget,
  }
})
