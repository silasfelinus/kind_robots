<template>
  <base-card>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input v-model="usernameOrEmail" type="text" placeholder="Username or Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </base-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore' // Import your Pinia user store

const usernameOrEmail = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()
const userStore = useUserStore() // Initialize your Pinia user store

const login = async () => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameOrEmail.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (data.success) {
      userStore.setToken(data.token) // Use Pinia store to manage the token
      localStorage.setItem('token', data.token) // Also store the token in local storage
      router.push('/dashboard')
    } else {
      errorMessage.value = 'Invalid credentials'
    }
  } catch (error: any) {
    errorMessage.value = `An error occurred: ${error.message}`
  }
}
</script>
