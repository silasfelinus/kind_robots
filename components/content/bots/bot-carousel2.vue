<template>
  <div
    class="relative flex flex-col items-center bg-base overflow-hidden h-screen"
  >
    <!-- Background Gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    ></div>

    <!-- Header -->
    <h1 class="mt-8 text-3xl font-semibold text-center">
      Welcome to Kind Robots
    </h1>

    <!-- Carousel Container -->
    <div
      class="mt-12 mx-auto max-w-4xl relative h-full flex flex-col justify-center"
    >
      <!-- Non-Intrusive Spinner -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      >
        <div
          class="w-16 h-16 border-4 border-accent border-t-transparent border-solid rounded-full animate-spin"
        ></div>
      </div>

      <!-- Bot Carousel -->
      <div
        class="carousel carousel-vertical rounded-box h-96 flex items-center"
      >
        <div
          v-for="bot in bots"
          :id="`bot-${bot.id}`"
          :key="bot.id"
          class="carousel-item h-3/4 cursor-pointer transition-colors ease-in-out duration-200"
          :class="{
            'bg-accent text-default': currentBot?.id === bot.id,
            'bg-primary': currentBot?.id !== bot.id,
          }"
          @click="setCurrentBot(bot.id)"
        >
          <img
            :src="bot.avatarImage ?? undefined"
            class="w-full h-full object-contain rounded-lg"
          />
        </div>
      </div>

      <!-- Current Bot Information -->
      <div
        v-if="currentBot"
        class="mt-4 text-2xl text-dark font-semibold text-center"
      >
        {{ currentBot.name }}
        <p class="mt-2 text-xl text-dark text-center">
          {{ currentBot.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBotStore } from './../../../stores/botStore'

// Bot store setup
const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)
const isLoading = ref(true)

// Set the current bot function
const setCurrentBot = (botId: number) => {
  botStore.getBotById(botId)
}

// Load bots on mount and stop loading spinner
onMounted(async () => {
  if (bots.value.length === 0) {
    await botStore.loadStore()
  }
  isLoading.value = false
})
</script>
