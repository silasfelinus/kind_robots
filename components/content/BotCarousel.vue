<template>
  <div class="relative flex flex-col items-center p-8 bg-base overflow-auto h-screen">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div class="mt-24 mx-auto max-w-4xl">
      <div class="h-96 carousel carousel-vertical rounded-box">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          class="carousel-item h-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
            'bg-primary': !activeBot || activeBot.id !== bot.id
          }"
          @click="setActiveBot(bot)"
        >
          <img :src="bot.avatarImage" class="w-full h-full object-cover rounded-lg" />
          <div :data-theme="bot.theme" class="bg-opacity-70 bg-primary text-accent p-2">
            <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
            <p class="mt-2 text-center">{{ bot.description }}</p>
          </div>
        </div>
      </div>
    </div>
    <side-nav />
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'
import { Bot } from '../../types/bot'

const botsStore = useBotsStore()
const bots: Bot[] = botsStore.getBots
let activeBot = computed(() => botsStore.getActiveBot)

onMounted(async () => {
  if (!bots.length) {
    await fetchBots()
  }
})

const fetchBots = async () => {
  try {
    const response = await fetch('/api/bots')
    const data = await response.json()
    botsStore.setBots(data)
    if (!activeBot.value && botsStore.getDefaultBot) {
      botsStore.setActiveBot(botsStore.getDefaultBot)
    }
  } catch (error) {
    console.error(error)
  }
}

const setActiveBot = (bot: Bot) => {
  botsStore.setActiveBot(bot)
}

watch(
  () => activeBot.value,
  (newActiveBot, oldActiveBot) => {
    if (newActiveBot) {
      const id = newActiveBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
)
</script>
