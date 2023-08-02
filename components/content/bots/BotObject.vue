<template>
  <div :class="layoutClass">
    <div v-if="bot" :class="contentClass">
      <div v-if="bot.avatarImage" class="flex justify-center">
        <img :src="bot.avatarImage" alt="Bot Avatar" class="w-20 h-20 rounded-full mb-4" />
      </div>
      <h3 class="text-lg font-bold mb-2">{{ bot.name }}</h3>
      <h2 v-if="bot.subtitle" class="text-md font-semibold mb-1">Subtitle: {{ bot.subtitle }}</h2>
      <p v-if="bot.description" class="mb-1">Description: {{ bot.description }}</p>
      <p v-if="bot.botIntro" class="mb-1">Bot Intro: {{ bot.botIntro }}</p>
      <p v-if="bot.userIntro" class="mb-1">User Intro: {{ bot.userIntro }}</p>
      <p v-if="bot.prompt" class="mb-1">Prompt: {{ bot.prompt }}</p>
      <p v-if="bot.theme" class="mb-1">Theme: {{ bot.theme }}</p>
      <p v-if="bot.personality" class="mb-1">Personality: {{ bot.personality }}</p>
    </div>
    <div
      v-for="(module, index) in bot?.modules?.split(',')"
      :key="index"
      class="p-2 m-1 bg-gray-100 rounded-md"
    >
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
      return 'flex justify-center items-center rounded-full bg-primary'
    case LayoutType.HERO:
      return 'bg-hero'
    case LayoutType.CAROUSEL:
      return 'carousel'
    case LayoutType.CARD:
      return 'flex flex-col bg-secondary w-72 rounded-lg'
    case LayoutType.FULL:
      return 'flex flex-col w-full h-full bg-accent'
    default:
      return ''
  }
})
const contentClass = computed(() => {
  switch (props.layout) {
    case LayoutType.BADGE:
      return 'p-4 bg-primary text-white rounded-lg'
    case LayoutType.HERO:
      return 'p-4 bg-hero text-white'
    case LayoutType.CAROUSEL:
      return 'p-4 carousel'
    case LayoutType.CARD:
      return 'p-4 bg-secondary w-72 rounded-lg'
    case LayoutType.FULL:
      return 'p-4 w-full h-full bg-accent'
    default:
      return 'p-4'
  }
})
</script>
