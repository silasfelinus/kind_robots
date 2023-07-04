<template>
  <div class="flex flex-col p-8 bg-base">
    <transition-group name="list" tag="div">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="flex-col items-center justify-between w-full p-2 cursor-pointer mb-4 transition-colors ease-in-out duration-200 list-item"
        :class="{
          'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
          'bg-primary': !activeBot || activeBot.id !== bot.id
        }"
        @click="setActiveBot(bot)"
      >
        <img :src="bot.avatarImage" class="w-full h-96 object-cover rounded-lg" />
        <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
        <p class="mt-2 text-center">{{ bot.description }}</p>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()

const bots = botsStore.getBots
let activeBot = botsStore.getActiveBot

const setActiveBot = botsStore.setActiveBot

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
