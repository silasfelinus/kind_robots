<!-- /components/art/image-upload.vue -->
<template>
  <section
    class="flex w-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/png, image/jpeg, image/webp"
      class="hidden"
      @change="handleUpload"
    />

    <button
      type="button"
      class="btn btn-primary rounded-2xl"
      :disabled="imageUploadStore.isUploading"
      @click="fileInput?.click()"
    >
      <Icon :name="icon" class="h-5 w-5" />
      <span>{{ buttonLabel }}</span>
    </button>

    <p v-if="imageUploadStore.message" class="text-sm text-success">
      {{ imageUploadStore.message }}
    </p>

    <p v-if="imageUploadStore.error" class="text-sm text-error">
      {{ imageUploadStore.error }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUploadStore } from '@/stores/uploadStore'

const imageUploadStore = useUploadStore()
const fileInput = ref<HTMLInputElement | null>(null)

const icon = computed(
  () => imageUploadStore.activeTarget?.icon ?? 'kind-icon:camera',
)
const buttonLabel = computed(
  () => imageUploadStore.activeTarget?.buttonLabel ?? 'Upload image',
)

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  await imageUploadStore.uploadForActiveTarget(file)

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
