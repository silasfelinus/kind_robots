<template>
  <div class="relative flex flex-col items-center p-2 bg-base overflow-auto h-screen z-10">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div class="mx-2 my-2">
      <transition-group name="list" tag="div" class="space-y-2">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          :style="{ backgroundColor: bot.theme }"
          class="flex flex-col items-center justify-between w-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
            'bg-primary': !activeBot || activeBot.id !== bot.id
          }"
          @click="setActiveBot(bot)"
        >
          <div :data-theme="bot.theme" class="rounded-lg m-1">
            <avatar-image />
            <div class="bg-opacity-80 bg-primary text-dark p-2">
              <!-- Modified line -->
              <h2 class="mt-1 text-xl font-semibold text-center">{{ bot.name }}</h2>
              <p class="mt-1 text-center">{{ bot.description }}</p>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bot } from '@prisma/client'
import { useBotStore } from '../../stores/bots'

const botsStore = useBotStore()
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
../../stores/botStore