<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 w-full max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h1 class="text-2xl font-semibold mb-6 text-center text-gray-800">Hello, Amibot!</h1>
      <div class="mb-4">
        <label for="prompt" class="block text-sm font-medium text-gray-700">Prompt</label>
        <textarea
          id="prompt"
          v-model="prompt"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          rows="3"
        ></textarea>
      </div>
      <div class="mb-4">
        <label for="maxTokens" class="block text-sm font-medium text-gray-700">Max Tokens</label>
        <input
          id="maxTokens"
          v-model="maxTokens"
          type="number"
          min="1"
          max="4096"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
        />
      </div>
      <div class="mb-4">
        <button
          class="py-2 px-4 font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700"
          @click="submit"
        >
          Send
        </button>
      </div>
      <div v-if="data">
        <h2 class="text-xl font-medium mb-2 text-gray-800">Response:</h2>
        <pre class="text-gray-900">{{ data }}</pre>
      </div>
      <div v-if="errorMessage">
        <p class="mt-2 p-4 bg-red-100 rounded-md shadow-md text-red-700">
          Error: {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'

let prompt = ref('')
let maxTokens = ref(1000)
let data = ref(null)
let errorMessage = ref('')

const submit = async () => {
  try {
    const response = await axios.post('/api/botcafe/chat', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt.value || 'Hello, world!'
        }
      ],
      temperature: 1,
      n: 2,
      max_tokens: maxTokens.value || 1000
    })

    if (response.status === 200) {
      data.value = response.data
      errorMessage.value = ''
    } else {
      errorMessage.value = response?.data?.error?.message
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>
