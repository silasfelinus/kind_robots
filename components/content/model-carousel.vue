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
            'bg-accent text-default': selectedBotId === bot.id,
            'bg-primary': selectedBotId !== bot.id
          }"
          @click="setCurrentBot(bot.id)"
        >
          <NuxtLink :to="`/bot/id/${bot.id}`">
            <img
              :src="bot.avatarImage ?? undefined"
              class="w-full h-full object-cover rounded-lg"
            />
          </NuxtLink>
        </div>
      </div>
      <div v-if="selectedBot" class="mt-4 text-2xl text-dark font-semibold text-center">
        {{ selectedBot.name }}
        <p class="mt-2 text-xl text-dark text-center">{{ selectedBot.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBotStore, Bot } from '../../stores/botStore'

const botStore = useBotStore()
const route = useRoute()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

const setCurrentBot = (botId: number) => {
  const bot = bots.value.find((b) => b.id === botId)
  if (bot) {
    botStore.getBotById(bot.id)
  }
}
const selectedBotId = computed(() => {
  const idParam = route.params.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam
  return parseInt(id, 10)
})

const selectedBot = computed(() => {
  return bots.value.find((bot) => bot.id === selectedBotId.value)
})
onMounted(async () => {
  if (bots.value.length === 0) {
    await fetchBots()
  }

  if (selectedBotId.value) {
    setCurrentBot(selectedBotId.value)
  }
})

const fetchBots = async () => {
  try {
    await botStore.getBots()
  } catch (error) {
    console.error(error)
  }
}

watch(
  () => selectedBotId.value,
  (newBotId) => {
    if (newBotId) {
      const botElement = document.getElementById(`bot-${newBotId}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
)

watch(
  () => currentBot.value,
  (newBotId) => {
    if (newBotId) {
      const botElement = document.getElementById(`bot-${newBotId}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
)
</script>
