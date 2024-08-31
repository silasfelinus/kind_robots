<template>
  <div class="splash-container" :class="{ 'is-hidden': !showSplash }">
    <img src="/images/artsplash3.webp" alt="Welcome" class="splash-image" />
    <div class="button-container">
      <button @click="handleAction('join')">Join Game</button>
      <button @click="handleAction('create')">Create Game</button>
    </div>
  </div>
  <div v-show="!showSplash" class="content">
    <!-- Your app's content goes here -->
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showSplash = ref(true)

const handleAction = (action) => {
  // Animation logic before changing the state
  showSplash.value = false
  // Here you can emit an event or route to different pages based on the action
  console.log(action + ' game')
}
</script>

<style scoped>
.splash-container {
  position: fixed;
  width: 100%;
  height: 80%;
  top: 0;
  left: 0;
  background-color: #fff;
  transition: top 0.5s ease;
}

.splash-container.is-hidden {
  top: -80%;
}

.splash-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.button-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
