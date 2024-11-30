<template>
  <div class="bg-base-200 border border-gray-400 rounded-lg shadow-md p-4 flex flex-col">
    <!-- Character Image -->
    <div class="w-full h-32 bg-gray-800 rounded-lg mb-4 overflow-hidden">
      <img
        v-if="character.artImageId"
        :src="`/images/${character.artImageId}.jpg`"
        alt="Character Portrait"
        class="object-cover w-full h-full"
      />
      <img
        v-else
        src="/images/bot.webp"
        alt="Default Portrait"
        class="object-cover w-full h-full"
      />
    </div>

    <!-- Name and Class -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-800 truncate">
          {{ character.name || 'Unnamed Hero' }}
        </h2>
        <p class="text-sm text-gray-600">
          {{ character.class || 'Adventurer' }}
        </p>
      </div>
      <p class="text-sm text-gray-500">User: {{ username }}</p>
    </div>

    <!-- Stats -->
    <div class="flex flex-row justify-between items-center bg-base-300 rounded-lg shadow-inner p-2">
      <div
        v-for="i in statKeys.length"
        :key="'stat-' + i"
        class="flex flex-col items-center w-[16%] bg-base-200 border border-gray-500 rounded-md p-1"
      >
        <span class="text-xs font-bold uppercase text-gray-700">
          {{ character[`statName${i}`] || `Stat ${i}` }}
        </span>
        <span class="text-lg font-bold text-gray-800">
          {{ character[`statValue${i}`] || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

// Props for the character card
defineProps({
  character: {
    type: Object,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
})

// Dynamically get stat keys for rendering
const statKeys = [1, 2, 3, 4, 5, 6]
</script>
