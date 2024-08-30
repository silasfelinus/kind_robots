<template>
  <div class="flex flex-col h-screen">
    <!-- Game Navigation Bar -->
    <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div>
        <button class="px-4 py-2 bg-blue-500 rounded" @click="createRoom">
          Create Room
        </button>
        <button class="px-4 py-2 bg-green-500 rounded ml-2" @click="joinRoom">
          Join Room
        </button>
      </div>
      <button class="px-4 py-2 bg-gray-600 rounded" @click="toggleDashboard">
        {{ gameStore.showDashboard ? 'Hide Dashboard' : 'Show Dashboard' }}
      </button>
    </div>

    <!-- Main Game Area -->
    <div class="flex flex-grow">
      <!-- Chat Window -->
      <div class="flex-grow bg-gray-100 p-4 overflow-y-auto">
        <GameChat />
      </div>

      <!-- Control Panel with Art and Prompts Interaction -->
      <div
        v-if="gameStore.showDashboard"
        class="w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <ChatControl />
      </div>
    </div>
  </div>
</template>

<script setup>
import GameChat from './GameChat.vue'
import ChatControl from './ChatControl.vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const createRoom = async () => {
  await gameStore.createGame({
    descriptor: 'New Game',
    category: 'Battle Royale',
  })
}

const joinRoom = async () => {
  // Replace with logic to join a specific room
  await gameStore.joinGame(1, 'PlayerOne')
}

const toggleDashboard = () => {
  gameStore.toggleDashboard()
}
</script>

<style scoped>
/* Additional scoped CSS can be added here if needed */
</style>
