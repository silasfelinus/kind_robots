<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 w-full max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <form class="space-y-4" @submit.prevent="submit">
        <h1 class="text-2xl font-semibold mb-6 text-center text-gray-800">
          {{ botsStore.activeBot.name }}
        </h1>
        <div>
          <label for="prompt" class="block text-sm font-medium text-gray-700">Prompt</label>
          <textarea
            id="prompt"
            v-model="prompt"
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
            rows="3"
          ></textarea>
        </div>
        <!-- Add other form inputs like the one above for the remaining Bot properties -->
        <div>
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
        <button
          type="submit"
          class="py-2 px-4 font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Send</span>
        </button>
        <div v-if="data">
          <h2 class="text-xl font-medium mb-2 text-gray-800">Response:</h2>
          <pre class="text-gray-900">{{ JSON.stringify(data, null, 2) }}</pre>
        </div>
        <div v-if="errorMessage">
          <p class="mt-2 p-4 bg-red-100 rounded-md shadow-md text-red-700">
            Error: {{ errorMessage }}
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
let isLoading = ref(false)
let conversations = ref({})

let prompt = ref(botsStore.activeBot.prompt)
let maxTokens = ref(botsStore.activeBot.maxTokens)
let data = ref(null)
let errorMessage = ref('')

const updateTemperature = (event: Event) => {
  let target = event.target as HTMLInputElement
  botsStore.activeBot.temperature = parseFloat(target.value)
}

const submit = async () => {
  isLoading.value = true
  try {
    const {
      id,
      name,
      avatarImage,
      model,
      post,
      temperature,
      maxTokens,
      prompt,
      image,
      mask,
      n,
      size
    } = botsStore.activeBot

    const payload: any = { post }
    if (id) payload.id = id
    if (name) payload.name = name
    if (avatarImage) payload.avatarImage = avatarImage
    if (model) payload.model = model
    if (typeof temperature !== 'undefined') payload.temperature = temperature
    if (typeof maxTokens !== 'undefined') payload.maxTokens = maxTokens
    if (prompt) payload.prompt = prompt
    if (image) payload.image = image
    if (mask) payload.mask = mask
    if (typeof n !== 'undefined') payload.n = n
    if (size) payload.size = size

    const response = await axios.post('/api/botcafe/chat', payload)

    data.value = response.data
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    isLoading.value = false
  }
}
</script>
