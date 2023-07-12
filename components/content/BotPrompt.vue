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
            <BotSelector :bots="bots" @bot-selected="onBotSelected" />
            <theme-manager />
          </div>
        </div>
        <div class="card-body flex-grow">
          <h1 class="text-5xl font-semibold mb-4 card-title">{{ activeBot.name }}</h1>
          <p class="mt-4 text-2xl">{{ activeBot.description }}</p>
          <div class="w-40">
            <label for="n-selection" class="block text-sm font-medium text-gray-700"
              >Select Number of Iterations:</label
            >
            <select
              id="n-selection"
              v-model="activeBot.n"
              name="n-selection"
              class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option v-for="n in 12" :key="n" :value="n">
                {{ n }}
              </option>
            </select>
          </div>
          <div v-if="activeBot.size" class="mt-4">
            <label for="size-selection" class="block text-sm font-medium text-gray-700">
              Select Size:
            </label>
            <select
              id="size-selection"
              v-model="activeBot.size"
              name="size-selection"
              class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="512x512">512x512</option>
              <option value="768x768">768x768</option>
              <option value="1028x1028">1024x1024</option>
            </select>
          </div>
          <div
            v-if="activeBot.model || activeBot.post || activeBot.size"
            class="flex flex-wrap gap-2"
          >
            <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
            <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
            <p v-if="activeBot.size" class="text-accent-700">Size: {{ activeBot.size }}</p>
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
            <dream-status />
          </div>
          <div v-if="response" class="mt-4 hero">
            <bot-response :responses="response"></bot-response>
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
// use computed() to create a reactive reference to the active bot in the store
let activeBot = computed(() => botsStore.getActiveBot)

let activeBotId = computed(() => (activeBot.value ? activeBot.value.id : null))

const bots = ref(botsStore.getBots)
const response = ref(null)
const isLoading = ref(false)
const requestError = ref<string | null>(null)

const onBotSelected = (botId: number) => {
  const bot = bots.value.find((bot) => bot.id === botId)
  if (bot) {
    botsStore.setActiveBot(bot)
  }
}

const sendData = async () => {
  try {
    isLoading.value = true
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: activeBot.value.model || 'gpt-3.5-turbo',
        requestPayload: {
          temperature: activeBot.value.temperature,
          max_tokens: activeBot.value.maxTokens,
          n: activeBot.value.n,
          post: activeBot.value.post,
          size: activeBot.value.size
        },
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
