<template>
  <div class="flex flex-col p-8 bg-base">
    <transition-group name="list" tag="div">
      <div v-for="bot in bots" :key="bot.id" @click="setCurrentBot(bot)">
        <img :src="bot.avatarImage" class="w-full h-96 object-cover rounded-lg" />
        <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
        <p class="mt-2 text-center">{{ bot.description }}</p>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBotStore, Bot } from '../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

const setCurrentBot = (bot: Bot) => {
  botStore.getBotById(bot.id)
}

onMounted(async () => {
  if (bots.value.length === 0) {
    await fetchBots()
  }
})

const fetchBots = async () => {
  try {
    await botStore.getBots()
    if (!currentBot.value && bots.value.length > 0) {
      botStore.getBotById(bots.value[0].id)
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
