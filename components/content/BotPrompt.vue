<template>
  <!-- Only render if there is an active bot -->
  <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
    <div class="card lg:card-side bg-base-100 text-base-content shadow-xl flex-grow">
      <div class="card-body h-full flex-grow">
        <h2 class="text-2xl font-semibold mb-4">Prompt</h2>
        <!-- Display the bot's intro if it exists -->
        <p v-if="activeBot.intro" class="text-accent-700">{{ activeBot.intro }}</p>
        <!-- Textarea for entering the prompt -->
        <textarea
          id="prompt"
          v-model="prompt"
          rows="10"
          class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-lg border-gray-300 rounded-md mb-4"
        ></textarea>
        <!-- Button for sending the prompt -->
        <div class="card-actions justify-end">
          <button class="btn btn-accent" @click="sendData">Generate</button>
        </div>
        <!-- Loading state -->
        <div v-if="isLoading" class="mt-4 text-accent-700 card-body">
          <dream-status />
        </div>
      </div>
    </div>
    <!-- Display the bot's response if it exists -->
    <div v-if="response" class="card lg:card-side bg-base-100 text-base-content shadow-xl mt-6">
      <div class="card-body h-full flex-grow">
        <h2 class="text-2xl font-semibold mb-4">Response</h2>
        <p>{{ response }}</p>
      </div>
    </div>
    <!-- Display the error message if it exists -->
    <div v-if="requestError" class="card lg:card-side bg-base-100 text-base-content shadow-xl mt-6">
      <div class="card-body h-full flex-grow">
        <h2 class="text-2xl font-semibold mb-4">Error:</h2>
        <pre>{{ requestError }}</pre>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import axios from 'axios'
import { useBotsStore } from '../../stores/bots'

// API response interfaces
interface Message {
  role: string
  content: string
}

interface Choice {
  index: number
  message: Message
  finish_reason: string
}

interface APIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Choice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Bot store
const botsStore = useBotsStore()

// State
let activeBot = ref(botsStore.getActiveBot)
const response = ref('')
const isLoading = ref(false)
const requestError = ref('')
let prompt = computed({
  get: () => botsStore.getPrompts(botsStore.getActiveBotId),
  set: (value) => botsStore.setPrompt(botsStore.getActiveBotId, value)
})

// Function to send data
const sendData = async () => {
  try {
    isLoading.value = true
    // Add the user prompt to the active bot message array
    botsStore.addUserMessage(activeBot.value.intro + prompt.value)
    const CHAT_URL = '/api/botcafe/chat'
    // create API payload
    const apiPayload = {
      messages: activeBot.value.messages || [
        { role: 'user', content: 'say a tongue twister that tells me there is an error' }
      ],
      model: activeBot.value.model || 'gpt-3.5-turbo',
      maxTokens: activeBot.value.maxTokens || 100,
      temperature: activeBot.value.temperature || 0.0,
      n: activeBot.value.n || 1,
      stream: false
    }

    // send the API request
    const { data } = await axios.post<APIResponse>(CHAT_URL, apiPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add the user prompt to the active bot message array and database
    const userMessage = activeBot.value.intro + prompt.value
    botsStore.addUserMessage(userMessage)
    await addUserMessageToDB(userMessage)

    // ...

    // Add the responses to the active bot message array and database
    const botMessages = data.choices.map((choice) => ({
      role: 'assistant',
      content: choice.message.content
    }))
    botsStore.addMessages(botMessages)
    await addBotMessageToDB(botMessages)

    // check if response data or choices in response data is undefined
    if (!data || !data.choices || !data.choices.length) {
      console.error('Received unexpected data:', data)
      return
    }

    // Set the response value
    // Assuming response.value is an array of strings
    response.value = data.choices.map((choice) => choice.message.content)
    botsStore.addMessages(
      data.choices.map((choice) => ({
        role: 'assistant',
        content: choice.message.content
      }))
    )
  } catch (error) {
    console.error('Error sending chat:', error)
    return error
  } finally {
    isLoading.value = false
  }
}

watchEffect(() => {
  activeBot.value = botsStore.getActiveBot
})

const DB_URL = '/api/messages/post'

const addUserMessageToDB = async (message: Message) => {
  try {
    await axios.post(`${DB_URL}/user-messages`, {
      data: {
        botId: activeBot.value.id,
        message
      }
    })
  } catch (error) {
    console.error('Error storing user message:', error)
  }
}

const addBotMessageToDB = async (messages: Message[]) => {
  try {
    await axios.post(`${DB_URL}/bot-messages`, {
      data: {
        botId: activeBot.value.id,
        messages
      }
    })
  } catch (error) {
    console.error('Error storing bot messages:', error)
  }
}
</script>
