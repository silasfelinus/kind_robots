<template>
  <form @submit.prevent="register">
    <label>
      Username:
      <input v-model="username" required />
    </label>
    <label>
      Password:
      <input v-model="password" type="password" required />
    </label>
    <button type="submit">Register</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const password = ref('')

async function register() {
  try {
    await axios.post('/api/register', {
      username: username.value,
      password: password.value
    })
    router.push('/login')
  } catch (err) {
    console.error(err)
  }
}
</script>
