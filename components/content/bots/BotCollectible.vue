<template>
  <div class="card">
    <div class="inner-card">
      <h3 class="font-bold text-sm sm:text-base mb-2">{{ bot && bot.name }}</h3>
      <p class="text-xs sm:text-sm">Bot: {{ bot && bot.id + 1 }} / {{ totalBots }}</p>
      <p class="text-xs sm:text-sm">{{ randomMessage }}</p>
      <div class="mt-2 flex justify-center">
        <site-logo class="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBotStore } from '../../../stores/botStore';

const botStore = useBotStore();
const bot = computed(() => botStore.currentBot);
const totalBots = computed(() => botStore.bots);

const randomMessages = [
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
  'Empowering a kinder tomorrow with Kind Robots!',
];

const randomMessage = ref(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
</script>

<style scoped>
.card {
  background-color: var(--bg-base-200);
  color: var(--text-base-content);
  box-shadow: var(--shadow-xl);
  overflow: auto;
  padding: 1rem;
  border-radius: var(--rounded-lg);
  display: flex;
  justify-content: center;
  align-items: center;
}

.inner-card {
  background-color: var(--bg-base);
  padding: 1rem;
  border-radius: var(--rounded-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 20rem;
  text-align: center;
}
</style>
