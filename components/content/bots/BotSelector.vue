<template>
  <div class="flex flex-col w-full bg-base-300 rounded-2xl p-2">
    <label class="font-bold text-lg m-2" for="bot-selector"
      >🤖 Please Select your Bot:</label
    >
    <select
      id="bot-selector"
      v-model="selectedBot"
      class="form-select text-black bg-primary rounded"
      @change="handleChange"
    >
      <option disabled value="">Please select a bot</option>
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
import { ref, onMounted, computed, watch } from 'vue'
import { useBotStore, type Bot } from './../../../stores/botStore'

const botStore = useBotStore()
const selectedBot = ref('')
const bots = computed<Bot[]>(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

// Load the bots on mount and set default bot if available
onMounted(async () => {
  try {
    await botStore.loadStore()
    if (bots.value.length > 0) {
      selectedBot.value = bots.value[0].id.toString() // Convert to string for select
      await botStore.getBotById(Number(selectedBot.value)) // Load the default bot
    }
  } catch (err) {
    console.error('🚨 Failed to load store', err)
  }
})

// Handle change in bot selection
const handleChange = async () => {
  await botStore.getBotById(Number(selectedBot.value))
}

// Only trigger smooth scrolling when the bot changes via user interaction
let preventScroll = false

watch(
  () => currentBot.value,
  (newCurrentBot, oldCurrentBot) => {
    if (newCurrentBot && !preventScroll) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // Reset the flag after scroll
    preventScroll = false
  }
)

// Sync selected bot with current bot
watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      selectedBot.value = newCurrentBot.id.toString() // Convert to string for select element
    }
  }
)
</script>

<style scoped>
/* Add your styles here */
</style>
