<template>
  <div class="card bg-base-100 text-base-content shadow-xl mb-4 flex-grow">
    <div class="flex flex-col items-center">
      <figure class="w-48 h-48 rounded-full overflow-hidden mb-4">
        <img
          :src="activeBot.avatarImage ? activeBot.avatarImage : '/images/avatars/bot1.jpg'"
          class="object-cover w-full h-full"
          alt="Bot Avatar"
        />
      </figure>
      <BotSelector :bots="bots" @bot-selected="onBotSelected" />
      <theme-manager />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../../stores/bots'

const botsStore = useBotStore()
const bots = ref(botsStore.getBots)
let activeBot = computed(() => botsStore.getActiveBot)

const onBotSelected = (botId: number) => {
  const bot = bots.value.find((bot) => bot.id === botId)
  if (bot) {
    botsStore.setActiveBot(bot)
  }
}
</script>
../../stores/botStore
