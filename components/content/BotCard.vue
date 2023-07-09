<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-8 border-2 border-solid border-secondary bg-primary opacity-90 rounded-lg shadow-lg text-base-content items-start h-screen"
  >
    <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
      <div class="card bg-base-100 text-base-content shadow-xl mb-4 flex-grow">
        <!-- Bot info: Image, and Theme Manager -->
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
            <theme-manager />
          </div>
        </div>

        <!-- Bot info: title, and details -->
        <div class="card-body flex-grow">
          <h1 class="text-5xl font-semibold mb-4 card-title">{{ activeBot.name }}</h1>
          <p class="mt-4 text-2xl">{{ activeBot.description }}</p>

          <!-- Model and Post -->
          <div v-if="activeBot.model || activeBot.post" class="flex flex-wrap gap-2">
            <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
            <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
          </div>

          <!-- Temperature Slider -->
          <div class="mt-4">
            <temperature-slider v-if="activeBot.temperature !== null" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
      <!-- User modifiable data -->
      <div class="card lg:card-side bg-base-100 text-base-content shadow-xl flex-grow">
        <!-- Prompt -->
        <div class="card-body h-full flex-grow">
          <h2 class="text-2xl font-semibold mb-4">Prompt</h2>
          <p v-if="activeBot.intro" class="text-accent-700">{{ activeBot.intro }}</p>
          <textarea
            id="prompt"
            v-model="activeBot.prompt"
            rows="10"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-lg border-gray-300 rounded-md mb-4"
          ></textarea>

          <!-- Server data -->
          <div v-if="sendDataSuccess" class="mt-4 text-green-600 card-body">
            {{ activeBot.name }}
          </div>
          <div v-if="serverData" class="mt-4 card-body">
            <h2 class="text-2xl font-semibold mb-4">Received Data:</h2>
            <pre>{{ JSON.stringify(serverData, null, 2) }}</pre>
          </div>
          <!-- Generate Button -->
          <div class="card-actions justify-end">
            <button class="btn btn-primary" @click="sendActiveBotData">Generate</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  background: #f0f0f0;
}

.card {
  border-radius: 8px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.15);
}

figure {
  margin: 0;
}

.card-body {
  padding: 20px;
}

.btn-primary {
  background: #1e88e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

.btn-primary:hover {
  background: #0d47a1;
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

.bubble {
  border: 1px solid #d9d9d9;
  border-radius: 15px;
  padding: 15px;
  margin: 10px 0;
  position: relative;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.bubble:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50px;
  width: 0;
  height: 0;
  border: 15px solid transparent;
  border-top-color: #ffffff;
  border-bottom: 0;
  margin-left: -10px;
  margin-bottom: -15px;
}

.text-green-600 {
  color: #2f855a;
}

.text-accent-700 {
  color: #c05621;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 5px;
}
</style>
