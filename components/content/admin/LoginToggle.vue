<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="flex items-center h-36 w-36 z-30">
    <!-- Welcome Message -->
    <div class="flex items-center cursor-pointer" @click="toggleVisibility">
      <img
        v-if="store.avatarImage"
        :src="store.avatarImage"
        class="w-8 h-8 rounded-full mr-2"
        alt="Avatar"
      />
      <Icon name="tabler:home" class="text-2xl" />
      <span class="ml-2">{{ welcomeMessage }}</span>
      <NuxtLink
        v-if="isLoggedIn && store.role === 'admin'"
        to="/admin"
        class="ml-2 underline"
      >
        Admin
      </NuxtLink>
      <NuxtLink v-if="isLoggedIn" to="/dashboard" class="ml-2 underline">
        Dashboard
      </NuxtLink>
    </div>

    <!-- Login Dropdown -->
    <div
      v-if="isVisible && !isLoggedIn"
      class="flex flex-col items-center p-4 rounded-2xl shadow-lg transition-all duration-300"
    >
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <Icon name="tabler:loader" class="animate-spin text-lg mb-2" />
        <div>Loading, please wait...</div>
      </div>

      <!-- Success Screen -->
      <div v-else-if="isLoggedIn" class="text-center">
        <div class="mb-4">
          <span class="text-lg font-semibold"
            >Hello, {{ store.username }} 🎉</span
          >

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
        class="space-y-4 z-40"
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
      <div v-if="errorMessage" class="text-warning mt-2">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const store = useUserStore()
const errorStore = useErrorStore()
const login = ref<string>('')
const password = ref<string>('')
const isVisible = ref<boolean>(false)
const errorMessage = ref<string>('') // Ensuring errorMessage is always treated as string
const stayLoggedIn = ref<boolean>(true)

const isLoggedIn = computed(() => store.isLoggedIn)

const welcomeMessage = computed(() => {
  return isLoggedIn.value
    ? `Hello, ${store.username} 🎉`
    : 'Welcome, Kind Guest'
})

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const handleLogin = async () => {
  errorMessage.value = '' // Clear any existing error message
  try {
    const result = await store.login({
      username: login.value,
      password: password.value,
    }) // Adjusted to pass a single object
    if (result.success) {
      if (stayLoggedIn.value) {
        localStorage.setItem('user', JSON.stringify({ username: login.value }))
      }
    } else {
      errorStore.setError(
        ErrorType.AUTH_ERROR,
        result.message || 'Login failed. Please try again.',
      )
      errorMessage.value = result.message || 'Login failed. Please try again.' // Providing a fallback message
    }
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMsg)
    errorMessage.value = errorStore.message || errorMsg // Handling potential undefined from errorStore.message
  }
}

const handleLogout = () => {
  store.logout()
  if (!stayLoggedIn.value) {
    localStorage.removeItem('user')
  }
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    const user = JSON.parse(storedUser)
    if (user && user.username !== 'Kind Guest') {
      store.setUser(user)
    }
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
  background-color: var(--bg-base-400);
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
