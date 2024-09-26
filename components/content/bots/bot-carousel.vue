<template>
  <div
    class="relative flex flex-col items-center p-2 bg-base-300 overflow-auto h-screen rounded-2xl"
  >
    <div class="m-4 mx-auto max-w-4xl">
      <div class="h-96 carousel carousel-vertical rounded-box">
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          class="carousel-item h-full cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-default': currentBot?.id === bot.id,
            'bg-primary': currentBot?.id !== bot.id,
          }"
          @click="setCurrentBot(bot.id)"
        >
          <img
            :src="bot.avatarImage ?? undefined"
            class="w-full h-full object-cover rounded-lg"
          />
        </div>
      </div>
      <div
        v-if="currentBot"
        class="mt-4 text-2xl text-dark font-semibold text-center"
      >
        <div class="card bg-info rounded-2xl w-fit">
          {{ currentBot.name }}
        </div>
        <p class="mt-2 text-xl text-dark text-center">
          {{ currentBot.description }}
        </p>
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
  (newCurrentBot) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
)
</script>

<style>
.carousel {
  scroll-behavior: smooth;
  overflow-y: hidden;
}

.carousel-item {
  margin-bottom: 20px;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
