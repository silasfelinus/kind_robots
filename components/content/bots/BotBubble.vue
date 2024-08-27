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
    <div
      ref="scrollContainer"
      class="mx-auto w-full overflow-x-auto scroll-container"
    >
      <!-- Bot Scroll Container -->
      <div class="flex space-x-4 px-2">
        <div
          v-for="(bot, index) in bots"
          :key="`bot-${index}`"
          class="bot-bubble"
          @click="selectBot(bot.id)"
        >
          <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-img" />
          <h3 class="bot-name">{{ bot.name }}</h3>
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

let isDragging = false
let startPos = 0
let scrollLeftStart = 0

function startDrag(e) {
  isDragging = true
  startPos = e.pageX || e.touches[0].pageX
  scrollLeftStart = scrollContainer.value.scrollLeft
}

function stopDrag() {
  isDragging = false
}

function doDrag(e) {
  if (!isDragging) return
  const x = e.pageX || e.touches[0].pageX
  const walk = (x - startPos) * 2 // Increase or decrease multiplier to adjust scroll sensitivity
  scrollContainer.value.scrollLeft = scrollLeftStart - walk
}

// Function to handle bot selection
function selectBot(botId) {
  botStore.selectBot(botId)
}

// Automatically select the first bot when the component mounts
onMounted(() => {
  if (bots.value.length > 0) {
    selectBot(bots.value[0].id) // Select the first bot
  }
  scrollContainer.value.addEventListener('mousedown', startDrag)
  scrollContainer.value.addEventListener('mouseleave', stopDrag)
  scrollContainer.value.addEventListener('mouseup', stopDrag)
  scrollContainer.value.addEventListener('mousemove', doDrag)
  scrollContainer.value.addEventListener('touchstart', startDrag)
  scrollContainer.value.addEventListener('touchend', stopDrag)
  scrollContainer.value.addEventListener('touchmove', doDrag)
})
</script>
<style>
.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  cursor: grab; /* Cursor indicates draggable area */
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
  height: auto;
  overflow: visible;
}

.bot-img {
  width: 100%;
  height: auto;
  max-height: 80px;
  border-radius: 50%;
}

.bot-name {
  margin-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
