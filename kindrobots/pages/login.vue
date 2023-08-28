<template>
  <div>
    <form @submit.prevent="login">
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref<string>('')
const password = ref<string>('')
const error = ref<string | null>(null)

const login = async () => {
  error.value = null

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (response.ok && data.token) {
      localStorage.setItem('authToken', data.token)
      // Navigate to a protected page if needed, e.g., using your router.
    } else {
      error.value = data.error || 'Login failed. Please try again.'
    }
  } catch (err) {
    // Handle fetch or network errors.
    error.value = 'Login failed due to a network error. Please try again.'
  }
}
</script>

<style scoped>
.error {
  color: red;
}
</style>
