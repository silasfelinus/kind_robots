<template>
  <div class="relative flex items-center h-36 w-36">
    <!-- Login Icon and Label -->
    <div class="flex items-center cursor-pointer" @click="toggleVisibility">
      <icon
        name="tabler:login"
        class="text-base-200 text-2xl"
        title="Toggle Login"
      />
      <span class="ml-2 text-base-200">Login</span>
    </div>

    <!-- Login Dropdown -->
    <div
      v-if="isVisible"
      class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-base-200 p-4 rounded-2xl shadow-lg transition-all duration-300"
    >
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <icon name="tabler:loader" class="animate-spin text-lg mb-2" />
        <div>Loading, please wait...</div>
      </div>

      <!-- Success Screen -->
      <div v-else-if="isLoggedIn" class="text-center">
        <div class="mb-4">
          <span class="text-lg font-semibold"
            >Hello, {{ store.username }} 🎉</span
          >
        </div>
        <button
          class="bg-warning text-default py-1 px-3 rounded"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>

      <!-- Login Form -->
      <form
        v-else
        class="space-y-4"
        :autocomplete="savePassword ? 'on' : 'off'"
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
              id="savePassword"
              v-model="savePassword"
              type="checkbox"
              class="mr-2"
            />
            <label for="savePassword" class="text-sm">Save Password</label>
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
import { ref, onMounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

// Stores
const store = useUserStore()
const errorStore = useErrorStore()

// Reactive State
const login = ref('')
const password = ref('')
const savePassword = ref(true)
const isVisible = ref(true)
const errorMessage = ref('')
const isLoggedIn = ref(
  store.username !== null && store.username !== 'Kind Guest',
)

// Methods
const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const handleLogin = async () => {
  errorMessage.value = ''
  try {
    // Ensure both arguments are provided
    const result = await store.login(login.value, password.value)
    if (result.success) {
      isLoggedIn.value = true
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorStore.setError(ErrorType.AUTH_ERROR, error)
    errorMessage.value = errorStore.message || 'An unexpected error occurred.'
  }
}

const handleLogout = () => {
  store.logout()
  isLoggedIn.value = false
}

// Lifecycle Hook
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    const user = JSON.parse(storedUser)
    if (user && user.username !== 'Kind Guest') {
      store.setUser(user)
      isLoggedIn.value = true
    }
  }

  if (import.meta.env.SSR === false) {
    window.addEventListener('login-success', (event: Event) => {
      if (event instanceof CustomEvent && event.detail.user) {
        localStorage.setItem('user', JSON.stringify(event.detail.user))
        isLoggedIn.value = true
      }
    })
  }
})
</script>

<style scoped>
.float-tooltip {
  visibility: hidden;
  opacity: 0;
  transition:
    visibility 0s,
    opacity 0.5s linear;
}
.group:hover .float-tooltip {
  visibility: visible;
  opacity: 1;
}

/* Styling for the login label */
.text-base-200 {
  font-size: 1.25rem;
}
</style>
