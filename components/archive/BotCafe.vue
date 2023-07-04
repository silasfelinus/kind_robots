<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <div
      v-for="bot in botStore.bots"
      :key="bot.id"
      class="card bordered"
      :class="{ 'ring-4 ring-blue-500': botStore.selectedBot === bot }"
      @click="botStore.selectBot(bot.id)"
    >
      <figure>
        <img :src="bot.avatarImage" alt="bot avatar" />
      </figure>
      <div class="card-body">
        <h2 class="card-title">{{ bot.name }}</h2>
        <p>{{ bot.description }}</p>
        <p>Type: {{ bot.botType }}</p>
        <p>Model: {{ bot.model }}</p>
        <p>Post: {{ bot.post }}</p>
        <p>Temperature: {{ bot.temperature }}</p>
        <p>Max Tokens: {{ bot.maxTokens }}</p>
        <p>Prompt: {{ bot.prompt }}</p>
        <div v-if="bot.image">
          <p>Image: {{ bot.image }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBotStore } from '../../stores/bots'

const botStore = useBotStore()
</script>

<style scoped>
img {
  width: 100%;
  height: auto;
}
</style>
