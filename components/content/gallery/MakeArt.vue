<template>
  <div class="bg-base p-8">
    <input
      v-model="userText"
      class="input input-bordered w-full mb-4"
      placeholder="Enter your text here"
    />
    <div class="space-y-4">
      <!-- Repeating labels with Tailwind and DaisyUI styling -->
      <div v-for="(value, key) in settings" :key="key" class="label">
        <span class="label-text capitalize">{{ key }}:</span>
        <input
          v-model="settings[key]"
          :type="typeof value"
          class="input input-bordered"
          :min="key === 'width' || key === 'height' ? 256 : undefined"
          :step="key === 'width' || key === 'height' ? 64 : undefined"
          :max="key === 'width' || key === 'height' ? 1024 : undefined"
        />
      </div>
    </div>
    <button class="btn btn-primary mt-4" @click="submit">Submit</button>
    <p class="mt-4 text-xl">
      {{ statusMessage }}
    </p>
    <div v-if="loading" class="mt-4">
      <div class="loader" />
      <!-- Loading animation -->
    </div>
    <div v-if="imageData" class="mt-4">
      <img :src="imageData" alt="Generated Image" class="max-w-full h-auto" />
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useStatusStore, StatusType } from '../../../stores/statusStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const userText = ref('')
const statusStore = useStatusStore()
const errorStore = useErrorStore()
const imageData = ref(null)
const loading = ref(false) // Declare a ref for loading state

const statusMessage = computed(() => statusStore.message)

const settings = ref({
  seed: -1,
  sampler_name: 'DDIM',
  batch_size: 1,
  n_iter: 1,
  steps: 20,
  cfg_scale: 7,
  width: 512,
  height: 512,
})

const submit = async () => {
  try {
    loading.value = true // Set loading to true when submitting
    statusStore.setStatus(StatusType.INFO, 'Submitting your text...')
    const body = {
      text: userText.value,
      settings: settings.value,
    }

    const response = await fetch(
      'https://cafefred.purrsalon.com/sdapi/v1/txt2img',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const result = await response.json()
    // Assuming the image data is in Base64 format and taking the first image from the array
    imageData.value = `data:image/png;base64,${result.images[0]}`

    statusStore.setStatus(StatusType.SUCCESS, 'Successfully submitted!')
  } catch (error) {
    console.error(error) // Log the error to the console for debugging

    // Extract the error message
    const errorMessage =
      error.response?.data?.message || error.message || 'Failed to submit text'

    errorStore.handleError(
      () => {
        throw error
      },
      ErrorType.NETWORK_ERROR,
      errorMessage,
    )
    statusStore.setStatus(StatusType.ERROR, errorMessage)
  } finally {
    loading.value = false // Set loading to false when done or on error
  }
}
</script>

<style>
.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
