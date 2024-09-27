<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <div
      v-for="bot in botStore.bots"
      :key="bot.id"
      class="card bordered"
      :class="{ 'ring-4 ring-blue-500': botStore.selectedBotId === bot.id }"
      @click="botStore.selectBot(bot.id)"
    >
      <figure>
        <img
          :src="bot.avatarImage || '/path/to/default-avatar.png'"
          alt="bot avatar"
        />
      </figure>
      <div class="card-body">
        <h2 class="card-title">{{ bot.name }}</h2>
        <p v-if="bot.subtitle">{{ bot.subtitle }}</p>
        <p v-if="bot.description">{{ bot.description }}</p>
        <p>Type: {{ bot.BotType }}</p>
        <p>Intro: {{ bot.botIntro }}</p>
        <p>User Intro: {{ bot.userIntro }}</p>
        <p>Prompt: {{ bot.prompt }}</p>

        <!-- Conditionally render optional properties -->
        <p v-if="bot.trainingPath">Training Path: {{ bot.trainingPath }}</p>
        <p v-if="bot.theme">Theme: {{ bot.theme }}</p>
        <p v-if="bot.personality">Personality: {{ bot.personality }}</p>
        <p v-if="bot.modules">Modules: {{ bot.modules }}</p>
        <p v-if="bot.sampleResponse">
          Sample Response: {{ bot.sampleResponse }}
        </p>
        <p v-if="bot.tagline">Tagline: {{ bot.tagline }}</p>

        <!-- Display bot status -->
        <p v-if="bot.underConstruction">⚠️ Under Construction</p>
        <p v-if="bot.isPublic">🌐 Public Bot</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
</script>

<style scoped>
img {
  width: 100%;
  height: auto;
}
</style>
