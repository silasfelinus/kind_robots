<template>
  <div :class="['bg-base-300 rounded-2xl relative', { 'h-32': isMinimized }]">
    <button
      v-if="!isMinimized"
      class="absolute top-1 left-1 z-10"
      @click.stop="toggleMinimize"
    >
      <Icon name="kind-icon:expand" class="text-lg" />
    </button>
    <span class="absolute top-2 right-2"
      >Role: {{ user?.Role || 'Guest' }}</span
    >

    <div v-if="!isMinimized">
      <h1 class="text-2xl font-semibold ml-6">User Dashboard</h1>
      <div class="relative flex flex-col justify-center items-center">
        <!-- Rounded Avatar -->
        <user-avatar
          class="w-auto max-h-50 rounded-full border-2 border-accent"
        />

        <!-- Smaller Avatar Upload -->
        <avatar-upload class="w-16 h-16 mt-2" />

        <div
          class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2"
        >
          <h2
            class="text-lg font-semibold bg-base-300 border-accent rounded-2xl border p-2 pt-1 pb-1"
          >
            {{ user?.username || 'Kind Guest' }}
          </h2>
        </div>
      </div>
      <div class="flex items-center space-x-4 m-2">
        <div>
          <p class="text-lg font-medium m-2 mt-4 p-1 pb-0">
            Welcome, {{ user?.username || 'Guest' }}
            <span v-if="!isLoggedIn" class="text-sm text-gray-500 ml-2"
              >(Not logged in)</span
            >
          </p>
          <div class="flex space-x-4 mt-2">
            <div class="flex items-center space-x-2">
              <jellybean-count />
            </div>
          </div>
        </div>
        <div v-if="isLoggedIn">
          <button
            class="bg-warning p-2 rounded-lg text-white text-lg"
            @click="logout"
          >
            Logout
          </button>
        </div>
        <div v-else>
          <button
            class="bg-primary p-2 rounded-lg text-white text-lg"
            @click="showLogin = true"
          >
            Login
          </button>
        </div>
      </div>

      <login-form v-if="showLogin" @close="showLogin = false" />
      <user-panel v-if="isLoggedIn" />
      <div class="flex flex-row">
        <theme-toggle class="flex flex-row" />
      </div>
    </div>

    <div v-else class="flex flex-row items-center justify-between h-full">
      <div
        class="flex flex-row items-center space-x-2 cursor-pointer"
        @click.stop="isMinimized ? toggleMinimize() : null"
      >
        <!-- Rounded Mini Avatar -->
        <user-avatar class="w-12 h-12 rounded-full border-2 border-accent" />
        <span>{{ user?.username || 'Kind Guest' }}</span>
      </div>
      <div class="flex flex-row items-center space-x-4">
        <div class="flex items-center space-x-2">
          <Icon name="kind-icon:jellybean" class="text-2xl" />
          <span>{{ user?.mana || 0 }}</span>
        </div>
        <button
          :class="[
            'rounded-lg text-white text-lg',
            isLoggedIn ? 'bg-warning' : 'bg-primary',
          ]"
          @click.stop="handleButtonClick"
        >
          {{ isLoggedIn ? 'Logout' : 'Login' }}
        </button>

        <theme-toggle class="flex flex-row" />
      </div>
    </div>
    <cache-clear />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore } from './../../../stores/errorStore'

const userStore = useUserStore()
const errorStore = useErrorStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const showLogin = ref(!isLoggedIn.value)
const isMinimized = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

watch(isLoggedIn, (newValue) => {
  showLogin.value = !newValue
})

const handleButtonClick = async () => {
  if (isLoggedIn.value) {
    try {
      await userStore.logout()
    } catch (error: unknown) {
      errorStore.setError(
        ErrorType.AUTH_ERROR,
        error instanceof Error
          ? error.message
          : 'Failed to logout. Please try again.',
      )
    }
  } else {
    showLogin.value = true
    if (isMinimized.value) {
      toggleMinimize()
    }
  }
}

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
</script>
