<template>
  <div :class="['bg-base-200 p-2 rounded-2xl relative', { 'h-32': isMinimized }]">
    <button
      v-if="!isMinimized"
      class="absolute top-1 left-1 z-10"
      @click.stop="toggleMinimize"
    >
      <icon
        name="game-icons:expand"
        class="text-lg"
      />
    </button>
    <span class="absolute top-2 right-2">Role: {{ user?.Role || 'Guest' }}</span>

    <div v-if="!isMinimized">
      <h1 class="text-2xl font-semibold ml-6">
        User Dashboard
      </h1>
      <div class="relative flex justify-center items-center">
        <user-avatar />
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <h2 class="text-lg font-semibold bg-base-200 border-accent rounded-2xl border p-2 pt-1 pb-1">
            {{ user?.username || 'Kind Guest' }}
          </h2>
        </div>
      </div>
      <div class="flex items-center space-x-4 m-2">
        <div>
          <p class="text-lg font-medium m-2 mt-4 p-1 pb-0">
            Welcome, {{ user?.username || 'Guest' }}
            <span
              v-if="!isLoggedIn"
              class="text-sm text-gray-500 ml-2"
            >(Not logged in)</span>
          </p>
          <div class="flex space-x-4 mt-2">
            <div class="flex items-center space-x-2">
              <icon
                name="tdesign:bean"
                class="text-lg"
              />
              <span>Jellybeans: {{ user?.mana || 0 }}</span>
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
      <login-form
        v-if="showLogin"
        @close="showLogin = false"
      />
      <div class="flex flex-row">
        <theme-toggle class="flex flex-row" />
      </div>
    </div>

    <div
      v-else
      class="flex flex-row items-center justify-between h-full"
    >
      <div
        class="flex flex-row items-center space-x-2 cursor-pointer"
        @click.stop="isMinimized ? toggleMinimize() : null"
      >
        <user-avatar class="w-12 h-12" />
        <span>{{ user?.username || 'Kind Guest' }}</span>
      </div>
      <div class="flex flex-row items-center space-x-4">
        <div class="flex items-center space-x-2">
          <icon
            name="tdesign:bean"
            class="text-2xl"
          />
          <span>{{ user?.mana || 0 }}</span>
        </div>
        <button
          :class="['rounded-lg text-white text-lg', isLoggedIn ? 'bg-warning' : 'bg-primary']"
          @click.stop="handleButtonClick"
        >
          {{ isLoggedIn ? 'Logout' : 'Login' }}
        </button>
        <theme-toggle class="flex flex-row" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const showLogin = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    showLogin.value = false
  }
})

const handleButtonClick = () => {
  if (isLoggedIn.value) {
    logout()
  }
  else {
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
  }
  catch (error: any) {
    errorMessage.value = 'Failed to logout. Please try again.'
  }
  finally {
    isLoading.value = false
  }
}
</script>
