<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 bg-primary opacity-500 rounded-lg shadow-lg text-black items-start"
  >
    <div v-if="activeBot" class="col-span-full sm:col-span-1">
      <h1 class="text-5xl font-semibold mb-4 text-black">{{ activeBot.name }}</h1>
      <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
        <img
          :src="activeBot.avatarImage ? activeBot.avatarImage : 'path/to/default/image.png'"
          class="object-cover w-full h-full"
          alt="Bot Avatar"
        />
      </div>
    </div>
    <div v-if="activeBot" class="col-span-full sm:col-span-1">
      <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
      <div v-if="activeBot.model || activeBot.post" class="flex flex-wrap gap-2">
        <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
        <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
      </div>
      <div v-if="activeBot.temperature" class="mt-4 w-64 mx-auto">
        <temperature-slider />
      </div>
      <p v-if="activeBot.intro" class="text-accent text-lg">{{ activeBot.intro }}</p>
      <div v-if="activeBot.prompt" class="mb-4">
        <label for="prompt" class="block text-md font-medium text-gray-700">Prompt</label>
        <div class="mt-1">
          <textarea
            id="prompt"
            v-model="activeBot.prompt"
            rows="5"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-lg border-gray-300 rounded-md"
          ></textarea>
        </div>
      </div>
      <p v-if="activeBot.image" class="text-accent">Image: {{ activeBot.image }}</p>
      <p v-if="activeBot.mask" class="text-accent">Mask: {{ activeBot.mask }}</p>
      <p v-if="activeBot.style" class="text-accent">Style: {{ activeBot.style }}</p>
      <div v-if="activeBot.n" class="mt-4">
        <label for="iterations" class="block text-sm font-medium text-accent"
          >Number of Iterations</label
        >
        <select id="iterations" v-model="activeBot.n" class="input input-accent">
          <option v-for="n in 8" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div v-if="activeBot.maxTokens" class="mt-4">
        <label for="maxTokens" class="block text-sm font-medium text-accent">Max Tokens</label>
        <select id="maxTokens" v-model="activeBot.maxTokens" class="input input-primary">
          <option v-for="n in 32" :key="n" :value="n <= 10 ? n * 100 : 2 ** (n - 10) * 1000">
            {{ n <= 10 ? n * 100 : 2 ** (n - 10) * 1000 }}
          </option>
        </select>
      </div>
      <div>
        <p v-if="activeBot.createdAt" class="text-accent">Created At: {{ activeBot.createdAt }}</p>

        <p v-if="activeBot.size" class="text-accent">Size: {{ activeBot.size }}</p>
      </div>
      <div class="mt-4">
        <button
          class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          @click="sendActiveBotData"
        >
          Generate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AxiosError } from 'axios'
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const activeBot = computed(() => botsStore.activeBot)

const sendActiveBotData = async () => {
  if (!activeBot.value) return

  // Create a new object with only the fields we want to send
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
    await botsStore.sendData(data)
  } catch (error) {
    if (error instanceof AxiosError) {
      // Now you can access the properties of the error:
      console.error(`Failed to send data: ${error.message}`)
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
