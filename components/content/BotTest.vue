Copy code
<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 bg-gray-200 rounded-lg shadow-lg text-black items-start"
  ></div>
  <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
    <div v-if="activeBot" class="col-span-full sm:col-span-1">
      <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
      <p class="text-2xl text-black">{{ activeBot.intro }}</p>
      <p class="text-2xl text-black">{{ activeBot.style }}</p>
      <p class="text-2xl text-black">{{ activeBot.size }}</p>
      <p class="text-2xl text-black">{{ activeBot.n }}</p>
      <div v-if="activeBot" class="col-span-full sm:col-span-1">
        <h1 class="text-5xl font-semibold mb-4 text-black">{{ activeBot.name }}</h1>
        <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
          <img :src="botAvatar" class="object-cover w-full h-full" alt="Bot Avatar" />
        </div>
      </div>
      <div v-if="activeBot" class="col-span-full sm:col-span-1">
        <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
        <div class="mt-4">
          <label for="temperature" class="block text-sm font-medium text-gray-700"
            >Temperature</label
          >
          <div class="mt-1 relative rounded-md shadow-sm">
            <input
              id="temperature"
              v-model="temperature"
              type="range"
              step="0.1"
              min="0"
              max="1"
              class="slider bg-primary h-1 w-full overflow-hidden cursor-pointer rounded-full"
              @input="updateTemperature"
            />
            <div
              class="absolute top-0 left-0 h-full flex items-center"
              :style="`left: calc(${displayTemperature * 100}% - 0.5rem);`"
            >
              <div class="h-3 w-3 bg-primary rounded-full"></div>
            </div>
            <div class="text-center text-sm text-primary">{{ displayTemperature }}</div>
          </div>
          <p class="text-sm text-primary">
            A lower value makes responses more consistent, a higher value makes them more creative
          </p>
        </div>
        <button :disabled="isLoading" class="btn btn-primary mt-4" @click="submit">
          <span v-if="isLoading">Loading...</span>
          <span v-else>Submit</span>
        </button>
        <div v-if="errorMessage" class="alert alert-error mt-4">
          {{ errorMessage }}
        </div>
        <div v-if="channels[activeBot.id]" class="p-4 mt-4 rounded bg-primary text-white">
          <!-- response section -->
          <div v-for="channel in channels[activeBot.id]" :key="channel.id" class="mt-4">
            <!-- chat bubble -->
            <div class="p-4 rounded-lg bg-accent text-white flex items-center space-x-3">
              <img :src="botAvatar" class="w-10 h-10 rounded-full" alt="Bot Avatar" />
              <div>
                <h2 class="font-bold">{{ activeBot.name }}</h2>
                <p>{{ channel.message }}</p>
              </div>
            </div>
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
const activeBot = computed(() => botsStore.getActiveBot)
let temperature = ref<number | undefined>(activeBot.value?.temperature)
const displayTemperature = computed(() => temperature.value ?? 0)
let maxTokens = ref<number | undefined>(activeBot.value?.maxTokens)
let prompt = ref<string | undefined>(activeBot.value?.prompt)
let errorMessage = ref<string>('')
let isLoading = ref<boolean>(false)
let channels = ref<Record<string, Array<{ id: number; message: string }>>>({})

// computed value for bot avatar
let botAvatar = computed(() => activeBot.value.avatarImage || '/images/avatars/amibot1.png')

const updateTemperature = (event: Event) => {
  let target = event.target as HTMLInputElement
  temperature.value = parseFloat(target.value)
}

const submit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await axios.post('/api/botcafe/chat', {
      model: activeBot.value.model,
      messages: [
        {
          role: 'user',
          content: activeBot.value.prompt || 'Hello, world!'
        }
      ],
      temperature: temperature.value,
      max_tokens: maxTokens.value || 1000
    })
    if (response.status === 200) {
      const botChannels = channels.value[activeBot.value.id] || []
      botChannels.push({ id: Date.now(), message: response.data.message })
      prompt.value = ''
      channels.value = { ...channels.value, [activeBot.value.id]: botChannels }
    } else {
      errorMessage.value = 'Something went wrong!'
    }
  } catch (error) {
    errorMessage.value = 'Something went wrong!'
  } finally {
    isLoading.value = false
  }
}
</script>
