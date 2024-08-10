<template>
  <div class="flex flex-col w-full bg-base-200 rounded-2xl p-2">
    <label
      class="font-bold text-lg m-2"
      for="bot-selector"
    >🤖 Please Select your Bot:</label>
    <select
      id="bot-selector"
      v-model="selectedBot"
      class="form-select text-black bg-primary rounded"
      @change="handleChange"
    >
      <option
        disabled
        value=""
      >
        Please select a bot
      </option>
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
import { useBotStore, type Bot } from '../../../stores/botStore'

const botStore = useBotStore()
const selectedBot = ref('')
const bots = computed<Bot[]>(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

onMounted(async () => {
  try {
    await botStore.loadStore()
    // Automatically select the first bot if available
    if (bots.value.length > 0) {
      selectedBot.value = bots.value[0].id.toString() // Convert to string
      await botStore.getBotById(Number(selectedBot.value)) // Fetch the bot details
    }
  }
  catch (err) {
    console.error('🚨 Failed to load store', err)
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
  },
)

watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      selectedBot.value = newCurrentBot.id.toString() // convert to string here
    }
  },
)
</script>

<style scoped>
/* Add your styles here */
</style>
