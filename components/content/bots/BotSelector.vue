<template>
  <div class="flex flex-col w-full max-w-100 bg-base-300 rounded-2xl p-2">
    <label class="font-bold text-lg m-2" for="bot-selector">
      🤖 Please Select your Bot:
    </label>
    <select
      id="bot-selector"
      v-model="selectedBotId"
      class="form-select text-black bg-primary rounded"
    >
      <option value="">Make New Bot</option>
      <option
        v-for="bot in bots"
        :key="bot.id"
        :value="bot.id"
        class="text-black"
      >
        {{ bot.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useBotStore, type Bot } from './../../../stores/botStore'

const botStore = useBotStore()

// Computed property for the list of bots
const bots = computed<Bot[]>(() => botStore.bots)

// Computed property for the selected bot's ID
const selectedBotId = computed({
  get: () => botStore.currentBot?.id || '',
  set: (id) => {
    if (id) {
      botStore.selectBot(id) // Select the bot by ID
    } else {
      botStore.deselectBot() // Deselect the bot to create a new one
    }
  },
})

// Load the bots on mount and set the default bot if available
onMounted(async () => {
  try {
    await botStore.loadStore()
    if (!selectedBotId.value && bots.value.length > 0) {
      selectedBotId.value = bots.value[0].id
    }
  } catch (err) {
    console.error('🚨 Failed to load store', err)
  }
})
</script>

<style scoped>
/* Add your styles here */
</style>
