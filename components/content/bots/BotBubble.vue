<template>
  <div class="relative w-full select-none overflow-hidden">
    <!-- Navigation Arrows -->
    <div
      class="absolute left-0 z-50 cursor-pointer"
      style="left: calc((100% - 2 / 3 * 100%) / 2)"
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
      class="absolute right-0 z-50 cursor-pointer"
      style="right: calc((100% - 2 / 3 * 100%) / 2)"
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
    <div class="mx-auto w-2/3 overflow-hidden relative">
      <!-- Bot Scroll Container with Infinite Scrolling -->
      <div
        ref="scrollContainer"
        class="flex overflow-hidden justify-start space-x-4 px-2 scroll-container"
        :style="scrollStyle"
      >
        <div v-if="bots && bots.length > 0"
     ref="scrollContainer"
     class="flex overflow-hidden justify-start space-x-4 px-2 scroll-container"
     :style="scrollStyle">
  <div v-for="(bot, index) in infiniteBots" :key="`bot-${index}`"
       :class="['bot-bubble flex-col items-center cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out min-w-max']"
       @click="selectBot(bot.id)">
    <img :src="bot.avatarImage"
         alt="Bot's Avatar"
         class="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover transition-all duration-300 ease-in-out"/>
    <h3 class="text-lg font-semibold mt-2">{{ bot.name }}</h3>
  </div>
</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useBotStore } from '@/stores/botStore'

const botStore = useBotStore();
const bots = computed(() => botStore.bots);
const selectedBotId = computed(() => botStore.selectedBotId);
const scrollContainer = ref(null);
let currentOffset = ref(0);

const infiniteBots = computed(() => {
  // Append and prepend items for infinite effect
  if (bots.value.length > 0) {
    const last = bots.value[bots.value.length - 1];
    const first = bots.value[0];
    return [last, ...bots.value, first];
  }
  return [];
});

const scrollStyle = computed(() => ({
  transform: `translateX(${currentOffset.value}px)`,
  transition: 'transform 0.3s ease-in-out',
}));

onMounted(async () => {
  await nextTick();
  // Ensure the first bot's width is used for initial offset
  const firstBotWidth = scrollContainer.value.children[1].clientWidth; // Assuming the first element [0] is the duplicated last element
  currentOffset.value = -firstBotWidth; // Moves to the first real element's position
});

function selectBot(botId) {
  botStore.selectBot(botId);
}

function scrollLeft() {
  const singleWidth = scrollContainer.value.children[1].clientWidth;
  // Wrap around logic
  if (currentOffset.value === 0) {
    currentOffset.value = -singleWidth * bots.value.length;
  } else {
    currentOffset.value += singleWidth;
  }
}

function scrollRight() {
  const singleWidth = scrollContainer.value.children[1].clientWidth;
  // Wrap around logic
  if (currentOffset.value <= -singleWidth * (bots.value.length + 1)) {
    currentOffset.value = -singleWidth;
  } else {
    currentOffset.value -= singleWidth;
  }
}
</script>

<style>
.scroll-container {
  display: flex;
  min-width: 300%; /* Make sure there is enough room for all items and duplicates */
}

.arrow {
  position: absolute;
  top: 50%; /* Center vertically */
  transform: translateY(-50%);
  z-index: 10;
  cursor: pointer;
  background: #fff; /* Ensure visibility */
  border-radius: 50%;
  padding: 8px;
}
</style>