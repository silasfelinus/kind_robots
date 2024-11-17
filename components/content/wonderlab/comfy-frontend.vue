<template>
  <div
    class="flex flex-col items-center space-y-6 p-6 max-w-lg mx-auto bg-base-200 rounded-lg shadow"
  >
    <h1 class="text-xl font-bold">Generate Art with ComfyUI</h1>
    <input
      v-model="prompt"
      type="text"
      placeholder="Enter your art prompt..."
      class="input input-bordered w-full"
    />
    <button
      :disabled="isLoading"
      class="btn btn-primary w-full"
      @click="generateArt"
    >
      {{ isLoading ? 'Generating...' : 'Generate Art' }}
    </button>
    <p v-if="error" class="text-error">{{ error }}</p>
    <div v-if="generatedImage" class="mt-4">
      <h2 class="text-lg font-semibold">Generated Image:</h2>
      <img
        :src="generatedImage"
        alt="Generated Art"
        class="rounded-lg shadow mt-2"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const comfyUrl = '/'
const prompt = ref('')
const generatedImage = ref('')
const isLoading = ref(false)
const error = ref('')

const generateArt = async () => {
  if (!prompt.value) {
    error.value = 'Please enter a prompt.'
    return
  }

  error.value = ''
  generatedImage.value = ''
  isLoading.value = true

  const graph = {
    nodes: [
      {
        id: 'load_model',
        type: 'LoadCheckpoint',
        parameters: {
          model_path: 'models/StableDiffusion/your-model.ckpt', // Replace with your actual model
        },
      },
      {
        id: 'generate_image',
        type: 'Sampler',
        parameters: {
          prompt: prompt.value,
          steps: 50,
          cfg_scale: 7.5,
        },
      },
      {
        id: 'output',
        type: 'SaveImage',
        parameters: {
          directory: 'outputs/',
          filename: 'generated_image',
        },
      },
    ],
  }

  try {
    const response = await fetch('/api/utils/comfy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graph),
    })

    const result = await response.json()

    if (!response.ok || !result.image_path) {
      throw new Error(result.message || 'Failed to generate art.')
    }

    generatedImage.value = `${comfyUrl}/${result.image_path}`
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>
