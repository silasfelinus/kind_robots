<template>
  <div class="relative flex flex-col items-center p-2 bg-base overflow-auto h-screen z-10">
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>
    <div class="mx-2 my-2">
      <transition-group name="list" tag="div" class="space-y-2">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          :style="{ backgroundColor: bot.theme || 'defaultColor' }"
          class="flex flex-col items-center justify-between w-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-secondary': currentBot && currentBot.id === bot.id,
            'bg-primary': !currentBot || currentBot.id !== bot.id,
          }"
          @click="setCurrentBot(bot)"
        >
          <div :data-theme="bot.theme" class="rounded-lg m-1">
            <avatar-image />
            <div class="bg-opacity-80 bg-primary text-dark p-2">
              <!-- Modified line -->
              <h2 class="mt-1 text-xl font-semibold text-center">{{ bot.name }}</h2>
              <p class="mt-1 text-center">{{ bot.description }}</p>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useBotStore, type Bot } from '@/stores/botStore';

const botsStore = useBotStore();
const bots = computed(() => botsStore.bots);

let currentBot = computed(() => botsStore.currentBot);

onMounted(async () => {
  if (!bots.value) {
    await fetchBots();
  }
});

const fetchBots = async () => {
  try {
    const response = await fetch('/api/bots');
    const data = await response.json();
    botsStore.addBots(data);
    if (!currentBot.value && data.length > 0) {
      botsStore.getBotById(data[0].id);
    }
  } catch (error) {
    console.error(error);
  }
};

const setCurrentBot = (bot: Bot) => {
  botsStore.getBotById(bot.id);
};

watch(
  () => currentBot.value,
  (newCurrentBot, oldCurrentBot) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id;
      const botElement = document.getElementById(`bot-${id}`);
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
);
</script>
