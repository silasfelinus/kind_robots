<template>
  <div class="relative flex flex-col items-center p-8 bg-base overflow-auto h-screen">
    <BotSelector />
    <img class="w-48 h-48 mt-24 rounded" src="/images/kindtitle.webp" alt="Logo" />
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div class="mt-24 mx-auto max-w-4xl">
      <transition-group name="list" tag="div" class="space-y-2">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          :style="{ backgroundColor: bot.theme }"
          class="flex flex-col items-center justify-between w-full p-2 cursor-pointer mb-2 transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
            'bg-primary': !activeBot || activeBot.id !== bot.id
          }"
          @click="setActiveBot(bot)"
        >
          <div :data-theme="bot.theme">
            <img :src="bot.avatarImage" class="w-full h-96 object-cover rounded-lg" />
            <div class="bg-opacity-70 bg-primary text-accent p-2">
              <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
              <p class="mt-2 text-center">{{ bot.description }}</p>
            </div>
          </div>
        </div>
      </transition-group>
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
