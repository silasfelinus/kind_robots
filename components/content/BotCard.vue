<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-8 border-2 border-solid border-secondary bg-primary opacity-90 rounded-lg shadow-lg text-base-content items-start"
  >
    <div v-if="activeBot" class="col-span-full lg:col-span-1">
      <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <!-- Bot info: Image, title, and details -->
        <div class="card bg-base-100 text-base-content shadow-xl mb-4">
          <figure class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden mb-4">
            <img
              :src="activeBot.avatarImage ? activeBot.avatarImage : 'path/to/default/image.png'"
              class="object-cover w-full h-full"
              alt="Bot Avatar"
            />
          </figure>
          <div class="card-body">
            <h1 class="text-5xl font-semibold mb-4 card-title">{{ activeBot.name }}</h1>
            <p class="mt-4 text-2xl">{{ activeBot.description }}</p>
          </div>
          <div v-if="activeBot.model || activeBot.post" class="flex flex-wrap gap-2">
            <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
            <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
          </div>
        </div>

        <!-- Temperature Slider -->
        <div class="card bg-base-100 text-base-content shadow-xl">
          <div class="card-body">
            <temperature-slider v-if="activeBot.temperature !== null" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeBot" class="col-span-full lg:col-span-1">
      <!-- User modifiable data -->
      <div class="card lg:card-side bg-base-100 text-base-content shadow-xl">
        <!-- Prompt -->
        <div class="card-body h-full">
          <h2 class="text-2xl font-semibold mb-4">Prompt</h2>
          <textarea
            id="prompt"
            v-model="activeBot.prompt"
            rows="10"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-lg border-gray-300 rounded-md mb-4"
          ></textarea>
          <!-- Generate Button -->
          <div class="card-actions justify-end">
            <button class="btn btn-primary" @click="sendActiveBotData">Generate</button>
          </div>
        </div>
        <div v-if="sendDataSuccess" class="mt-4 text-green-600 card-body">
          Data sent successfully!
        </div>
        <div v-if="serverData" class="mt-4 card-body">
          <h2 class="text-2xl font-semibold mb-4">Received Data:</h2>
          <pre>{{ JSON.stringify(serverData, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AxiosError } from 'axios'
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const activeBot = computed(() => botsStore.activeBot)
let sendDataSuccess = ref(false)
let serverData = ref(null)

const sendActiveBotData = async () => {
  if (!activeBot.value) return

  const data = {
    prompt: activeBot.value.prompt,
    model: activeBot.value.model,
    post: activeBot.value.post,
    temperature: activeBot.value.temperature,
    intro: activeBot.value.intro,
    image: activeBot.value.image,
    mask: activeBot.value.mask,
    style: activeBot.value.style,
    n: activeBot.value.n,
    maxTokens: activeBot.value.maxTokens
  }

  try {
    const response = await botsStore.sendData(data)
    sendDataSuccess.value = true
    serverData.value = response.data
    console.log(response.data)
  } catch (error) {
    sendDataSuccess.value = false
    if (error instanceof AxiosError) {
      console.error(`Failed to send data: ${error.message}`)
      if (error.response) {
        console.error('Response:', error.response)
      }
    } else {
      console.error('An unknown error occurred:', error)
    }
  }
}
</script>
<style>
body {
  font-family: Arial, sans-serif;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
}
</style>
