<template>
  <div class="card bg-base-100 text-base-content shadow-xl mb-4 flex-grow">
    <div class="flex flex-col items-center">
      <figure class="w-48 h-48 rounded-full overflow-hidden mb-4">
        <img
          v-if="activeBot"
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
import { computed } from 'vue'
import { useBotStore } from '../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.getBots)
let activeBot = computed(() => botStore.getActiveBot)

const onBotSelected = (botId: number) => {
  botStore.setActiveBot(botId)
}
</script>
