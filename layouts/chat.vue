<template>
  <div>
    <home-link />
    <!-- Toggle Button -->
    <layout-selector />
    <input v-model="isVisible" type="checkbox" class="mr-2" />
    <button @click="toggleSize">Toggle Size</button>

    <!-- Chat Window -->
    <div
      v-if="isVisible"
      :class="chatWindowSize"
      class="chat-window bg-white rounded-lg p-4 shadow-md"
    >
      <div class="chat-bubble sender">
        <div v-if="streamingText" class="text-black">
          {{ streamingText }}
        </div>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { tooltip = getRandomDefaultTooltip() } = defineProps<{ tooltip?: string }>()
const streamingText = ref('')
const isVisible = ref(true)
const chatWindowSize = ref('small')

onMounted(() => {
  streamText(tooltip)
})

const streamText = (text: string) => {
  let index = 0
  const interval = setInterval(() => {
    if (index < text.length) {
      streamingText.value += text.charAt(index)
      index++
    } else {
      clearInterval(interval)
    }
  }, 100)
}

const toggleSize = () => {
  chatWindowSize.value = chatWindowSize.value === 'small' ? 'large' : 'small'
}

function getRandomDefaultTooltip() {
  const defaultTooltips = [
    'Hey there, welcome to KindRobots!',
    'Ready to explore some cool stuff?',
    'Howdy, partner! What brings you here?',
    'Ahoy matey! Ready to set sail?',
    'Greetings, Human! 🛸'
  ]
  return defaultTooltips[Math.floor(Math.random() * defaultTooltips.length)]
}
</script>

<style scoped>
.chat-window.small {
  max-width: 300px;
  min-height: 100px;
}

.chat-window.large {
  max-width: 600px;
  min-height: 300px;
}

.chat-bubble {
  padding: 10px;
  border-radius: 10px;
  margin: 5px;
}

.sender {
  background-color: #f1f1f1;
}
</style>
