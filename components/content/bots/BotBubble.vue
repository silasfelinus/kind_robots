<template>
  <div
    class="relative select-none overflow-hidden ml-4 mr-4 p-1 border rounded-2xl bg-base-200"
  >
    <!-- Navigation Arrows -->
    <div
      class="absolute left-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer"
      @click="scrollLeft"
    >
      <!-- Left Arrow SVG -->
      <svg
        fill="currentColor"
        viewBox="0 0 20 20"
        class="h-8 w-8 text-gray-600 hover:text-gray-800"
      >
        <path
          fill-rule="evenodd"
          d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L5.414 10l3.293 3.293a1 1 0 010 1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <div
      class="absolute right-4 top-1/2 -translate-y-1/2 z-50 cursor-pointer"
      @click="scrollRight"
    >
      <!-- Right Arrow SVG -->
      <svg
        fill="currentColor"
        viewBox="0 0 20 20"
        class="h-8 w-8 text-gray-600 hover:text-gray-800"
      >
        <path
          fill-rule="evenodd"
          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 10l-3.293-3.293a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Centering Container -->
    <div class="mx-auto w-full overflow-x-auto scroll-container">
      <!-- Bot Scroll Container -->
      <div class="flex space-x-4 px-2">
        <div
          v-for="(bot, index) in bots"
          :key="`bot-${index}`"
          class="flex-shrink-0 flex flex-col items-center cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out bot-bubble"
          @click="selectBot(bot.id)"
        >
          <img
            :src="bot.avatarImage"
            alt="Bot's Avatar"
            class="w-full h-auto rounded-full object-cover transition-all duration-300 ease-in-out"
          />
          <h3 class="text-lg font-semibold mt-2 truncate">{{ bot.name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)

function selectBot(botId) {
  botStore.selectBot(botId)
}

function scrollLeft() {
  scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' }) // Adjust pixel value as necessary
}

function scrollRight() {
  scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' }) // Adjust pixel value as necessary
}
</script>

<style>
.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.bot-bubble {
  width: 30vw; /* Responsive width, you can adjust this based on your design */
  min-width: 120px; /* Minimum width for smaller screens */
  scroll-snap-align: start;
}
</style>
