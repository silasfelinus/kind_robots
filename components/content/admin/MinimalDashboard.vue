<template>
  <div class="bg-base-200 p-2 rounded-2xl relative w-full border m-2 max-w-screen">
    <div class="flex items-center justify-between h-full">
      <!-- User Info and Logout -->
      <div class="flex items-center space-x-2 cursor-pointer" @click.stop="toggleMinimize">
        <icon name="game-icons:expand" class="text-lg" />
        <user-avatar class="w-12 h-12" />
        <span>{{ user?.username || 'Kind Guest' }}</span>
        <!-- Karma and Mana -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <icon name="tdesign:bean" class="text-lg" />
            <span>Jellybeans Discovered: {{ jellybeans }}</span>
          </div>
        </div>
        <button
          :class="[
            'rounded-2xl p-2 py-1 text-white text-lg',
            isLoggedIn ? 'bg-warning' : 'bg-primary'
          ]"
          @click.stop="handleButtonClick"
        >
          {{ isLoggedIn ? 'Logout' : 'Login' }}
        </button>
      </div>

      <!-- Centered Navigation Buttons -->
      <div class="flex items-center space-x-4 mx-auto">
        <BackLink />
        <HomeLink />
        <ForwardLink />
      </div>

      <!-- Theme and Butterfly Toggle -->
      <div class="flex items-center space-x-4">
        <theme-toggle />
        <butterfly-toggle />
      </div>
    </div>

    <!-- Login Form -->
    <div
      v-if="showLogin"
      class="flex flex-row bg-opacity-50 m-2 p-1 bg-black items-center justify-center z-50"
    >
      <login-form v-if="showLogin" @close="showLogin = false" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const userStore = useUserStore()
const jellybeans = computed(() => userStore.mana)
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const showLogin = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const toggleStore = useToggleStore()

const toggleMinimize = () => {
  toggleStore.setScreenState(ToggleableScreens.USER_DASHBOARD, ScreenState.FULL)
}

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    showLogin.value = false
  }
})
const handleButtonClick = () => {
  if (isLoggedIn.value) {
    logout()
  } else {
    showLogin.value = true
  }
}

const logout = async () => {
  console.log('trying to log out')
  try {
    isLoading.value = true
    await userStore.logout()
  } catch (error: any) {
    errorMessage.value = 'Failed to logout. Please try again.'
  } finally {
    console.log('should be logged out')
    isLoading.value = false
  }
}
</script>
