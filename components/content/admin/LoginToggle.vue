<template>
  <div class="relative">
    <icon
      name="tabler:login"
      class="text-base-200 cursor-pointer"
      title="Toggle Login"
      @click="toggleVisibility"
    />
    <div
      v-if="isVisible"
      class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-base-100 p-4 rounded shadow-lg"
    >
      <form @submit.prevent="handleLogin">
        <div class="mb-2">
          <label for="email" class="block text-sm mb-1">Login:</label>
          <input
            id="login"
            v-model="login"
            type="login"
            class="w-full p-2 border rounded"
            required
          />
        </div>
        <div class="mb-2">
          <label for="password" class="block text-sm mb-1">Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full p-2 border rounded"
            required
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <input id="savePassword" v-model="savePassword" type="checkbox" class="mr-2" />
            <label for="savePassword" class="text-sm">Save Password</label>
          </div>
          <button type="submit" class="bg-info text-default py-1 px-3 rounded">Login</button>
        </div>
        <div class="text-center mt-2">
          <NuxtLink to="/register" class="text-accent underline">Register</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const login = ref('')
const password = ref('')
const savePassword = ref(false)
const isVisible = ref(false) // Set to false to start in a closed state

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}
const handleLogin = async () => {
  try {
    const response = await fetch('/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: login.value, password: password.value })
    })

    const data = await response.json()

    if (data.success) {
      store.setUser(data.user)
      isVisible.value = false
      // Dispatch a custom event to store user data in local storage on the client side
      if (process.client) {
        window.dispatchEvent(new CustomEvent('login-success', { detail: { user: data.user } }))
      }
      // 🎉 Yay, login successful! Maybe navigate to a different page or show a success message
    } else {
      // 😢 Login failed, show the error message from the API
      console.error(data.message)
    }
  } catch (error) {
    // 😵‍💫 Something went wrong, log the error and show a generic error message
    console.error('An unknown error occurred', error)
  }
}

onMounted(() => {
  if (process.client) {
    // Only on client-side
    window.addEventListener('login-success', (event: any) => {
      localStorage.setItem('user', JSON.stringify(event.detail.user))
    })
  }
})
</script>
