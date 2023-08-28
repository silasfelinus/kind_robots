<template>
  <div class="add-bot-container">
    <h1 class="text-3xl mb-4 text-center">Create a New Bot</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <div class="mb-4">
        <label for="botType" class="block text-sm font-medium">Bot Type:</label>
        <select id="botType" v-model="botType" class="w-full p-2 rounded border">
          <option value="PROMPTBOT">Prompt Bot: A bot that provides prompts</option>
          <option value="CHATBOT">Chat Bot: A bot that can chat with users</option>
          <option value="ARTBOT">Art Bot: A bot that creates art</option>
        </select>
      </div>
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium">Name:</label>
        <input id="name" v-model="name" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="subtitle" class="block text-sm font-medium">Subtitle:</label>
        <input id="subtitle" v-model="subtitle" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="description" class="block text-sm font-medium">Description:</label>
        <textarea
          id="description"
          v-model="description"
          class="resize w-full p-2 rounded border"
        ></textarea>
      </div>
      <div class="mb-4">
        <label for="avatarImage" class="block text-sm font-medium">Avatar Image URL:</label>
        <input
          id="avatarImage"
          v-model="avatarImage"
          type="text"
          class="w-full p-2 rounded border"
        />
        <!-- Placeholder for image upload component -->
        <!-- <image-upload-component v-model="avatarImage" /> -->
        <button type="button" class="btn btn-info mt-2" @click="getRandomAvatar">
          Get Random Avatar
        </button>
      </div>
      <div class="mb-4">
        <label for="botIntro" class="block text-sm font-medium">Bot Introduction:</label>
        <input id="botIntro" v-model="botIntro" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="userIntro" class="block text-sm font-medium">User Introduction:</label>
        <input id="userIntro" v-model="userIntro" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="prompt" class="block text-sm font-medium">Prompt:</label>
        <textarea id="prompt" v-model="prompt" class="resize w-full p-2 rounded border"></textarea>
        <button type="button" class="btn btn-primary mt-2" @click="testPrompt">Test Prompt</button>
        <div v-if="promptTestResult" class="mt-2 text-green-500 animate-pulse">
          Test Result: {{ promptTestResult }}
        </div>
      </div>
      <!-- Add additional form fields for other attributes such as theme, personality, modules, etc. -->
      <!-- ... -->
      <button type="submit" class="btn btn-success w-full">Create Bot</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { useErrorStore, useStatusStore, useBotStore, StatusType, ErrorType } from '../../stores'

const errorStore = useErrorStore()
const statusStore = useStatusStore()
const botStore = useBotStore()

// Form fields
const botType = ref('CHATBOT')
const name = ref('')
const subtitle = ref('Kind Robot')
const description = ref("I'm a kind robot")
const avatarImage = ref('/images/wonderchest/wonderchest304_(23).webp')
const botIntro = ref("You're a Kind Robot")
const userIntro = ref("Let's make a difference. Here's my idea:")
const prompt = ref('Arm butterflies with mini-flamethrowers to kick mosquitos butts')
// Other form fields
// ...

async function handleSubmit(e: Event) {
  e.preventDefault()

  statusStore.setStatus(StatusType.INFO, 'Creating the bot...')

  try {
    const botData = {
      botType: botType.value,
      name: name.value,
      subtitle: subtitle.value,
      description: description.value,
      avatarImage: avatarImage.value,
      botIntro: botIntro.value,
      userIntro: userIntro.value,
      prompt: prompt.value
      // Other form fields
      // ...
    }

    await botStore.addBots([botData])

    statusStore.setStatus(StatusType.SUCCESS, 'Bot created successfully!')
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to create the bot.')
  }
}

async function testPrompt() {
  try {
    const response = await axios.post('/api/botcafe/chat', { prompt: prompt.value })
    promptTestResult.value = response.data.result // Adjust based on the API response structure
  } catch (error) {
    errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to test the prompt.')
  }
}

async function getRandomAvatar() {
  try {
    const { data } = await axios.get('/api/galleries/avatars/random')
    avatarImage.value = data.url // Adjust based on the API response structure
  } catch (error) {
    errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random avatar.')
  }
}

const promptTestResult = ref<string | null>(null)
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
