<template>
  <div
    v-if="activeBot"
    class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 bg-gray-200 rounded-lg shadow-lg text-black items-start"
  >
    <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
      <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
      <p class="text-2xl text-black">{{ activeBot.userIntro }}</p>
      <h1 class="text-5xl font-semibold mb-4 text-black">{{ activeBot.name }}</h1>
      <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
        <img :src="botAvatar" class="object-cover w-full h-full" alt="Bot Avatar" />
      </div>
      <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
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
  <div v-else class="text-center">Loading...</div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { useBotStore } from '../stores/botStore'

const botsStore = useBotStore()
const activeBot = computed(() => botsStore.getActiveBot)
let prompt = ref<string | undefined>(activeBot.value?.prompt)
let errorMessage = ref<string>('')
let isLoading = ref<boolean>(false)
let channels = ref<Record<string, Array<{ id: number; message: string }>>>({})

// computed value for bot avatar
let botAvatar = computed(() => activeBot.value?.avatarImage || '/images/avatars/amibot1.png')

const submit = async () => {
  if (activeBot.value) {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await axios.post('/api/botcafe/chat', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: activeBot.value.prompt || 'Hello, world!'
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
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
}
</script>
