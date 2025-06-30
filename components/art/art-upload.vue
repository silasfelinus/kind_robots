<!-- /components/content/art/art-upload.vue -->
// /components/content/art/art-upload.vue
<template>
  <div class="w-full max-w-4xl mx-auto space-y-6 px-4 py-6">
    <h1 class="text-3xl font-bold text-center">Upload Your Artwork</h1>
    <p class="text-center text-base-content/70">
      Share your favorite images to use with our editing tools or just to keep
      in your gallery.
    </p>

    <!-- Image Upload Component -->
    <image-upload />

    <!-- Uploaded Image Preview -->
    <div v-if="newArtImage" class="border rounded-lg overflow-hidden shadow-md">
      <image-view :image="newArtImage" class="w-full" />
    </div>

    <!-- Editing Options -->
    <div v-if="newArtImage" class="space-y-4">
      <h2 class="text-xl font-semibold">Edit This Image</h2>

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
        <label class="label-text">Describe the edit you'd like to make</label>
        <textarea
          v-model="editRequest"
          class="textarea textarea-bordered w-full"
          placeholder="e.g., Make the background look like a stormy sky"
        />
      </div>

      <button class="btn btn-primary" @click="submitEdit">
        Submit Edit Request
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useEditStore } from './../../stores/editStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const editStore = useEditStore()
const userStore = useUserStore()

const newArtImage = computed(
  () => artStore.artImages[artStore.artImages.length - 1],
)

const editRequest = ref('')
const selectedPreset = ref('')
const presetOptions = computed(() => editStore.presets)

function submitEdit() {
  if (!newArtImage.value || (!editRequest.value && !selectedPreset.value)) {
    console.warn('Please provide an edit description or select a preset.')
    return
  }

  editStore.submitEdit({
    imageId: newArtImage.value.id,
    request: editRequest.value,
    preset: selectedPreset.value,
    userId: userStore.user?.id ?? 10,
  })
}
</script>
