<template>
  <div class="p-6 m-4 mx-auto max-w-screen-lg bg-base-200 rounded-2xl border">
    <h1 class="text-4xl text-center mb-6">Stream Tester</h1>

    <!-- Toggle for Streaming -->
    <div class="mb-4 flex justify-center">
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="useStreaming" class="checkbox" />
        <span>Enable Streaming</span>
      </label>
    </div>

    <!-- Prompt Input -->
    <div class="mb-6">
      <label for="prompt" class="block text-lg font-medium mb-2">Enter Prompt:</label>
      <input
        id="prompt"
        v-model="prompt"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Type your prompt here..."
      />
    </div>

    <!-- Submit Button -->
    <div class="flex justify-center mb-6">
      <button
        :disabled="loading || !prompt.trim()"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
        @click="submitPrompt"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span v-else class="spinner-border spinner-border-sm" role="status"></span>
      </button>
    </div>

    <!-- Display Bot Response -->
    <div v-if="responseText" class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">Bot Response:</h2>
      <p>{{ responseText }}</p>
    </div>

    <!-- Error Message Display -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const prompt = ref('this is a test')
const responseText = ref('')
const loading = ref(false)
const errorMessage = ref('')
const useStreaming = ref(false)

// Function to submit the prompt to OpenAI API
async function submitPrompt() {
  if (!prompt.value.trim()) return

  loading.value = true
  responseText.value = ''
  errorMessage.value = ''

  const apiEndpoint = 'https://api.openai.com/v1/chat/completions'

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // The Authorization header is now handled by middleware
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt.value }],
      temperature: 1,
      max_tokens: 300,
      stream: useStreaming.value,
    }),
  }

  try {
    if (useStreaming.value) {
      await fetchStream(apiEndpoint, requestOptions)
    } else {
      const response = await fetch(apiEndpoint, requestOptions)
      if (!response.ok) {
        if (response.status === 401) {
          errorMessage.value = 'Unauthorized: Check your API key.'
        } else {
          errorMessage.value = `Error ${response.status}: ${response.statusText}`
        }
        console.error(`Request failed with status ${response.status}: ${response.statusText}`)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      responseText.value = data.choices?.[0]?.message?.content || 'No response received'
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error during API request:', error)
  } finally {
    loading.value = false
  }
}

// Function to handle streaming response
async function fetchStream(url: string, options: RequestInit) {
  const response = await fetch(url, options)
  if (!response.ok) {
    if (response.status === 401) {
      errorMessage.value = 'Unauthorized: Check your API key.'
    } else {
      errorMessage.value = `Error ${response.status}: ${response.statusText}`
    }
    console.error(`Stream request failed with status ${response.status}: ${response.statusText}`)
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  if (response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    responseText.value = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      responseText.value += decoder.decode(value, { stream: true })
    }
  } else {
    throw new Error('Stream not supported in response')
  }
}
</script>

<style scoped>
.spinner-border {
  border-width: 2px;
  width: 1rem;
  height: 1rem;
  border-color: white;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
