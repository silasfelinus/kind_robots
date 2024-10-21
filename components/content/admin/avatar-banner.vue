<!-- eslint-disable vue/html-self-closing -->
<template>
  <div class="flex items-center h-36 w-36 z-30">
    <!-- Welcome Message -->
    <div
      class="flex flex-col items-start cursor-pointer"
      @click="toggleVisibility"
    >
      <img
        v-if="store.avatarImage"
        :src="store.avatarImage"
        class="w-8 h-8 rounded-full mb-2"
        alt="Avatar"
      />
      <span class="text-base-200 text-lg mb-1">{{ welcomeMessage }}</span>
      <NuxtLink
        v-if="isLoggedIn"
        to="/dashboard"
        class="text-accent underline text-sm"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn && store.role === 'admin'"
        to="/admin"
        class="text-accent underline text-sm mt-1"
      >
        Admin
      </NuxtLink>
    </div>

    <!-- Icon to Toggle Login -->
    <div class="ml-4">
      <Icon
        name="kind-icon:person"
        class="text-base-200 text-2xl cursor-pointer"
        @click="toggleVisibility"
      />
    </div>

    <!-- Login Dropdown -->
    <div
      v-if="isVisible"
      class="flex flex-col items-center bg-base-300 p-4 rounded-2xl shadow-lg transition-all duration-300 absolute top-36 left-0"
    >
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <Icon
          name="kind-icon:bubble-loading"
          class="animate-spin text-lg mb-2"
        />
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
        class="space-y-4 z-5=30"
        :autocomplete="stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <div>
          <label for="login" class="block text-sm mb-1">Login:</label>
          <input
            id="login"
            v-model="login"
            type="text"
            autocomplete="username"
            class="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label for="password" class="block text-sm mb-1">Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full p-2 border rounded"
            required
          />
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

const store = useUserStore()
const errorStore = useErrorStore()
const login = ref('')
const password = ref('')
const isVisible = ref(false)
const isLoggedIn = computed(() => store.isLoggedIn)
const stayLoggedIn = ref(true)
const errorMessage = ref<string | null>(null)
const userNotFound = ref(false)

const welcomeMessage = computed(() => {
  return isLoggedIn.value
    ? `Hello, ${store.username} 🎉`
    : 'Welcome, Kind Guest'
})

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

const handleLogin = async () => {
  errorMessage.value = ''
  userNotFound.value = false
  try {
    const credentials = {
      username: login.value,
      password: password.value || undefined,
    }
    const result = await store.login(credentials)
    if (result.success) {
      store.setStayLoggedIn(store.stayLoggedIn)
    } else {
      errorMessage.value = result.message || 'Login failed'
      userNotFound.value = result.message?.includes('User not found') || false
    }
  } catch (error) {
    errorStore.setError(ErrorType.AUTH_ERROR, error)
    errorMessage.value = errorStore.message || 'An unexpected error occurred'
  }
}

const handleLogout = async () => {
  errorStore.clearError() // Clear previous errors

  try {
    await errorStore.handleError(
      async () => store.logout(),
      ErrorType.AUTH_ERROR,
      'Failed to logout. Please try again.',
    )

    if (!stayLoggedIn.value) {
      localStorage.removeItem('user')
    }
  } catch (error) {
    errorMessage.value = 'An error occurred during logout.'
    console.error(error) // Optionally log the error for debugging
  }
}

onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  if (storedUser && storedUser.username !== 'Kind Guest') {
    store.setUser(storedUser)
  }
})
</script>
