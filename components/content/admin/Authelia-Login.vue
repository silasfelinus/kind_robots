<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Login</h1>
    <form class="space-y-4" @submit.prevent="login">
      <div>
        <label for="username" class="block text-lg">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          class="border p-2 w-full rounded"
          required
        />
      </div>
      <div>
        <label for="password" class="block text-lg">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="border p-2 w-full rounded"
          required
        />
      </div>
      <div
        v-if="message"
        :class="{ 'text-green-500': success, 'text-red-500': !success }"
      >
        {{ message }}
      </div>
      <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded">
        Login
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const message = ref('')
const success = ref(false)

const login = async () => {
  try {
    const response = await fetch('/api/auth/authelia.post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    })

    const result = await response.json()

    if (result.success) {
      message.value = 'Login successful'
      success.value = true
      // Optionally, handle successful login (e.g., redirect user or store token)
      // localStorage.setItem('authToken', result.token) // Example of storing token
    } else {
      message.value = result.message || 'Login failed'
      success.value = false
    }
  } catch (error) {
    console.error('Error during login:', error)
    message.value = 'An error occurred during login'
    success.value = false
  }
}
</script>

<style scoped>
/* Add any additional styling here */
</style>
