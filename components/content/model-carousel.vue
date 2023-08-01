<template>
  <div class="relative flex flex-col items-center p-8 bg-base overflow-auto h-screen">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div class="mt-24 mx-auto max-w-4xl">
      <div class="h-96 carousel carousel-vertical rounded-box">
        <div
          v-for="bot in bots"
          :key="bot.id"
          class="carousel-item h-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-default animate-pulse': currentBot && currentBot.id === bot.id,
            'bg-primary': !currentBot || currentBot.id !== bot.id
          }"
          @click="setCurrentBot(bot)"
        >
          <NuxtLink :to="`/bot/id/${bot.id}`">
            <img
              :src="bot.avatarImage ?? undefined"
              class="w-full h-full object-cover rounded-lg"
            />

            <div :data-theme="bot.theme" class="bg-opacity-70 bg-primary text-default p-2">
              <h2 class="mt-4 text-2xl text-dark font-semibold text-center">{{ bot.name }}</h2>
              <p class="mt-2 text-xl text-dark text-center">{{ bot.description }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
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
watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
)
</script>
