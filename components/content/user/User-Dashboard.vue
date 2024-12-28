<template>
  <div class="bg-base-300 rounded-2xl p-4">
    <h1 class="text-2xl font-semibold text-center mb-6">User Dashboard</h1>

    <div
      class="flex flex-col lg:flex-row lg:space-x-6 items-center lg:items-start"
    >
      <!-- Avatar Section -->
      <div class="flex flex-col items-center w-full lg:w-1/3">
        <user-avatar
          class="w-24 h-auto max-h-1/3 rounded-full border-2 border-accent mb-4"
        />
        <avatar-upload class="w-16 h-16 mt-2" />
        <h2
          class="text-lg font-semibold bg-base-300 border-accent rounded-2xl border p-2 mt-4"
        >
          {{ user?.username || 'Kind Guest' }}
        </h2>
      </div>

      <!-- User Info Section -->
      <div class="flex flex-col w-full lg:w-2/3">
        <p class="text-lg font-medium mb-4">
          Welcome, {{ user?.username || 'Guest' }}
          <span v-if="!isLoggedIn" class="text-sm text-gray-500 ml-2">
            (Not logged in)
          </span>
        </p>

        <div class="flex flex-wrap items-center space-x-4 mb-4">
          <jellybean-count />
        </div>

        <div v-if="isLoggedIn" class="flex flex-wrap space-x-4">
          <button
            class="bg-warning p-2 rounded-lg text-white text-lg"
            @click="logout"
          >
            Logout
          </button>
          <user-panel />
        </div>
        <div v-else class="flex flex-wrap space-x-4">
          <button
            class="bg-primary p-2 rounded-lg text-white text-lg"
            @click="showLogin = true"
          >
            Login
          </button>
          <google-login />
        </div>

        <div class="mt-6">
          <theme-toggle class="flex flex-row" />
        </div>
      </div>
    </div>
    <login-page v-if="showLogin" @close="showLogin = false" />
    <cache-clear />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const showLogin = ref(!isLoggedIn.value)
const isLoading = ref(false)
const errorMessage = ref('')

const logout = async () => {
  try {
    isLoading.value = true
    await userStore.logout()
  } catch (error: unknown) {
    if (error instanceof Error) {
      errorMessage.value = `Failed to logout. ${error.message}`
    } else {
      errorMessage.value = 'Failed to logout. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

watch(isLoggedIn, (newValue) => {
  showLogin.value = !newValue
})
</script>
