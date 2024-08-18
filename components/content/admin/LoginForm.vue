<template>
  <div
    class="flex flex-col items-center p-4 rounded-2xl shadow-lg transition-all duration-300 w-full max-w-md mx-auto"
  >
    <!-- Loading State -->
    <div v-if="store.loading" class="text-center text-info">
      <icon name="tabler:loader" class="animate-spin text-lg mb-2" />
      <div>Loading, please wait...</div>
    </div>

    <!-- Login Form -->
    <form
      v-if="!isLoggedIn"
      class="space-y-4 w-full"
      :autocomplete="store.stayLoggedIn ? 'on' : 'off'"
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
        <label for="password" class="block text-sm mb-1"
          >Password (optional):</label
        >
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="w-full p-2 border rounded"
        />
        <div
          class="absolute right-2 bottom-2 text-xs text-gray-500 group-hover:float-tooltip"
        >
          Password (optional)
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <input
            id="stayLoggedIn"
            v-model="store.stayLoggedIn"
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
    <div v-if="errorStore.message" class="text-warning mt-2 w-full text-center">
      {{ errorStore.message }}
      <div v-if="userNotFound">
        <div class="mt-2">
          <button class="text-accent underline">
            <NuxtLink to="/register" class="text-accent underline">
              Register
            </NuxtLink>
          </button>
          or
          <button class="text-accent underline" @click="handleRetryLogin">
            Try a different login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const store = useUserStore()
const errorStore = useErrorStore()
const login = ref('')
const password = ref('')
const isLoggedIn = computed(() => store.isLoggedIn)

const userNotFound = ref(false)

const handleLogin = async () => {
  errorStore.clearError() // Clear previous errors
  userNotFound.value = false

  try {
    // Correctly destructure username and password
    const result = await store.login(login.value, password.value || '')

    if (result.success && store.stayLoggedIn) {
      store.setStayLoggedIn(true)
    } else {
      errorStore.setError(ErrorType.AUTH_ERROR, result.message) // Set authentication error
      if (result.message.includes('User not found')) {
        userNotFound.value = true
      }
    }
  } catch (error: unknown) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, error) // Handle unexpected errors
  }
}

const handleRetryLogin = () => {
  // Clear the login field to allow the user to try a different login
  login.value = ''
  password.value = ''
  errorStore.clearError() // Clear error messages
  userNotFound.value = false
}
</script>

<style scoped>
.group:hover .float-tooltip {
  visibility: visible;
  opacity: 1;
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
