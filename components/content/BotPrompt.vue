<template>
  <div
    class="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 bg-base rounded-lg shadow-lg text-white items-start"
  >
    <div v-if="activeBot" class="col-span-1 md:col-span-1">
      <h1 class="text-5xl font-semibold mb-4 text-primary">{{ activeBot.name }}</h1>
      <div class="w-96 h-96 bg-gray-300 rounded-full overflow-hidden">
        <img
          :src="activeBot.avatarImage ? activeBot.avatarImage : 'path/to/default/image.png'"
          class="object-cover w-full h-full"
          alt="Bot Avatar"
        />
      </div>
    </div>
    <div v-if="activeBot" class="col-span-1 md:col-span-2">
      <p class="mt-4 text-2xl text-secondary">{{ activeBot.description }}</p>
      <div class="mt-4">
        <label for="prompt" class="block text-sm font-medium text-primary">Prompt</label>
        <textarea
          id="prompt"
          v-model="prompt"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
          rows="3"
        ></textarea>
      </div>
      <div v-if="activeBot.temperature" class="mt-4">
        <label for="temperature" class="block text-sm font-medium text-gray-700"
          >Temperature: {{ activeBot.temperature }}</label
        >
        <div class="mt-1 relative rounded-md shadow-sm">
          <input
            id="temperature"
            v-model="activeBot.temperature"
            type="range"
            step="0.1"
            min="0"
            max="1"
            class="focus:ring-indigo-500 h-4 transition ease-in-out duration-200 slider rounded-full bg-accent"
          />
        </div>
        <p class="text-sm text-primary">More Creative - More Consistent</p>
      </div>
      <div class="mt-4">
        <button
          class="py-2 px-4 font-semibold rounded-lg shadow-md text-white bg-primary hover:bg-primary-hover"
          @click="submitPrompt"
        >
          Send
        </button>
      </div>
      <div class="mt-4">
        <div v-if="response" class="p-4 bg-gray-50 rounded-md shadow-md">
          <h2 class="text-2xl text-primary mb-2">Response:</h2>
          <p class="text-lg text-secondary">{{ response }}</p>
        </div>
        <div v-if="errorMessage" class="mt-2 p-4 bg-red-100 rounded-md shadow-md text-red-700">
          <p>Error: {{ errorMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const activeBot = computed(() => botsStore.getActiveBot)
const prompt = ref(activeBot.value.prompt)

const response = ref('')
const errorMessage = ref('')

watch(activeBot, () => {
  prompt.value = activeBot.value.prompt
})
const submitPrompt = async () => {
  if (!activeBot.value.post) {
    errorMessage.value = 'Post endpoint is undefined'
    return
  }
  try {
    const res = await fetch('/api/botcafe/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: activeBot.value.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt.value }],
        temperature: activeBot.value.temperature,
        n: activeBot.value.n || 1,
        max_tokens: activeBot.value.maxTokens || 2000,
        post: activeBot.value.post || `https://api.openai.com/v1/chat/completions`
      })
    })

    if (res.ok) {
      const data = await res.json()
      response.value = data?.choices?.[0]?.message?.content
      errorMessage.value = ''
    } else {
      const errorData = await res.json()
      errorMessage.value = errorData?.error?.message
    }
  } catch (error) {
    response.value = ''
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}
</script>
