<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { botData } from '../../../stores/seeds/seedBots' // Importing the seed data

const botStore = useBotStore()
const bots = computed(() => botStore.bots)

const updateStoreWithLocalData = async () => {
  // Assuming you have an appropriate method to update the store with local data
  // You can modify this part according to your store's structure
  try {
    await botStore.updateBots(botData)
    alert('Store updated successfully!')
  }
  catch (error) {
    console.error('Failed to update store', error)
    alert('An error occurred while updating the store.')
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <button
      class="bg-blue-500 hover:bg-blue-700 text-default font-bold py-2 px-4 rounded"
      @click="updateStoreWithLocalData"
    >
      Update Store with Local Data
    </button>
    <div
      v-if="bots.length > 0"
      class="mt-4"
    >
      <h2 class="text-xl font-bold">
        Current Bots:
      </h2>
      <ul>
        <li
          v-for="bot in bots"
          :key="bot.id"
        >
          {{ bot.name }} - {{ bot.avatarImage }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No bots available.</p>
    </div>
  </div>
</template>
