<template>
  <div>
    <form @submit.prevent="register">
      <input v-model="username" placeholder="Username" />
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <input v-model="confirmPassword" type="password" placeholder="Confirm Password" />
      <button type="submit">Register</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const username = ref<string>('')
const email = ref<string>('')
const password = ref<string>('')
const confirmPassword = ref<string>('')
const error = ref<string | null>(null)

const register = async () => {
  error.value = null

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords don't match."
    return
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (response.ok) {
      // Redirect to login page or show success message
      // e.g., router.push('/login')
    } else {
      error.value = data.error || 'Registration failed. Please try again.'
    }
  } catch (err) {
    // Handle fetch or network errors.
    error.value = 'Registration failed due to a network error. Please try again.'
  }
}
</script>

<style scoped>
.error {
  color: red;
}
</style>
