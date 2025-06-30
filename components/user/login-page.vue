<!-- /components/content/user/login-page.vue -->
<template>
  <div class="login-form-container">
    <div
      class="login-form p-4 rounded-2xl bg-base-300 border shadow-lg w-full max-w-md"
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
        class="space-y-4"
        :autocomplete="stayLoggedIn ? 'on' : 'off'"
        @submit.prevent="handleLogin"
      >
        <!-- Username Field -->
        <div class="relative group">
          <label for="login" class="block text-sm mb-1">Username:</label>
          <input
            id="login"
            v-model="login"
            type="text"
            autocomplete="username"
            class="w-full p-2 border rounded"
            required
          />
        </div>

        <!-- Password Field -->
        <div class="relative group">
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

        <!-- Login + Register Buttons -->
        <div class="flex items-center justify-between">
          <button type="submit" class="bg-info text-default py-1 px-3 rounded">
            Login
          </button>
          <NuxtLink to="/register" class="text-accent underline text-sm">
            Register
          </NuxtLink>
        </div>

        <!-- Stay Logged In -->
        <LoginPersister />
      </form>

      <!-- Google Login Component -->
      <div class="text-center mt-4">
        <GoogleLogin />
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-box mt-4 text-center">
        {{ errorMessage }}
        <div v-if="userNotFound" class="mt-2">
          <NuxtLink to="/register" class="text-accent underline"
            >Register</NuxtLink
          >
          or
          <button class="text-accent underline" @click="handleRetryLogin">
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/util/login-form.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/userStore'
import { useErrorStore, ErrorType } from '~/stores/errorStore'

const store = useUserStore()
const router = useRouter()

const login = ref('')
const password = ref('')
const errorStore = useErrorStore()
const errorMessage = ref('')
const userNotFound = ref(false)

const stayLoggedIn = computed({
  get: () => store.stayLoggedIn,
  set: (value: boolean) => store.setStayLoggedIn(value),
})

const handleLogin = async () => {
  errorMessage.value = ''
  userNotFound.value = false

  try {
    const credentials = {
      username: login.value,
      password: password.value || undefined,
    }

    const result = await store.login(credentials)

    if (!result.success) {
      errorMessage.value = result.message || 'Login failed'
      userNotFound.value = result.message?.includes('User not found') || false
    } else {
      await router.push('/dashboard')
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
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.login-form {
  background-color: var(--bg-base-300);
  max-width: 100%;
}

.text-accent {
  transition: color 0.3s ease;
}

.text-accent:hover {
  color: var(--text-accent-hover);
}

button {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

button:hover {
  background-color: var(--bg-button-hover);
  color: var(--text-button-hover);
}

.error-box {
  background-color: rgba(255, 180, 0, 0.1);
  border: 1px solid #facc15;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  color: #92400e;
}
</style>
