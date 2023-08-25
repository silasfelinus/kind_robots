<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <button
      class="text-white bg-red-500 w-2/3 h-1/3 rounded-lg text-xl flex items-center justify-center"
      @click="pressedButton"
    >
      Do Not Press this Button
    </button>
    <div v-if="pressed" class="mt-4 text-center">
      <p class="text-xl mb-4">{{ randomResponse }}</p>
      <button class="text-blue-500 p-2 rounded-lg mb-4" @click="reset">Reset</button>
      <p class="text-lg">Button has been pressed {{ pressCount }} times.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import confetti from 'canvas-confetti'
import responses from '../../assets/buttonResponses'
import milestones from '../../assets/buttonMilestones'

const pressed = ref(false)
const pressCount = ref(0)
const randomResponse = ref('')

const pressedButton = () => {
  pressed.value = true
  pressCount.value++

  let isMilestone = false

  // Check for milestones
  milestones.forEach((milestone) => {
    if (pressCount.value === milestone.count) {
      randomResponse.value = milestone.message
      triggerConfetti()
      isMilestone = true
    }
  })

  if (!isMilestone) {
    randomResponse.value = responses[Math.floor(Math.random() * responses.length)] // pick a random message from the list
  }
}

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
}

const reset = () => {
  pressed.value = false
  randomResponse.value = ''
}
</script>
