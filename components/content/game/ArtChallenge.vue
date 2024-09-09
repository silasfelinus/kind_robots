<template>
  <div class="flex flex-col h-screen">
    <!-- Game Navigation Bar with Header Image -->
    <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
      <!-- Header Image -->
      <img src="/images/artsplash.webp" alt="Header" class="w-32 h-auto" />
      <div class="space-x-2">
        <button class="px-4 py-2 bg-blue-500 rounded" @click="createRoom">
          Create Room
        </button>
        <button class="px-4 py-2 bg-green-500 rounded" @click="joinRoom">
          Join Room
        </button>
      </div>
      <div class="flex space-x-2 flex-wrap">
        <button
          class="px-3 py-2 bg-gray-600 rounded"
          @click="toggleChatControl"
        >
          {{
            gameStore.showChatControl
              ? 'Hide Chat Control'
              : 'Show Chat Control'
          }}
        </button>
        <button
          class="px-3 py-2 bg-gray-600 rounded"
          @click="toggleGameControl"
        >
          {{
            gameStore.showGameControl
              ? 'Hide Game Control'
              : 'Show Game Control'
          }}
        </button>
        <button
          class="px-3 py-2 bg-gray-600 rounded"
          @click="toggleUserControl"
        >
          {{
            gameStore.showUserControl
              ? 'Hide User Control'
              : 'Show User Control'
          }}
        </button>
        <button class="px-3 py-2 bg-gray-600 rounded" @click="toggleArtChooser">
          {{
            gameStore.showArtChooser ? 'Hide Art Chooser' : 'Show Art Chooser'
          }}
        </button>
        <button class="px-3 py-2 bg-gray-600 rounded" @click="toggleArtCreator">
          {{
            gameStore.showArtCreator ? 'Hide Art Creator' : 'Show Art Creator'
          }}
        </button>
        <button
          class="px-3 py-2 bg-gray-600 rounded"
          @click="togglePitchScreen"
        >
          {{
            gameStore.showPitchScreen
              ? 'Hide Pitch Screen'
              : 'Show Pitch Screen'
          }}
        </button>
        <button class="px-3 py-2 bg-gray-600 rounded" @click="toggleGameOver">
          {{ gameStore.showGameOver ? 'Hide Game Over' : 'Show Game Over' }}
        </button>
      </div>
    </div>

    <!-- Main Game Area -->
    <div class="flex-grow flex flex-wrap">
      <!-- Chat Window -->

      <!-- Conditional Panels -->
      <div
        v-if="gameStore.showChatControl"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <ChatControl />
      </div>

      <div
        v-if="gameStore.showGameControl"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <GameControl />
      </div>

      <div
        v-if="gameStore.showUserControl"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <UserControl />
      </div>

      <div
        v-if="gameStore.showArtChooser"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <ArtChooser />
      </div>

      <div
        v-if="gameStore.showArtCreator"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <ArtCreator />
      </div>

      <div
        v-if="gameStore.showPitchScreen"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <PitchScreen />
      </div>

      <div
        v-if="gameStore.showGameOver"
        class="w-full md:w-1/3 bg-white p-4 border-l border-gray-300"
      >
        <GameOver />
      </div>
    </div>
  </div>
</template>

<script setup>
import ChatControl from './ChatControl.vue'
import GameControl from './GameControl.vue'
import UserControl from './UserControl.vue'
import ArtChooser from './ArtChooser.vue'
import ArtCreator from './ArtCreator.vue'
import PitchScreen from './PitchScreen.vue'
import GameOver from './GameOver.vue'
import { useGameStore } from './../../../stores/gameStore'

const gameStore = useGameStore()

const createRoom = async () => {
  await gameStore.createGame({
    descriptor: 'New Game',
    category: 'Battle Royale',
  })
}

const joinRoom = async () => {
  await gameStore.joinGame(1, 'PlayerOne')
}

const toggleChatControl = () => {
  gameStore.toggleChatControl()
}

const toggleGameControl = () => {
  gameStore.toggleGameControl()
}

const toggleUserControl = () => {
  gameStore.toggleUserControl()
}

const toggleArtChooser = () => {
  gameStore.toggleArtChooser()
}

const toggleArtCreator = () => {
  gameStore.toggleArtCreator()
}

const togglePitchScreen = () => {
  gameStore.togglePitchScreen()
}

const toggleGameOver = () => {
  gameStore.toggleGameOver()
}
</script>

<style scoped>
/* Additional styles */
</style>
