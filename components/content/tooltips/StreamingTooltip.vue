<template>
  <div class="flex flex-col items-center justify-start w-full p-4 overflow-hidden">
    <!-- Chat window -->
    <div class="chat-window w-full max-w-md rounded-2xl border overflow-y-auto bg-base-200">
      <!-- Silas' Message -->
      <div class="flex flex-row justify-start p-4">
        <div class="silas-chat bubble bg-primary text-white p-4 rounded-2xl border shadow-md mb-2">
          <icon name="mdi:chat" class="text-white mr-2 text-2xl" />Silas Says:
          <span class="text-xl block">{{ streamedText }}</span>
        </div>
      </div>
      <!-- AMI's Typing Indicator -->
      <div v-if="streamStatus === 'pause'" class="flex flex-row justify-end p-4">
        <div class="ami-chat bubble bg-secondary text-white p-4 rounded-2xl border shadow-md mb-2">
          <icon name="ph:butterfly" class="text-white mr-2 text-2xl" />Ami is {{ randomAction }}
        </div>
      </div>
      <!-- AMI's Message -->
      <div v-if="streamStatus === 'ami'" class="flex flex-row justify-end p-4">
        <div class="ami-chat bubble bg-secondary text-white p-4 rounded-2xl border shadow-md mb-2">
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

const { page } = useContent()

const props = defineProps<{
  tooltip: string
  amitip: string
}>()
const streamedText = ref('')
const amiStream = ref('')
let index = 0
let amiIndex = 0
let timer: number
let streamStatus = ref<'silas' | 'ami' | 'pause'>('silas')

const randomAction = ref('')

const updateRandomAction = () => {
  randomAction.value = randomActions[Math.floor(Math.random() * randomActions.length)]
}

// Update it in your pauseAndType function
const pauseAndType = async () => {
  streamStatus.value = 'pause'
  updateRandomAction() // update random action here
  amiStream.value = '...'
  await nextTick()
  setTimeout(() => {
    amiStream.value = ''
    streamStatus.value = 'ami'
    startStreaming()
  }, 2000) // 2 seconds pause
}

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
  }, 50) // Adjust the speed as needed
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
  }
)
</script>

<style scoped>
.bubble {
  max-width: 80%;
}
.chat-window {
  height: 300px; /* Or any other fixed or max-height */
}
</style>
