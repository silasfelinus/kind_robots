<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Add a New Bot</h1>

    <form class="space-y-4" @submit.prevent="submitBot">
      <div>
        <label for="name" class="block text-lg">Bot Name:</label>
        <input
          id="name"
          v-model="botData.name"
          type="text"
          class="border p-2 w-full"
          required
        />
      </div>

      <div>
        <label for="subtitle" class="block text-lg">Subtitle:</label>
        <input
          id="subtitle"
          v-model="botData.subtitle"
          type="text"
          class="border p-2 w-full"
        />
      </div>

      <div>
        <label for="description" class="block text-lg">Description:</label>
        <textarea
          id="description"
          v-model="botData.description"
          class="border p-2 w-full"
        ></textarea>
      </div>

      <div>
        <label for="botIntro" class="block text-lg">Bot Introduction:</label>
        <textarea
          id="botIntro"
          v-model="botData.botIntro"
          class="border p-2 w-full"
        ></textarea>
      </div>

      <div>
        <label for="userIntro" class="block text-lg">User Introduction:</label>
        <textarea
          id="userIntro"
          v-model="botData.userIntro"
          class="border p-2 w-full"
        ></textarea>
      </div>

      <div>
        <label for="prompt" class="block text-lg">Prompt:</label>
        <textarea
          id="prompt"
          v-model="botData.prompt"
          class="border p-2 w-full"
        ></textarea>
      </div>

      <div>
        <label for="sampleResponse" class="block text-lg"
          >Sample Response:</label
        >
        <textarea
          id="sampleResponse"
          v-model="botData.sampleResponse"
          class="border p-2 w-full"
        ></textarea>
      </div>

      <div>
        <label for="avatarImage" class="block text-lg">Avatar Image URL:</label>
        <input
          id="avatarImage"
          v-model="botData.avatarImage"
          type="text"
          class="border p-2 w-full"
        />
      </div>

      <div>
        <label class="block text-lg">Is Public:</label>
        <input v-model="botData.isPublic" type="checkbox" class="mr-2" />
        <span class="text-lg">Make this bot public</span>
      </div>

      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <svg
            class="animate-spin h-5 w-5 mr-2 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          Submitting...
        </span>
        <span v-else>Add Bot</span>
      </button>
    </form>

    <div
      v-if="responseMessage"
      class="mt-6 p-4 rounded border"
      :class="responseClass"
    >
      {{ responseMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const botData = ref({
  name: '',
  subtitle: '',
  description: '',
  botIntro: '',
  userIntro: '',
  prompt: '',
  sampleResponse: '',
  avatarImage: '',
  isPublic: false,
  underConstruction: true, // Default preset
  canDelete: true, // Default preset
})

const responseMessage = ref('')
const isSubmitting = ref(false)
const responseClass = ref('')

const submitBot = async () => {
  isSubmitting.value = true
  responseMessage.value = ''
  responseClass.value = ''

  try {
    const response = await fetch('/api/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botData.value),
    })

    const result = await response.json()

    if (result.success) {
      responseMessage.value = 'Bot successfully created!'
      responseClass.value = 'bg-green-100 border-green-500 text-green-800'
      resetForm()
    } else {
      responseMessage.value = `Error: ${result.message}`
      responseClass.value = 'bg-red-100 border-red-500 text-red-800'
    }
  } catch (error) {
    responseMessage.value = `Network Error: ${error.message}`
    responseClass.value = 'bg-red-100 border-red-500 text-red-800'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  botData.value = {
    name: '',
    subtitle: '',
    description: '',
    botIntro: '',
    userIntro: '',
    prompt: '',
    sampleResponse: '',
    avatarImage: '',
    isPublic: false,
    underConstruction: true,
    canDelete: true,
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
