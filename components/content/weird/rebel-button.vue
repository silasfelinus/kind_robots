<template>
  <div
    class="hero flex flex-col items-center justify-center bg-base-100 rounded-2xl border m-2 h-full w-full"
  >
    <div
      class="flex flex-col md:flex-row items-center justify-center w-full h-full space-y-4 md:space-y-0 md:space-x-4"
    >
      <!-- Left Section -->
      <div class="flex flex-col items-center w-full md:w-1/3 space-y-4 m-2 p-2">
        <transition name="slide-fade-slow">
          <div class="bg-base-100 p-4 rounded-lg shadow-lg">
            <click-leaderboard class="rounded-2xl m-2 p-2" />
          </div>
        </transition>
        <transition name="slide-fade-slow">
          <div v-if="state.topScore >= 100" class="bg-base-100 p-4 rounded-lg shadow-lg">
            <!-- Gallery Viewer-->
          </div>
        </transition>
        <transition name="slide-fade">
          <div
            v-if="state.topScore >= 20 && state.pressCount >= 1"
            class="bg-accent p-4 rounded-lg shadow-lg border m-2"
          >
            <h2 class="text-xl">Last Milestone</h2>
            <p class="text-lg">{{ state.lastMilestone }}</p>
          </div>
        </transition>
        <transition name="slide-fade-slow">
          <div
            v-if="state.topScore >= 21 && state.pressCount >= 1"
            class="bg-base-200 p-4 rounded-lg shadow-lg border m-2"
          >
            <p class="text-lg">Previous message: {{ state.previousMessage }}</p>
          </div>
        </transition>
      </div>

      <!-- Center Section -->
      <div class="flex flex-col items-center w-full md:w-1/3 space-y-4">
        <div
          ref="buttonRef"
          :class="`button w-full h-60 rounded-lg flex items-center justify-center transition text-2xl border font-bold shadow-lg p-2 ${
            state.pressed ? 'bg-accent text-default' : 'bg-primary text-default'
          }`"
          @click="pressedButton"
        >
          {{ state.buttonText }}
        </div>
        <div v-if="state.pressed" class="text-center">
          <button class="text-blue-500 p-2 rounded-lg mb-4" @click="openResetPopup">Reset</button>
          <p class="text-lg">Button has been pressed {{ state.pressCount }} times.</p>
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex flex-col items-center w-full md:w-1/3 space-y-4">
        <transition name="slide-fade">
          <div
            v-if="state.showLeaderboard && state.topScore >= 10"
            class="bg-secondary p-4 rounded-lg shadow-lg border m-2"
          >
            <h2 class="text-2xl mb-2">Leaderboard</h2>
            <p class="text-lg">Top Score: {{ state.topScore }}</p>
          </div>
        </transition>
        <transition name="slide-fade-slow">
          <div v-if="state.topScore >= 30" class="bg-base-100 p-4 rounded-lg shadow-lg border m-2">
            <!-- Butterfly Toggle Component -->
            You've unlocked our mascot AMI - The Anti-Malaria Intelligence. AMI's job is to flutter
            around (for now), but eventually she'll help raise funds to fight malaria.
            <butterfly-toggle />
          </div>
        </transition>
        <transition name="slide-fade-slow">
          <div v-if="state.topScore >= 40" class="bg-base-100 p-4 rounded-lg shadow-lg border m-2">
            <!-- Theme Select -->
            Feel free to change the theme!
            <theme-toggle />
          </div>
        </transition>
      </div>
    </div>
    <!-- Reset Popup -->
    <transition name="slide-fade">
      <div
        v-if="state.showResetPopup"
        class="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 bg-black"
        @click.self="state.showResetPopup = false"
      >
        <div class="bg-white p-4 rounded-lg">
          <p>Are you sure you want to reset the leaderboard?</p>
          <div class="flex justify-end space-x-4 mt-4">
            <button
              class="bg-red-500 text-white px-4 py-2 rounded-lg"
              @click="state.showResetPopup = false"
            >
              Cancel
            </button>
            <button class="bg-green-500 text-white px-4 py-2 rounded-lg" @click="reset">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import confetti from 'canvas-confetti'
import responses from '../../../assets/buttonResponses'
import milestones from '../../../assets/buttonMilestones'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const username = computed(userStore.username)
const state = reactive({
  pressed: false,
  pressCount: 0,
  topScore: 0,
  buttonText: 'Do Not Press this Button',
  showLeaderboard: true,
  showResetPopup: false,
  resetConfirmed: false,
  previousMessage: '',
  lastMilestone: ''
})

const buttonRef = ref(null)

onMounted(async () => {
  // Fetch the leaderboard if the user is logged in
  if (userStore.isLoggedIn) {
    // Fetch the user's click record from the store
    const userClickRecord = userStore.clickRecord

    // Fetch the locally stored high score
    const localHighScore = parseInt(localStorage.getItem('topScore')) || 0

    // Set both to the higher number
    const highestScore = Math.max(userClickRecord, localHighScore)
    state.topScore = highestScore
    localStorage.setItem('topScore', highestScore.toString())

    // If the user's click record is lower, update it
    if (userClickRecord < highestScore) {
      await userStore.updateClickRecord(highestScore)
    }
  } else {
    // For guests, just use the local high score
    state.topScore = parseInt(localStorage.getItem('topScore')) || 0
  }
})

watch(
  () => userStore.isLoggedIn,
  async (newVal, oldVal) => {
    if (newVal !== oldVal && newVal === true) {
      // User has just logged in
      const userClickRecord = userStore.clickRecord
      const localHighScore = parseInt(localStorage.getItem('topScore')) || 0
      const highestScore = Math.max(userClickRecord, localHighScore)

      if (highestScore > state.topScore) {
        state.topScore = highestScore
        localStorage.setItem('topScore', highestScore.toString())
        await userStore.updateClickRecord(highestScore)
      }
    }
  }
)
const pressedButton = () => {
  state.pressed = true
  state.pressCount++

  let tempMessage = state.buttonText // Store the current message temporarily

  // Update the top score immediately on every click
  if (state.pressCount > state.topScore) {
    state.topScore = state.pressCount
  }

  // Save to localStorage every 10 clicks to optimize performance
  if (state.pressCount % 10 === 0) {
    localStorage.setItem('topScore', state.topScore)
    submitTopScore()
  }

  let isMilestone = false

  milestones.forEach((milestone) => {
    if (state.pressCount === milestone.count) {
      state.buttonText = milestone.message
      state.lastMilestone = milestone.message // Store the last milestone message
      triggerConfetti()
      isMilestone = true
    }
  })

  if (!isMilestone) {
    state.buttonText = responses[Math.floor(Math.random() * responses.length)]
  }

  state.previousMessage = tempMessage // Set the previous message after updating the buttonText
}
const submitTopScore = async () => {
  const updateStatus = await userStore.updateClickRecord(state.topScore)
  if (updateStatus === 'Updated') {
    // Refresh the leaderboard
    await userStore.fetchHighClickScores()
  }
}
const triggerConfetti = () => {
  const { top, left, width, height } = buttonRef.value.getBoundingClientRect()
  confetti({
    particleCount: 100 + state.pressCount * 10,
    spread: 70,
    origin: { y: top / window.innerHeight, x: (left + width / 2) / window.innerWidth }
  })
}

const openResetPopup = () => {
  state.showResetPopup = true
}

const reset = () => {
  state.pressed = false
  state.buttonText = 'Do Not Press this Button'
  state.pressCount = 0
  state.topScore = 0
  localStorage.removeItem('topScore')
  state.showResetPopup = false
}
</script>

<style>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 1s;
}
.slide-fade-enter,
.slide-fade-leave-to {
  opacity: 0;
}
.slide-fade-slow-enter-active,
.slide-fade-slow-leave-active {
  transition: opacity 2s;
}
.slide-fade-slow-enter,
.slide-fade-slow-leave-to {
  opacity: 0;
}
</style>
