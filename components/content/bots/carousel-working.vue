<template>
  <div class="relative flex flex-col items-center p-8 bg-base overflow-auto h-screen">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    />
    <div class="mt-24 mx-auto max-w-4xl">
      <div class="h-96 carousel carousel-vertical rounded-box">
        <div
          v-for="bot in bots"
          :key="bot.id"
          class="carousel-item h-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-default animate-pulse': currentBot && currentBot.id === bot.id,
            'bg-primary': !currentBot || currentBot.id !== bot.id,
          }"
          @click="setCurrentBot(bot)"
        >
          <img
            :src="bot.avatarImage ?? undefined"
            alt="Bot Avatar"
            class="w-full h-full object-cover rounded-lg"
          >
          <div
            :data-theme="bot.theme"
            class="bg-opacity-70 bg-primary text-default p-2"
          >
            <h2 class="mt-4 text-2xl text-dark font-semibold text-center">
              {{ bot.name }}
            </h2>
            <p class="mt-2 text-xl text-dark text-center">
              {{ bot.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useBotStore, type Bot } from '../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

const setCurrentBot = (bot: Bot): void => {
  try {
    botStore.getBotById(bot.id)
  }
  catch (error) {
    console.error('Failed to set current bot', error)
  }
}

watch(
  () => currentBot.value,
  (newCurrentBot: Bot | null) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
)
</script>
