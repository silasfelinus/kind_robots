<template>
  <div class="game-page">
    <!-- Game Navigation Bar -->
    <GameNavigator
      @create-room="createRoom"
      @join-room="joinRoom"
      @go-dashboard="goToDashboard"
    />

    <!-- Main Game Area -->
    <div class="flex flex-col md:flex-row">
      <!-- Chat Window -->
      <GameChat class="flex-grow" />

      <!-- Control Panel with Art and Prompts Interaction -->
      <ControlPanel
        class="w-full md:w-1/3"
        @start-game="startGame"
        @submit-art="submitArt"
        @vote="vote"
      />
    </div>
  </div>
</template>

<script setup>
import GameNavigator from './GameNavigator.vue'
import GameChat from './GameChat.vue'
import ControlPanel from './ControlPanel.vue'

// Example methods to handle actions from the components
const createRoom = () => {
  // Logic to handle room creation
}

const joinRoom = () => {
  // Logic to handle joining a room
}

const goToDashboard = () => {
  // Logic to navigate to the dashboard
}

const startGame = () => {
  // Logic to start the game, fetch prompts, etc.
}

const submitArt = () => {
  // Logic to handle art submission
}

const vote = () => {
  // Logic for voting on submissions
}
</script>

<style scoped>
.game-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
