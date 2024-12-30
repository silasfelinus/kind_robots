<template>
  <div
    class="relative flex flex-col items-center bg-base overflow-auto h-screen"
  >
    <!-- Background Gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
    />

    <h1
      v-if="currentBot"
      class="mt-4 text-4xl text-dark font-semibold text-center"
    >
      {{ currentBot.name }}
    </h1>

    <!-- Carousel Container -->
    <div class="mt-24 mx-auto max-w-4xl relative">
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
            class="w-full object-cover rounded-lg"
          />
        </div>
      </div>

      <!-- Current Bot Information -->
      <div v-if="currentBot">
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
