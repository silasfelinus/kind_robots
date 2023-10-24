<template>
  <div class="relative flex flex-col items-center bg-base overflow-auto h-screen">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <h1 class="mt-8 text-3xl font-semibold text-center">Welcome to Kind Robots</h1>
    <div class="mt-24 mx-auto max-w-4xl">
      <div class="h-96 carousel carousel-vertical rounded-box">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          class="carousel-item h-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-default': currentBot?.id === bot.id,
            'bg-primary': currentBot?.id !== bot.id
          }"
          @click="setCurrentBot(bot.id)"
        >
          <img :src="bot.avatarImage ?? undefined" class="w-full object-cover rounded-lg" />
        </div>
      </div>
      <div v-if="currentBot" class="mt-4 text-2xl text-dark font-semibold text-center">
        {{ currentBot.name }}
        <p class="mt-2 text-xl text-dark text-center">{{ currentBot.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

const setCurrentBot = (botId: number) => {
  botStore.getBotById(botId)
}

onMounted(async () => {
  if (bots.value.length === 0) {
    await botStore.loadStore()
  }
})

watch(
  () => currentBot.value,
  (newBot) => {
    if (newBot) {
      const carousel = document.querySelector('.carousel') as HTMLElement
      const botElement = document.getElementById(`bot-${newBot.id}`) as HTMLElement
      if (carousel && botElement) {
        const carouselRect = carousel.getBoundingClientRect()
        const botElementRect = botElement.getBoundingClientRect()
        const offset = botElementRect.top - carouselRect.top
        carousel.scrollTop = offset - (carousel.clientHeight - botElement.clientHeight) / 2
      }
    }
  }
)
</script>
