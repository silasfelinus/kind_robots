<template>
  <div class="relative flex flex-col p-8 bg-base overflow-auto h-screen">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div
      class="fixed top-8 left-8 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg z-20 text-center"
      style="backdrop-filter: blur(5px)"
    >
      <label for="botSelect" class="text-lg font-semibold mb-2 block">Select a robot:</label>
      <select
        id="botSelect"
        v-model="activeBotId"
        class="mb-4 block"
        @change="startScrolling(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="bot in bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>
    <div class="mt-24">
      <transition-group name="list" tag="div" class="space-y-4">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          class="flex flex-col items-center justify-between w-full p-2 cursor-pointer mb-4 transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
            'bg-primary': !activeBot || activeBot.id !== bot.id
          }"
          @click="startScrolling(bot.id)"
        >
          <img :src="bot.avatarImage" class="w-full h-96 object-cover rounded-lg" />
          <div class="bg-opacity-70 bg-black text-white p-2">
            <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
            <p class="mt-2 text-center">{{ bot.description }}</p>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'
import { Bot } from '../../types/bot'

const botsStore = useBotsStore()

const bots: Bot[] = botsStore.getBots
let activeBot = botsStore.getActiveBot
let activeBotId = ref(activeBot ? activeBot.id : null)

const startScrolling = (id: any) => {
  id = Number(id)
  activeBotId.value = id
  setActiveBotId(id)
}

const setActiveBotId = (id: number) => {
  const bot = bots.find((bot) => bot.id === id)
  if (bot) {
    botsStore.setActiveBot(bot)
  }
}

onMounted(() => {
  if (!bots.length) {
    fetchBots()
  }
})

const fetchBots = async () => {
  try {
    const response = await fetch('/api/bots')
    const data = await response.json()
    botsStore.setBots(data)
    if (!activeBot && botsStore.getDefaultBot) {
      botsStore.setActiveBot(botsStore.getDefaultBot)
    }
  } catch (error) {
    console.error(error)
  }
}

watchEffect(() => {
  if (activeBotId.value) {
    const botElement = document.getElementById(`bot-${activeBotId.value}`)
    botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: transform 1s;
}
.list-enter,
.list-leave-to {
  transform: translateY(100%);
}
.list-leave,
.list-enter-to {
  transform: translateY(0);
}
</style>
