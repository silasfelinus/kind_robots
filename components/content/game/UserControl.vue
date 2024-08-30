<template>
  <div class="user-control">
    <div>
      <label for="avatar">Choose your avatar:</label>
    </div>
    <div>
      <label for="username">Username:</label>
      <input id="username" v-model="username" />
    </div>
    <button @click="saveProfile">Save Profile</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from './../../../stores/gameStore'

const gameStore = useGameStore()
const username = ref(gameStore.user?.username || '')

const saveProfile = async () => {
  await gameStore.updatePlayer(gameStore.currentPlayer?.id, {
    username: username.value,
  })
}
</script>

<style scoped>
.user-control {
  padding: 1rem;
}
</style>
