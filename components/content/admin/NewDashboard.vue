<template>
  <div
    :class="{
      'bg-base-200 p-2 rounded-2xl relative border m-2 w-full': true,
      'flex-col space-y-1': !isCompact,
      'flex-row': isCompact
    }"
  >
    <div
      :class="{
        'flex items-center justify-between': true,
        'flex-col': !isCompact,
        'flex-row': isCompact
      }"
    >
      <!-- User Info and Logout -->
      <div class="flex items-center space-x-2 cursor-pointer" @click.stop="toggleMinimize">
        <icon name="game-icons:expand" class="text-lg absolute top-0 left-1" />
        <user-avatar :class="{ 'w-24 h-24 mx-auto': !isCompact, 'w-12 h-12': isCompact }" />
        <span :class="{ 'text-xl': !isCompact, 'hidden md:inline': isCompact }">{{
          user?.username || 'Kind Guest'
        }}</span>
        <!-- Jellybeans -->
        <div class="hidden md:flex items-center space-x-4" :class="{ hidden: isCompact }">
          <div class="flex items-center space-x-2">
            <icon name="tdesign:bean" class="text-lg" />
            <span>{{ jellybeans }}/ 9 Jellybeans Discovered</span>
          </div>
        </div>
      </div>

      <smart-links v-if="isCompact" />

      <!-- Theme and Butterfly Toggle -->
      <div
        class="md:flex items-center space-x-4 md:w-auto w-full"
        :class="{ 'm-2': !isCompact, hidden: isCompact }"
      >
        <theme-toggle />
        <butterfly-toggle />
        <layout-selector class="p-1 m-1" />
      </div>

      <!-- Moved the login button here so it is always visible -->
      <div class="flex items-center w-full md:w-auto">
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
    </div>

    <!-- Login Form and Smart Links -->
    <div v-if="!isCompact" class="w-full">
      <smart-links />
    </div>

    <login-form v-if="showLogin" @close="showLogin = false" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const userStore = useUserStore()
const jellybeans = computed(() => userStore.mana)
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const showLogin = ref(false)
const isPopupVisible = ref(false)

const toggleStore = useToggleStore()
const isCompact = ref(
  toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) === ScreenState.COMPACT
)

// Initialize the state from local storage when the component mounts
onMounted(() => {
  toggleStore.loadFromLocalStorage()
  isCompact.value =
    toggleStore.getScreenState(ToggleableScreens.USER_DASHBOARD) === ScreenState.COMPACT
})

const toggleMinimize = () => {
  isCompact.value = !isCompact.value
  const newState = isCompact.value ? ScreenState.COMPACT : ScreenState.FULL
  toggleStore.setScreenState(ToggleableScreens.USER_DASHBOARD, newState)
}

const handleButtonClick = () => {
  if (isLoggedIn.value) {
    logout()
  } else {
    showLogin.value = true
  }
}

const logout = async () => {
  try {
    await userStore.logout()
  } catch (error: any) {
    const errorResponse = errorHandler({
      error,
      message: 'Failed to logout. Please try again.'
    })
  }
}
</script>
