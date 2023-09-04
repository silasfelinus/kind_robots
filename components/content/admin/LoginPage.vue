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

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const usernameOrEmail = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()

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
      // Consider using HttpOnly cookies for storing tokens
      localStorage.setItem('token', data.token)
      router.push('/dashboard')
    } else {
      errorMessage.value = 'Invalid credentials'
    }
  } catch (error) {
    errorMessage.value = `An error occurred: ${error.message}`
  }
}
</script>
