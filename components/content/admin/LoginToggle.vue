<template>
  <div
    v-if="isVisible"
    class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-base-100 p-4 rounded shadow-lg"
  >
    <form @submit.prevent="handleLogin">
      <div class="mb-2">
        <label for="email" class="block text-sm mb-1">Email:</label>
        <input id="email" v-model="email" type="email" class="w-full p-2 border rounded" required />
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const isVisible = ref(true)
const email = ref('')
const password = ref('')
const savePassword = ref(false)

const handleLogin = () => {
  // Handle login logic here
}
</script>
