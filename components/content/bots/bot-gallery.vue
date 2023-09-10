<template>
  <div class="min-h-screen flex flex-col justify-center sm:py-12">
    <div class="relative py-3 sm:max-w-xl sm:mx-auto">
      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"
      ></div>
      <div class="relative px-4 shadow-lg sm:rounded-3xl sm:p-20">
        <div class="max-w-md mx-auto">
          <div class="flex flex-col w-full">
            <label class="font-bold mb-2 text-gray-700" for="bot-selector">Select a Bot:</label>
            <select
              id="bot-selector"
              v-model="selectedBot"
              class="form-select block w-full mt-1"
              @change="handleChange"
            >
              <option disabled value="">Please select a bot</option>
              <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                {{ bot.name }}
              </option>
            </select>
            <div v-if="currentBot" class="mt-4 text-blue-500">
              <p>Active bot: {{ currentBot.name }}</p>
            </div>

            <!-- Card display -->
            <div v-if="currentBot" class="mt-4 p-4 bg-gray-100 rounded-lg shadow-md">
              <img
                :src="currentBot.avatarImage"
                alt="Bot Avatar"
                class="w-24 h-24 rounded-full mx-auto"
              />
              <h3 class="text-2xl mt-4 text-center">{{ currentBot.name }}</h3>
              <p class="mt-2 text-center">{{ currentBot.description }}</p>
              <nuxt-link
                :to="`/bot/id/${currentBot.id}`"
                class="mt-4 inline-block bg-indigo-500 text-white rounded-full px-5 py-2 transition transform hover:bg-indigo-600 hover:scale-105"
                >Check out this Bot</nuxt-link
              >
            </div>
            <div v-else>
              <title-image />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const selectedBot = ref('')
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

onMounted(async () => {
  try {
    await botStore.loadStore()
  } catch (err) {
    console.error('Failed to load store', err)
  }
})

const handleChange = async () => {
  await botStore.getBotById(Number(selectedBot.value))
}

watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
)

watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      selectedBot.value = newCurrentBot.id.toString()
    }
  }
)
</script>
