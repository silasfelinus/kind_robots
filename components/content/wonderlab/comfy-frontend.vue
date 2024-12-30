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
      @click="handleGenerateArt"
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

// Utility function for API requests with error handling
const performRequest = async (url, options, errorMessage) => {
  try {
    const response = await fetch(url, options)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || errorMessage)
    }

    return result
  } catch (err) {
    throw new Error(err.message || errorMessage)
  }
}

// Function to build the graph object
const buildGraph = () => {
  return {
    nodes: [
      {
        id: 'load_model',
        type: 'LoadCheckpoint',
        parameters: {
          model_path: 'realcartoonPony_v1.safetensors',
        },
      },
      {
        id: 'generate_image',
        type: 'Sampler',
        parameters: {
          prompt: prompt.value,
          steps: 15,
          cfg_scale: 3,
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
}

// Main handler for generating art
const handleGenerateArt = async () => {
  if (!prompt.value) {
    error.value = 'Please enter a prompt.'
    return
  }

  isLoading.value = true
  error.value = ''
  generatedImage.value = ''

  try {
    const graph = buildGraph()

    const result = await performRequest(
      '/api/utils/comfy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      },
      'Failed to generate art. Please try again later.'
    )

    if (!result.image_path) {
      throw new Error('Image path is missing in the response.', result)
    }

    generatedImage.value = `${comfyUrl}/${result.image_path}`
  } catch (err) {
    error.value = `Error: ${err.message}`
  } finally {
    isLoading.value = false
  }
}
</script>
