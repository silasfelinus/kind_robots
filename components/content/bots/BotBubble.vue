<template>
  <div
    class="relative select-none overflow-x-hidden overflow-y-auto p-1 border rounded-2xl bg-base-200"
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
          class="bot-bubble"
          @click="selectBot(bot.id)"
        >
          <img
            :src="bot.avatarImage"
            alt="Bot's Avatar"
            class="object-cover rounded-full"
          />
          <h3 class="text-lg font-semibold mt-2 truncate">{{ bot.name }}</h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)

// Function to handle bot selection
function selectBot(botId) {
  botStore.selectBot(botId)
}

// Smooth scroll to the left
function scrollLeft() {
  scrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
}

// Smooth scroll to the right
function scrollRight() {
  scrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
}

// Automatically select the first bot when the component mounts
onMounted(() => {
  if (bots.value.length > 0) {
    selectBot(bots.value[0].id) // Select the first bot
  }
})
</script>
<style>
.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

.bot-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20vw;
  min-width: 180px;
  max-width: 160px;
  margin: 0 8px;
  padding: 10px;
  scroll-snap-align: start;
  text-align: center;
  height: auto; /* Allow height to adjust based on content */
  overflow: visible; /* Ensure content is not hidden */
}

.bot-bubble img {
  width: 100%; /* Maintain image width responsive */
  height: auto; /* Adjust height automatically to maintain aspect ratio */
  max-height: 80px; /* Limit image height */
  border-radius: 50%; /* Circle shape */
}

.bot-bubble h3 {
  margin-top: 7px; /* Space between image and name */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
