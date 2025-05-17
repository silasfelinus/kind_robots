// /components/content/art/art-editor.vue
<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
    <h1 class="text-3xl font-bold text-center">Upload & Edit Artwork</h1>

    <p v-if="uploadStatus !== 'idle'" class="text-sm text-center">
      <span
        :class="{
          'text-success': uploadStatus === 'success',
          'text-error': uploadStatus === 'error',
          'text-info': uploadStatus === 'uploading',
        }"
      >
        {{ uploadMessage }}
      </span>
    </p>

    <p class="text-center text-base-content/70">
      Drop your image below to upload, then describe how you'd like it edited.
    </p>

    <!-- Upload Zone -->
    <div
      class="relative border-2 border-dashed border-accent rounded-2xl bg-base-200 p-6 text-center cursor-pointer hover:bg-base-300 transition-colors"
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileChange"
      />
      <div class="flex flex-col items-center justify-center space-y-2">
        <Icon name="kind-icon:upload" class="text-4xl text-primary" />
        <p class="text-base-content/70">
          <span v-if="!isDragging">Click or drag an image here to upload</span>
          <span v-else class="text-primary font-bold"
            >Release to upload 🚀</span
          >
        </p>
      </div>
    </div>

    <!-- Preview -->
    <div v-if="newArtImage" class="rounded-xl overflow-hidden border shadow">
      <image-view :image="newArtImage" class="w-full" />
    </div>

    <!-- Edit Controls -->
    <div v-if="newArtImage" class="space-y-4">
      <h2 class="text-xl font-semibold">Request Edits</h2>

      <div>
        <label class="label-text">Choose a preset style</label>
        <select v-model="selectedPreset" class="select select-bordered w-full">
          <option disabled value="">Select a preset</option>
          <option v-for="preset in presetOptions" :key="preset" :value="preset">
            {{ preset }}
          </option>
        </select>
      </div>

      <div>
        <label class="label-text">Describe your desired edit</label>
        <textarea
          v-model="editRequest"
          class="textarea textarea-bordered w-full"
          placeholder="e.g., Add a neon skyline in the background"
        />
      </div>

      <button class="btn btn-primary" @click="submitEdit">
        Submit Edit Request
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-editor.vue
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useEditStore } from '@/stores/editStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const editStore = useEditStore()
const userStore = useUserStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const selectedPreset = ref('')
const editRequest = ref('')

const presetOptions = computed(() => editStore.presets)
const newArtImage = computed(() => {
  const all = artStore.artImages
  return all.length > 0 ? all[all.length - 1] : null
})

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await uploadFile(file)
}

const uploadStatus = ref<'idle' | 'uploading' | 'error' | 'success'>('idle')
const uploadMessage = ref('')

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await uploadFile(file)
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadStatus.value = 'error'
    uploadMessage.value = 'File is not an image'
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', String(userStore.user?.id ?? 10))

  uploadStatus.value = 'uploading'
  uploadMessage.value = 'Uploading...'

  const { success, message } = await artStore.uploadImage(formData)

  uploadStatus.value = success ? 'success' : 'error'
  uploadMessage.value = message
}

async function submitEdit() {
  if (!newArtImage.value || (!editRequest.value && !selectedPreset.value)) {
    console.warn('Edit request requires either text or a preset.')
    uploadStatus.value = 'error'
    uploadMessage.value = 'Please describe an edit or choose a preset.'
    return
  }

  const response = await editStore.submitEdit({
    imageId: newArtImage.value.id,
    request: editRequest.value,
    preset: selectedPreset.value,
    userId: userStore.user?.id ?? 10,
  })

  if (response?.success) {
    selectedPreset.value = ''
    editRequest.value = ''
    uploadStatus.value = 'success'
    uploadMessage.value = 'Edit request submitted successfully!'
  } else {
    uploadStatus.value = 'error'
    uploadMessage.value = response?.message || 'Failed to submit edit.'
  }

  console.log('[Edit Submitted]', response)
}
</script>
