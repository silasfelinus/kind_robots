<template>
  <div class="bot-details">
    <h2>{{ bot.name }}</h2>
    <p>Type: {{ bot.BotType }}</p>
    <p>Description: {{ bot.description }}</p>
    <!-- Add other fields as needed -->
  </div>
</template>

<script setup lang="ts">
import { Bot } from '@prisma/client' // or import from your store if that's where the type is defined

const props = defineProps({
  bot: {
    type: Object as () => Partial<Bot>,
    required: true
  }
})
</script>
