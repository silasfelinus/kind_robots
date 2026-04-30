<!-- /components/content/user/avatar-upload.vue -->
<template>
  <div v-if="userStore.isLoggedIn" class="relative group">
    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="hidden"
      @change="uploadAvatar"
    />

    <button
  type="button"
  class="flex h-7 w-7 items-center justify-center rounded-full border border-base-300 bg-base-100 shadow hover:border-primary hover:bg-base-200"
  :disabled="isUploading"
  :title="isUploading ? 'Uploading...' : 'Upload new avatar'"
  @click="fileInput?.click()"
>
      <icon
        :name="isUploading ? 'kind-icon:spinner' : 'kind-icon:camera'"
        class="h-4 w-4"
        :class="isUploading ? 'animate-spin' : ''"
      />
    </button>

    <!-- Tooltip -->
    <span
      class="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-base-300 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
    >
      {{ isUploading ? 'Uploading...' : uploadSuccess ? '✓ Done' : 'Upload avatar' }}
    </span>

    <div v-if="uploadError" class="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-error/90 px-2 py-1 text-xs text-error-content">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

const artStore = useArtStore()
const userStore = useUserStore()
const collectionStore = useCollectionStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref(false)

const userId = computed(() => userStore.userId)
const username = computed(() => userStore.username)

async function uploadAvatar(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return

  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) {
    uploadError.value = 'PNG, JPEG, or WebP only'
    return
  }

  const formData = new FormData()
  formData.append('image', file)
  formData.append('galleryName', 'userUpload')
  formData.append('userId', userId.value?.toString() || '10')
  formData.append('galleryId', '21')
  formData.append('fileType', file.type)

  isUploading.value = true
  uploadError.value = null
  uploadSuccess.value = false

  try {
    await artStore.uploadImage(formData)
    const artImage = artStore.artImages.at(-1)
    if (!artImage?.id) throw new Error('Upload returned no image')

    const newArt = await artStore.createArt({
      promptString: '[AvatarImage]',
      path: '[AvatarImage]',
      userId: userId.value,
      designer: username.value || 'Kind Guest',
      artImageId: artImage.id,
      seed: null,
      steps: null,
      galleryId: null,
      promptId: null,
      pitchId: null,
    })

    if (!newArt?.id) throw new Error('Art creation failed')

    await collectionStore.addArtToCollection({ artId: newArt.id, label: 'avatars' })
    await userStore.updateUserInfo({ id: userId.value, artImageId: artImage.id })

    uploadSuccess.value = true
    setTimeout(() => (uploadSuccess.value = false), 3000)
  } catch (error) {
    uploadError.value = 'Upload failed, please try again'
    setTimeout(() => (uploadError.value = null), 4000)
  } finally {
    isUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>
