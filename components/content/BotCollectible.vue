<template>
  <div class="card bg-base-100 text-base-content shadow-xl overflow-auto p-4 rounded-lg">
    <div class="inner-card bg-primary text-secondary p-4 rounded-lg flex flex-col items-center">
      <h3 class="text-xl font-bold mb-2">{{ bot.name }}</h3>
      <p>Bot ID: {{ bot.id }} / {{ totalBots }}</p>
      <p>{{ randomMessage }}</p>
      <div class="mt-4 flex items-center">
        <site-logo class="mr-2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
let bot = computed(() => botsStore.getActiveBot)
let totalBots = computed(() => botsStore.getBots.length)

let randomMessages = [
  'Kind Robots: Where AI and humanity harmonize!',
  "You've discovered a harmonious bot from Kind Robots!",
  "Together with Kind Robots, you're creating a better future!",
  'Embrace the future with Kind Robots!',
  'Kind Robots: More than code, a force for good!',
  'This bot embodies the spirit of Kind Robots!',
  "You're powering positive change with Kind Robots!",
  'Kind Robots: Creating bots for a kinder world!',
  'Kind Robots: Nurturing the bond between AI and humanity!',
  "Congratulations! You've embraced the Kind Robots ethos!",
  'Joining hands with Kind Robots for a harmonious future!',
  'Empowering a kinder tomorrow with Kind Robots!'
]

let randomMessage = ref(randomMessages[Math.floor(Math.random() * randomMessages.length)])
</script>

<style scoped>
.card {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.inner-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
