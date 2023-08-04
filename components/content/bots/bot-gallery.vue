<template>
  <div class="flex flex-col w-full max-w-xs">
    <label class="font-bold mb-2 text-gray-700" for="bot-selector">Select a Bot:</label>
    <select id="bot-selector" v-model="selectedBot" class="form-select" @change="handleChange">
      <option disabled value="">Please select a bot</option>
      <option v-for="bot in bots" :key="bot.id" :value="bot.id">
        {{ bot.name }}
      </option>
    </select>
    <div v-if="currentBot" class="mt-4 text-blue-500">
      <p>Active bot: {{ currentBot.name }}</p>
    </div>

    <!-- Card display  -->
    <div v-if="currentBot" class="mt-4">
      <img :src="currentBot.avatarImage" alt="Bot Avatar" />
      <h3>{{ currentBot.name }}</h3>
      <p>{{ currentBot.description }}</p>
      <nuxt-link :to="`/bot/id/${currentBot.id}`">Check out this Bot</nuxt-link>
    </div>
    <div v-else>
      <title-image />
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
      selectedBot.value = newCurrentBot.id.toString() // convert to string here
    }
  }
)
</script>
