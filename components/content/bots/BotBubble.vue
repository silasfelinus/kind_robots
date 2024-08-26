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
    <div class="mx-auto w-full overflow-x-auto">
      <!-- Bot Scroll Container -->
      <div
        ref="scrollContainer"
        class="flex space-x-4 px-2 scroll-container"
        :style="scrollStyle"
      >
        <div
          v-for="(bot, index) in bots"
          :key="`bot-${index}`"
          class="flex-shrink-0 flex flex-col items-center cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out"
          style="width: 30vw; min-width: 120px"
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
import { computed, ref, onMounted, nextTick } from 'vue'
import { useBotStore } from '@/stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)
const currentOffset = ref(0)

const scrollStyle = computed(() => ({
  transform: `translateX(${currentOffset.value}px)`,
  transition: 'transform 0.3s ease-in-out',
}))

onMounted(async () => {
  await nextTick()
  const firstBotWidth = scrollContainer.value.children[0].clientWidth
  currentOffset.value = -firstBotWidth
})

function selectBot(botId) {
  botStore.selectBot(botId)
}

function adjustScroll(direction) {
  const singleWidth = scrollContainer.value.children[0].clientWidth
  const maxOffset = -singleWidth * (bots.value.length - 1)
  currentOffset.value += direction * singleWidth

  if (currentOffset.value > 0) {
    currentOffset.value = maxOffset
  } else if (currentOffset.value < maxOffset) {
    currentOffset.value = 0
  }
}

function scrollLeft() {
  adjustScroll(1)
}

function scrollRight() {
  adjustScroll(-1)
}
</script>

<style>
.scroll-container {
  display: flex;
  min-width: 300%; /* Make sure there is enough room for all items */
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
}

.bot-bubble {
  scroll-snap-align: start;
}
</style>
