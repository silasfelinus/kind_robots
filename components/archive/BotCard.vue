<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-8 border-2 border-solid border-secondary bg-primary opacity-90 rounded-lg shadow-lg text-base-content items-start h-screen"
  >
    <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
      <div class="card bg-base-100 text-base-content shadow-xl mb-4 flex-grow">
        <div class="flex flex-col lg:flex-row items-stretch">
          <figure
            class="w-full lg:w-48 h-48 lg:h-auto bg-secondary-300 rounded-full overflow-hidden mb-4 lg:mr-4"
          >
            <img
              :src="activeBot.avatarImage ? activeBot.avatarImage : '/images/avatars/bot1.jpg'"
              class="object-cover w-full h-full"
              alt="Bot Avatar"
            />
          </figure>
          <div class="w-full lg:w-auto">
            <div>
              <label for="bot-selection" class="block text-sm font-medium text-gray-700"
                >Select a Bot:</label
              >
              <select
                id="bot-selection"
                v-model="activeBotId"
                name="bot-selection"
                class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                @change="onBotChange"
              >
                <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                  {{ bot.name }}
                </option>
              </select>
            </div>
            <theme-manager />
          </div>
        </div>
        <div class="card-body flex-grow">
          <h1 class="text-5xl font-semibold mb-4 card-title">{{ activeBot.name }}</h1>
          <p class="mt-4 text-2xl">{{ activeBot.description }}</p>
          <div v-if="activeBot.model || activeBot.post" class="flex flex-wrap gap-2">
            <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
            <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
          </div>
          <div class="mt-4">
            <temperature-slider v-if="activeBot.temperature !== null" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
      <div class="card lg:card-side bg-base-100 text-base-content shadow-xl flex-grow">
        <div class="card-body h-full flex-grow">
          <h2 class="text-2xl font-semibold mb-4">Prompt</h2>
          <p v-if="activeBot.intro" class="text-accent-700">{{ activeBot.intro }}</p>
          <textarea
            id="prompt"
            v-model="activeBot.prompt"
            rows="10"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-lg border-gray-300 rounded-md mb-4"
          ></textarea>
          <div class="card-actions justify-end">
            <button class="btn btn-primary" @click="sendData">Generate</button>
          </div>
          <div v-if="isLoading" class="mt-4 text-accent-700 card-body">
            <p>{{ activeBot.name }} is cogitating...</p>
          </div>
          <div v-if="response" class="mt-4 card-body">
            <h2 class="text-2xl font-semibold mb-4">Response:</h2>
            <pre>{{ JSON.stringify(response, null, 2) }}</pre>
          </div>
          <div v-if="requestError" class="mt-4 text-red-600 card-body">
            <h2 class="text-2xl font-semibold mb-4">Error:</h2>
            <pre>{{ requestError }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const activeBot = ref(botsStore.activeBot)
const activeBotId = ref(botsStore.getActiveBotId)
const bots = ref(botsStore.getBots)
const response = ref(null)
const isLoading = ref(false)
const requestError = ref<string | null>(null)

const onBotChange = () => {
  const bot = bots.value.find((bot) => bot.id === activeBotId.value)
  if (bot) {
    activeBot.value = bot
    botsStore.setActiveBot(bot)
  }
}

const requestPayload = {
  temperature: activeBot.value.temperature,
  max_tokens: activeBot.value.maxTokens,
  n: activeBot.value.n,
  post: activeBot.value.post
}
const sendData = async () => {
  try {
    isLoading.value = true
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: activeBot.value.model || 'gpt-3.5-turbo',
        requestPayload,
        messages: [
          {
            role: 'system',
            content: `You are a helpful ${activeBot.value.botType}.`
          },
          {
            role: 'user',
            content: activeBot.value.intro + activeBot.value.prompt
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    response.value = res.data
  } catch (err: any) {
    console.error(err)
    requestError.value = err
  } finally {
    isLoading.value = false
  }
}
</script>
