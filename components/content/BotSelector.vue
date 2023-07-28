<template>
  <div class="flex flex-col w-full max-w-xs">
    <label class="font-bold mb-2 text-gray-700" for="bot-selector">Select a Bot:</label>
    <select id="bot-selector" v-model="selectedBot" class="form-select" @change="handleChange">
      <option disabled value="">Please select a bot</option>
      <option v-for="bot in bots" :key="bot.id" :value="bot.id">
        {{ bot.name }}
      </option>
    </select>
    <div v-if="activeBot" class="mt-4 text-blue-500">
      <p>Active bot: {{ activeBot.name }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBotStore } from '../../stores/botStore'

const botStore = useBotStore()
const selectedBot = ref('')

onMounted(async () => {
  await botStore.loadStore()
})

const handleChange = () => {
  botStore.getBotById(Number(selectedBot.value))
}

const bots = botStore.bots
const activeBot = computed(() => botStore.currentBot)
</script>
