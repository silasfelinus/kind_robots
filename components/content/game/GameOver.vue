<template>
  <div class="game-over">
    <h2>Game Over</h2>
    <div class="winner">
      <h3>Winner: {{ winnerName }}</h3>
      <img :src="winnerAvatar" alt="Winner Avatar" />
    </div>
    <div class="gallery">
      <div v-for="art in winningArts" :key="art.id" class="art-item">
        <img :src="art.url" alt="Art" />
      </div>
    </div>
    <button @click="startNewGame">Start New Game</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Define the type for the art object
interface Art {
  id: number
  url: string
}

const winnerName = ref('PlayerOne')
const winnerAvatar = ref('https://example.com/avatar.png')

// Specify that winningArts is an array of Art objects
const winningArts = ref<Art[]>([
  { id: 1, url: 'https://example.com/art1.png' },
  { id: 2, url: 'https://example.com/art2.png' },
])

const startNewGame = () => {
  // Logic to start a new game
}
</script>

<style scoped>
.game-over {
  text-align: center;
  padding: 2rem;
}
.winner {
  margin-bottom: 2rem;
}
.gallery {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.art-item {
  width: 200px;
}
</style>
