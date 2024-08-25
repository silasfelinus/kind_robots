<template>
  <div class="relative w-full">
    <!-- Navigation Arrows -->
    <div class="absolute left-2 z-10 cursor-pointer" @click="scrollLeft">
      <!-- Left Arrow SVG -->
    </div>
    <div class="absolute right-2 z-10 cursor-pointer" @click="scrollRight">
      <!-- Right Arrow SVG -->
    </div>

    <!-- Bot Scroll Container -->
    <div
      ref="scrollContainer"
      class="flex overflow-x-scroll hide-scrollbar space-x-4 px-2"
    >
      <div
        v-for="bot in bots"
        :key="bot.id"
        :class="[
          'bot-bubble',
          bot.id === selectedBotId
            ? 'flex-row items-start'
            : 'flex-col items-center',
          'cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out min-w-max',
        ]"
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
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const selectedBotId = computed(() => botStore.selectedBotId)
const scrollContainer = ref(null)
let scrollWidth = 0

onMounted(() => {
  calculateScrollWidth()
})

function selectBot(botId) {
  botStore.selectBot(botId)
}

function calculateScrollWidth() {
  // Dynamically calculate scroll width based on the container's child elements
  const children = scrollContainer.value?.children
  if (children && children.length > 0) {
    scrollWidth = children[0].offsetWidth + children[0].offsetLeft * 2 // Margin times number of visible elements
  }
}

function scrollLeft() {
  if (scrollContainer.value && scrollWidth) {
    scrollContainer.value.scrollBy({ left: -scrollWidth, behavior: 'smooth' })
  }
}

function scrollRight() {
  if (scrollContainer.value && scrollWidth) {
    scrollContainer.value.scrollBy({ left: scrollWidth, behavior: 'smooth' })
  }
}
</script>

<style>
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  scrollbar-width: none; /* For all browsers */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
