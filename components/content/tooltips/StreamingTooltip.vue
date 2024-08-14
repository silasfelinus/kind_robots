<template>
  <div class="flex flex-col items-center justify-start w-full p-2 h-2/3">
    <!-- Chat window -->
    <div
      class="chat-window w-full max-w-md rounded-2xl border overflow-y-auto bg-base-200"
    >
      <!-- Silas' Message -->
      <div class="flex flex-row justify-start p-4">
        <div
          class="silas-chat bubble bg-primary text-white p-4 rounded-2xl shadow-lg mb-2"
        >
          <icon name="mdi:chat" class="text-white mr-2 text-2xl" />Silas Says:
          <span class="text-xl block">{{ streamedText }}</span>
        </div>
      </div>
      <!-- AMI's Typing Indicator -->
      <div
        v-if="streamStatus === 'pause'"
        class="flex flex-row justify-end p-4"
      >
        <div
          class="ami-chat bubble bg-secondary text-white p-4 rounded-2xl shadow-lg mb-2 flash-animation"
        >
          <icon name="ph:butterfly" class="text-white mr-2 text-2xl" />
          <div :class="{ 'opacity-50': isGreyedOut }">
            Ami is {{ randomAction }}
          </div>
        </div>
      </div>
      <!-- AMI's Message -->
      <div v-if="streamStatus === 'ami'" class="flex flex-row justify-end p-4">
        <div
          class="ami-chat bubble bg-secondary text-white p-4 rounded-2xl shadow-lg mb-2"
        >
          <icon name="ph:butterfly" class="text-white mr-2 text-2xl" />Ami Says:
          <span class="text-xl block">{{ amiStream }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { randomActions } from '@/training/amiActions'

const props = defineProps<{
  tooltip: string
  amitip: string
}>()
const streamedText = ref('')
const amiStream = ref('')
let index = 0
let amiIndex = 0
let timer: number
const streamStatus = ref<'silas' | 'ami' | 'pause'>('silas')

const randomAction = ref('')

const updateRandomAction = () => {
  randomAction.value =
    randomActions[Math.floor(Math.random() * randomActions.length)]
}

const isGreyedOut = ref(false)

// Function to toggle the greying out
const toggleGrey = () => {
  isGreyedOut.value = !isGreyedOut.value
}

// Modify this part
const pauseAndType = async () => {
  streamStatus.value = 'pause'
  updateRandomAction()
  amiStream.value = '...'
  await nextTick()

  // Toggle greying out every 300ms
  const greyInterval = setInterval(toggleGrey, 300)

  setTimeout(() => {
    clearInterval(greyInterval) // Clear the interval
    isGreyedOut.value = false // Reset
    amiStream.value = ''
    streamStatus.value = 'ami'
    startStreaming()
  }, 3000) // Increased to 3 seconds
}

// Change speed here
const startStreaming = () => {
  timer = window.setInterval(() => {
    if (index < props.tooltip.length && streamStatus.value === 'silas') {
      streamedText.value += props.tooltip[index]
      index++
    } else if (amiIndex < props.amitip.length && streamStatus.value === 'ami') {
      amiStream.value += props.amitip[amiIndex]
      amiIndex++
    } else {
      clearInterval(timer)
      if (streamStatus.value === 'silas') {
        pauseAndType()
      }
    }
  }, 30) // Adjust the speed as needed
}

onMounted(() => {
  startStreaming()
})

watch(
  () => props.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    amiStream.value = ''
    index = 0
    amiIndex = 0
    streamStatus.value = 'silas'
    startStreaming()
  },
)
</script>

<style scoped>
/* For Flashing Effect */
.flash-animation {
  animation: flash 1s infinite alternate;
}

@keyframes flash {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.4;
  }
}

.bubble {
  max-width: 90%;
  word-wrap: break-word;
}

.chat-window {
  height: calc(100vh - 4rem);
}

@media screen and (max-width: 768px) {
  .bubble {
    max-width: 100%;
  }
}
</style>
