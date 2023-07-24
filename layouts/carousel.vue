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
            'bg-accent text-default': activeBot && activeBot.id === bot.id,
            'bg-primary': !activeBot || activeBot.id !== bot.id
          }"
          @click="setActiveBot(bot)"
        >
          <img :src="bot.avatarImage ?? undefined" class="w-full h-full object-cover rounded-lg" />

          <div :data-theme="bot.theme" class="bg-opacity-70 bg-primary text-default p-2">
            <h2 class="mt-4 text-2xl text-dark font-semibold text-center">{{ bot.name }}</h2>
            <p class="mt-2 text-xl text-dark text-center">{{ bot.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore, Bot } from '../stores/botStore'

const botsStore = useBotStore()
const bots: ComputedRef<Bot[]> = computed(() => botsStore.bots)
const activeBot: ComputedRef<Bot | null> = computed(() => botsStore.getActiveBot)

const setActiveBot = (bot: Bot) => {
  botsStore.setActiveBot(bot.id)
}
onMounted(async () => {
  if (bots.value.length === 0) {
    await fetchBots()
  }
})

const fetchBots = async () => {
  try {
    await botsStore.fetchBots()
    if (!activeBot.value) {
      const defaultBot = botsStore.bots[0]
      if (defaultBot) botsStore.selectBot(defaultBot.id)
    }
  } catch (error) {
    console.error(error)
  }
}
</script>
