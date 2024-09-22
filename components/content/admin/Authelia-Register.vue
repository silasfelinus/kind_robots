<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Register</h1>
    <form class="space-y-4" @submit.prevent="register">
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
        <label for="email" class="block text-lg">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
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
        Register
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref('')
const email = ref('')
const password = ref('')
const message = ref('')
const success = ref(false)

const register = async () => {
  try {
    const response = await fetch('/api/auth/register.authelia.post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        email: email.value,
      }),
    })

    const result = await response.json()

    if (result.success) {
      message.value = result.message || 'Registration successful'
      success.value = true
      // Optionally redirect the user or clear the form
    } else {
      message.value = result.message || 'Registration failed'
      success.value = false
    }
  } catch (error) {
    console.error('Error during registration:', error)
    message.value = 'An error occurred during registration'
    success.value = false
  }
}
</script>

<style scoped>
/* Add any additional styling here */
</style>
