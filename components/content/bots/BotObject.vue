<template>
  <div :class="layoutClass">
    <div v-if="bot">
      <h3>{{ bot.name }}</h3>
      <div v-if="bot.avatarImage" class="avatar">
        <img :src="bot.avatarImage" alt="Bot Avatar" />
      </div>
      <div class="info">
        <h2 v-if="bot.subtitle">Subtitle: {{ bot.subtitle }}</h2>
        <p v-if="bot.description">Description: {{ bot.description }}</p>
        <p v-if="bot.botIntro">Bot Intro: {{ bot.botIntro }}</p>
        <p v-if="bot.userIntro">User Intro: {{ bot.userIntro }}</p>
        <p v-if="bot.prompt">Prompt: {{ bot.prompt }}</p>
        <p v-if="bot.theme">Theme: {{ bot.theme }}</p>
        <p v-if="bot.personality">Personality: {{ bot.personality }}</p>
      </div>
    </div>
    <div v-for="(module, index) in bot?.modules?.split(',')" :key="index" class="module-card">
      {{ module.trim() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutType, useScreenStore } from '../../../stores/screenStore'
import { useBotStore, Bot } from '../../../stores/botStore'

const botStore = useBotStore()
botStore.loadStore()

const props = defineProps({
  bot: {
    type: Object as () => Partial<Bot>,
    default: () => ({})
  },
  layout: {
    type: String as () => LayoutType,
    default: LayoutType.BADGE
  }
})

const bot = computed(() => {
  return props.bot
})
const layoutClass = computed(() => {
  switch (props.layout) {
    case LayoutType.BADGE:
      return 'bot-badge'
    case LayoutType.HERO:
      return 'bot-hero'
    case LayoutType.CAROUSEL:
      return 'bot-carousel'
    case LayoutType.CARD:
      return 'bot-card'
    case LayoutType.FULL:
      return 'bot-fullscreen'
    default:
      return ''
  }
})
</script>

<style scoped>
.bot-badge,
.bot-card,
.bot-fullscreen {
  background: var(--bg-base);
  font-size: small;
}

.bot-badge {
  display: inline-block;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--bg-primary);
  text-align: center;
  position: relative;
}

.bot-badge .avatar {
  width: 80%;
  border-radius: 50%;
  margin: 10% auto;
}

.bot-badge h1 {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
}

.bot-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  width: 300px;
  border-radius: 15px;
}

.bot-card .avatar {
  width: 25%;
  margin: auto;
}

.bot-card .info {
  font-size: large;
}

.bot-fullscreen {
  background: var(--bg-accent);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.bot-fullscreen .info {
  font-size: large;
}

.bot-fullscreen .modules {
  display: flex;
  flex-wrap: wrap;
}

.bot-fullscreen .module-card {
  width: 200px;
  background: var(--bg-primary);
  margin: 10px;
  padding: 10px;
  border-radius: 10px;
}

.fade-transition-enter-active,
.fade-transition-leave-active {
  transition: opacity 0.5s;
}
.fade-transition-enter,
.fade-transition-leave-to {
  opacity: 0;
}

.slide-transition-enter-active,
.slide-transition-leave-active {
  transition: transform 0.5s;
}
.slide-transition-enter,
.slide-transition-leave-to {
  transform: translateX(-100%);
}

.bounce-transition-enter-active {
  transition: transform 0.5s;
  transform: scale(1);
}
.bounce-transition-enter {
  transform: scale(0);
}
</style>
