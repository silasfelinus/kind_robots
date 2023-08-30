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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const bots = ref([])

const fetchBots = async () => {
  try {
    const { data } = await axios.get('/api/bots')
    bots.value = data
  } catch (error) {
    console.error('Failed to fetch bots:', error)
  }
}

fetchBots()

const router = useRouter()

const selectBot = (id) => {
  router.push(`/bot/id/${id}`)
}
</script>
