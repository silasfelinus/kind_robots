<template>
  <div class="relative w-full">
    <!-- Left navigation arrow -->
    <div class="absolute left-2 z-10 cursor-pointer" @click="scrollLeft">
      <svg
        class="w-8 h-8 text-gray-600 hover:text-gray-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        ></path>
      </svg>
    </div>

    <!-- Bot scroll container -->
    <div
      ref="scrollContainer"
      class="flex overflow-x-auto hide-scrollbar space-x-4"
      @scroll="checkScroll"
    >
      <div
        v-for="bot in bots"
        :key="bot.id"
        :class="[
          'bot-bubble',
          bot.id === selectedBotId
            ? 'flex-row items-start'
            : 'flex-col items-center',
        ]"
        class="cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out min-w-max"
        @click="selectBot(bot.id)"
      >
        <!-- Bot Avatar -->
        <img
          :src="bot.avatarImage"
          alt="Bot's Avatar"
          class="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover transition-all duration-300 ease-in-out"
        />

        <!-- Conditional Bot Info -->
        <div v-if="bot.id === selectedBotId" class="bot-info pl-4 flex-grow">
          <h3 class="text-lg font-semibold">{{ bot.name }}</h3>
          <p class="text-sm text-gray-600">{{ bot.tagline }}</p>
        </div>

        <!-- Always visible Bot Name -->
        <h3 v-else class="text-lg font-semibold mt-2">{{ bot.name }}</h3>
      </div>
    </div>

    <!-- Right navigation arrow -->
    <div class="absolute right-2 z-10 cursor-pointer" @click="scrollRight">
      <svg
        class="w-8 h-8 text-gray-600 hover:text-gray-800"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        ></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const selectedBotId = computed(() => botStore.selectedBotId)
const scrollContainer = ref(null)

function selectBot(botId) {
  botStore.selectBot(botId)
}

function scrollLeft() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
  }
}

function scrollRight() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
  }
}

function checkScroll() {
  // Optional: Check if you need to load more bots when the user reaches the end
}
</script>

<style>
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera*/
}
</style>
