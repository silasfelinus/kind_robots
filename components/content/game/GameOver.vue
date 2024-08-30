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

<script setup>
import { ref } from 'vue'

const winnerName = ref('PlayerOne')
const winnerAvatar = ref('https://example.com/avatar.png')
const winningArts = ref([])

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
