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
  flex-direction: column; /* Organizes the child elements (image and name) into a column */
  align-items: center; /* Centers the items horizontally in the flex container */
  justify-content: center; /* Aligns items vertically to the center in the flex container */
  width: 20vw; /* Adjusts the width to be more responsive */
  min-width: 120px; /* Ensures a minimum width */
  max-width: 160px; /* Sets a maximum width to prevent the bubbles from getting too large */
  margin: 0 8px; /* Adds horizontal spacing between bubbles */
  padding: 10px; /* Adds some padding inside the bubbles */
  scroll-snap-align: start; /* Ensures the scrolling aligns the items neatly at the start of the scroll container */
  text-align: center; /* Centers the text */
  overflow: hidden; /* Prevents content from overflowing */
}

.bot-bubble img {
  width: 100%; /* Makes the image responsive within the container */
  height: auto; /* Maintains the aspect ratio of the image */
  border-radius: 50%; /* Makes the image rounded */
}

.bot-bubble h3 {
  margin-top: 10px; /* Adds space between the image and the name */
  white-space: nowrap; /* Keeps the name on a single line */
  overflow: hidden; /* Hides any overflow */
  text-overflow: ellipsis; /* Adds an ellipsis to truncated text */
}
</style>
