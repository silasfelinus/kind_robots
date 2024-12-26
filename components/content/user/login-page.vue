<template>
  <div class="login-form-container">
    <div class="login-form p-4 rounded-2xl bg-base-300 border shadow-lg w-full max-w-md">
      <!-- Loading State -->
      <div v-if="store.loading" class="text-center text-info">
        <Icon name="kind-icon:bubble-loading" class="animate-spin text-lg mb-2" />
        <div>Loading, please wait...</div>
      </div>

      <!-- Login Form -->
      <form
        v-if="!store.isLoggedIn"
        class="space-y-4"
        :autocomplete="store.stayLoggedIn ? 'on' : 'off'"
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
          />
        </div>

        <!-- Stay Logged In & Submit -->
        <div class="flex items-center justify-between">
          <div>
            <input
              id="stayLoggedIn"
              v-model="store.stayLoggedIn"
              type="checkbox"
              class="mr-2"
            />
            <label for="stayLoggedIn" class="text-sm">Stay Logged In</label>
          </div>
          <button type="submit" class="bg-info text-default py-1 px-3 rounded">
            Login
          </button>
        </div>

        <!-- Google Login Component -->
        <div class="text-center mt-4">
          <GoogleLogin />
        </div>

        <!-- Register Link -->
        <div class="text-center mt-4">
          <NuxtLink to="/register" class="text-accent underline">Register</NuxtLink>
        </div>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-warning mt-4 text-center">
        {{ errorMessage }}
        <div v-if="userNotFound" class="mt-2">
          <NuxtLink to="/register" class="text-accent underline">Register</NuxtLink>
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
import { ref } from 'vue';
import { useUserStore } from '~/stores/userStore';
import { useErrorStore, ErrorType } from '~/stores/errorStore';

const store = useUserStore();
const login = ref('');
const password = ref('');
const errorStore = useErrorStore();
const errorMessage = ref('');
const userNotFound = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  userNotFound.value = false;
  try {
    const credentials = {
      username: login.value,
      password: password.value || undefined,
    };
    const result = await store.login(credentials);
    if (result.success) {
      store.setStayLoggedIn(store.stayLoggedIn);
    } else {
      errorMessage.value = result.message || 'Login failed';
      userNotFound.value = result.message?.includes('User not found') || false;
    }
  } catch (error) {
    errorStore.setError(ErrorType.AUTH_ERROR, error);
    errorMessage.value = errorStore.message || 'An unexpected error occurred';
  }
};

const handleRetryLogin = () => {
  login.value = '';
  password.value = '';
  errorMessage.value = '';
  userNotFound.value = false;
  errorStore.clearError();
};
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

button:hover {
  background-color: var(--bg-button-hover);
  color: var(--text-button-hover);
}
</style>
