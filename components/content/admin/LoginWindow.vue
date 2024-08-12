<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="flex items-center h-36 w-36 z-50">
    <!-- Welcome Message -->
    <div class="flex items-center cursor-pointer" @click="toggleVisibility">
      <img
        v-if="store.avatarImage"
        :src="store.avatarImage"
        class="w-8 h-8 rounded-full mr-2"
        alt="Avatar"
      />
      <icon name="tabler:home" class="text-base-200 text-2xl" />
      <span class="ml-2 text-base-200">{{ welcomeMessage }}</span>
      <NuxtLink
        v-if="isLoggedIn && store.role === 'admin'"
        to="/admin"
        class="ml-2 text-accent underline"
        >Admin</NuxtLink
      >
      <NuxtLink
        v-if="isLoggedIn"
        to="/dashboard"
        class="ml-2 text-accent underline"
      >
        Dashboard
      </NuxtLink>
    </div>

    <!-- Login Dropdown -->
    <div
      v-if="isVisible && !isLoggedIn"
      class="flex flex-col items-center bg-base-200 p-4 rounded-2xl shadow-lg transition-all duration-300"
    >
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <icon name="tabler:loader" class="animate-spin text-lg mb-2" />
        <div>Loading, please wait...</div>
      </div>

      <!-- Success Screen -->
      <div v-else-if="isLoggedIn" class="text-center">
        <div class="mb-4">
          <span class="text-lg font-semibold">
            Hello, {{ store.username }} 🎉
          </span>
          <button
            class="bg-warning text-default py-1 px-3 rounded"
            @click="handleLogout"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- Login Form -->
      <form
        v-else
        class="space-y-4 z-50"
        :autocomplete="stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <div class="mb-2 relative group">
          <label for="login" class="block text-sm mb-1">Login:</label>
          <input
            id="login"
            v-model="login"
            type="text"
            autocomplete="username"
            class="w-full p-2 border rounded"
            required
          />
          <div
            class="absolute right-2 bottom-2 text-xs text-gray-500 group-hover:float-tooltip"
          >
            Login
          </div>
        </div>
        <div class="mb-2 relative group">
          <label for="password" class="block text-sm mb-1">Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full p-2 border rounded"
            required
          />
          <div
            class="absolute right-2 bottom-2 text-xs text-gray-500 group-hover:float-tooltip"
          >
            Password
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <input
              id="stayLoggedIn"
              v-model="stayLoggedIn"
              type="checkbox"
              class="mr-2"
            />
            <label for="stayLoggedIn" class="text-sm">Stay Logged in</label>
          </div>
          <button type="submit" class="bg-info text-default py-1 px-3 rounded">
            Login
          </button>
        </div>
        <div class="text-center mt-2">
          <NuxtLink to="/register" class="text-accent underline">
            Register
          </NuxtLink>
        </div>
      </form>

      <!-- Error Message -->
      <div v-if="errorStore.message" class="text-warning mt-2">
        {{ errorStore.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const store = useUserStore()
const errorStore = useErrorStore()
const login = ref('')
const password = ref('')
const isVisible = ref(false)
const isLoggedIn = computed(() => store.isLoggedIn)
const stayLoggedIn = ref(true)

const welcomeMessage = computed(() => {
  return isLoggedIn.value
    ? `Hello, ${store.username} 🎉`
    : 'Welcome, Kind Guest'
})

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const handleLogin = async () => {
  errorStore.clearError() // Clear previous errors
  try {
    const result = await store.login({
      username: login.value,
      password: password.value,
    })
    if (result.success) {
      if (stayLoggedIn.value) {
        localStorage.setItem('user', JSON.stringify({ username: login.value }))
      }
    } else {
      errorStore.setError(ErrorType.AUTH_ERROR, result.message) // Set authentication error
    }
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, error) // Handle unexpected errors
  }
}

const handleLogout = () => {
  store.logout()
  if (!stayLoggedIn.value) {
    localStorage.removeItem('user')
  }
}

onMounted(() => {
  // Retrieve user data from localStorage and update the store
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  if (storedUser && storedUser.username !== 'Kind Guest') {
    store.setUser(storedUser)
  }
})
</script>

<style scoped>
.group:hover .float-tooltip {
  visibility: visible;
  opacity: 1;
}

.text-base-200 {
  font-size: 1.25rem;
}

/* Adding some stylish upgrades */
.bg-base-200 {
  transition: background-color 0.3s ease;
}

.bg-base-200:hover {
  background-color: var(--bg-base-300);
}

.text-accent {
  transition: color 0.3s ease;
}

.text-accent:hover {
  color: var(--text-accent-hover);
}

/* Styling for the buttons */
button {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

button:hover {
  background-color: var(--bg-button-hover);
  color: var(--text-button-hover);
}
</style>
