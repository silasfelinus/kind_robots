<template>
  <div class="flex flex-col p-8 bg-base">
    <div>
      <label for="botSelect" class="text-lg font-semibold mb-2 block">Select a robot:</label>
      <select id="botSelect" v-model="activeBotId" class="mb-4 block" @change="setActiveBot">
        <option v-for="bot in bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>
    <transition-group name="list" tag="div" class="overflow-auto">
      <div
        v-for="bot in bots"
        :key="bot.id"
        :ref="(el) => (bot.id === activeBotId ? (activeBotRef = el) : null)"
        class="flex flex-col items-center justify-between w-full p-2 cursor-pointer mb-4 transition-colors ease-in-out duration-200"
        :class="{
          'bg-accent text-secondary': activeBot && activeBot.id === bot.id,
          'bg-primary': !activeBot || activeBot.id !== bot.id
        }"
        @click="setActiveBotId(bot.id)"
      >
        <img :src="bot.avatarImage" class="w-full h-96 object-cover rounded-lg" />
        <div class="bg-opacity-70 bg-black text-white p-2">
          <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
          <p class="mt-2 text-center">{{ bot.description }}</p>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'
import { Bot } from '../../types/bot'

const botsStore = useBotsStore()

const bots: Bot[] = botsStore.getBots
let activeBot = botsStore.getActiveBot
let activeBotId = ref(activeBot ? activeBot.id : null)
const activeBotRef = ref<any>(null)

const setActiveBot = async () => {
  const bot = bots.find((bot) => bot.id === activeBotId.value)
  if (bot) {
    botsStore.setActiveBot(bot)
    await nextTick()
    if (activeBotRef.value instanceof HTMLElement) {
      activeBotRef.value.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const setActiveBotId = (id: number) => {
  activeBotId.value = id
  setActiveBot()
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
  if (activeBot) activeBotId.value = activeBot.id
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
