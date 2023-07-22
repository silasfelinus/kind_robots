<template>
  <form @submit.prevent="login">
    <label>
      Username:
      <input v-model="username" required />
    </label>
    <label>
      Password:
      <input v-model="password" type="password" required />
    </label>
    <button type="submit">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const password = ref('')

async function login() {
  try {
    const response = await axios.post('/api/login', {
      username: username.value,
      password: password.value
    })
    localStorage.setItem('token', response.data.token)
    router.push('/')
  } catch (err) {
    console.error(err)
  }
}
</script>
