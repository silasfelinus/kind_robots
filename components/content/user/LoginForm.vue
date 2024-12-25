<template>
  <div class="login-form-container" @click.self="closeForm">
    <div
      class="login-form p-2 m-1 rounded-2xl bg-base-300 border shadow-lg transition-all duration-300 w-full max-w-md"
    >
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <Icon
          name="kind-icon:bubble-loading"
          class="animate-spin text-lg mb-2"
        />
        <div>Loading, please wait...</div>
      </div>
      <!-- Login Form -->
      <form
        v-if="!store.isLoggedIn"
        class="space-y-4 w-full"
        :autocomplete="store.stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <div class="mb-2 relative group">
          <label for="login" class="block text-sm z-30 mb-1">Login:</label>
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
          <label for="password" class="block z-30 text-sm mb-1"
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
          <NuxtLink to="/register" class="text-accent underline"
            >Register</NuxtLink
          >
        </div>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-warning mt-2 w-full text-center">
        {{ errorMessage }}
        <div v-if="userNotFound">
          <div class="mt-2">
            <button class="text-accent underline">
              <NuxtLink to="/register" class="text-accent underline"
                >Register</NuxtLink
              >
            </button>
            or
            <button class="text-accent underline" @click="handleRetryLogin">
              Try a different login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const store = useUserStore()
const login = ref('')
const password = ref('')
const errorStore = useErrorStore()
const errorMessage = ref('')
const userNotFound = ref(false)

const emit = defineEmits(['close'])

const closeForm = () => {
  emit('close')
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

const handleRetryLogin = () => {
  login.value = ''
  password.value = ''
  errorMessage.value = ''
  userNotFound.value = false
  errorStore.clearError()
}
</script>

<style scoped>
.login-form-container {
  position: absolute;
  top: 100%; /* Positioned right below the header or button */
  left: 50%;
  transform: translateX(-50%);
  z-index: 50; /* Ensure it's above other content */
  width: 100%; /* Full width to cover the area but max width restricts the form size */
  display: flex;
  justify-content: center;
}

.login-form {
  background-color: var(--bg-base-300);
}

.group:hover .float-tooltip {
  visibility: visible;
  opacity: 1;
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
