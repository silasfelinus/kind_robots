<template>
  <div class="game-control">
    <ul>
      <li v-for="game in games" :key="game.id" @click="joinGame(game.id)">
        {{ game.descriptor }} - {{ game.category }}
      </li>
    </ul>
    <button @click="createGame">Create New Game</button>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from './../../../stores/gameStore'
import { ref, onMounted } from 'vue'

const gameStore = useGameStore()
const games = ref([])

onMounted(async () => {
  await gameStore.loadGames()
  games.value = gameStore.games
})

const createGame = async () => {
  await gameStore.createGame({
    descriptor: 'New Game',
    category: 'Battle Royale',
  })
}

const joinGame = async (gameId) => {
  await gameStore.joinGame(gameId, 'PlayerOne')
}
</script>

<style scoped>
.game-navigator {
  padding: 1rem;
}
</style>
