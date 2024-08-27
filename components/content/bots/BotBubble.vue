<!-- Centering Container -->
<div class="mx-auto w-full overflow-x-auto scroll-container" ref="scrollContainer">
  <!-- Bot Scroll Container -->
  <div class="flex space-x-4 px-2">
    <div v-for="(bot, index) in bots" :key="`bot-${index}`" class="bot-bubble" @click="selectBot(bot.id)">
      <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-img" />
      <h3 class="bot-name">{{ bot.name }}</h3>
    </div>
  </div>
</div>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)

let isDragging = false;
let startPos = 0;
let scrollLeftStart = 0;

function startDrag(e) {
  isDragging = true;
  startPos = e.pageX || e.touches[0].pageX;
  scrollLeftStart = scrollContainer.value.scrollLeft;
}

function stopDrag() {
  isDragging = false;
}

function doDrag(e) {
  if (!isDragging) return;
  const x = e.pageX || e.touches[0].pageX;
  const walk = (x - startPos) * 2; // Increase or decrease multiplier to adjust scroll sensitivity
  scrollContainer.value.scrollLeft = scrollLeftStart - walk;
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
  scrollContainer.value.addEventListener('mousedown', startDrag);
  scrollContainer.value.addEventListener('mouseleave', stopDrag);
  scrollContainer.value.addEventListener('mouseup', stopDrag);
  scrollContainer.value.addEventListener('mousemove', doDrag);
  scrollContainer.value.addEventListener('touchstart', startDrag);
  scrollContainer.value.addEventListener('touchend', stopDrag);
  scrollContainer.value.addEventListener('touchmove', doDrag);
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
