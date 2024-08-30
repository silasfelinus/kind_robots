<template>
  <nav class="bg-primary p-4 text-white flex justify-between items-center">
    <h1>Art Challenge</h1>
    <div>
      <button @click="joinRoom">Join Room</button>
      <button @click="createRoom">Create Room</button>
      <button @click="goToDashboard">Dashboard</button>
    </div>
  </nav>
</template>

<script setup>
const goToDashboard = () => {
  // Redirect to dashboard
}
const createRoom = () => {
  // Logic to create a chat room
}
const joinRoom = () => {
  // Logic to join an existing chat room
}
</script>