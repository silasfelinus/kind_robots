<template>
  <div class="bg-base-200 p-2 rounded-2xl relative">
    <div class="flex flex-row items-center justify-between h-full">
      <div class="flex flex-row items-center space-x-2 cursor-pointer" @click.stop="toggleMinimize">
        <icon name="game-icons:expand" class="text-lg" />
        <user-avatar class="w-12 h-12" />
        <span>{{ user?.username || 'Kind Guest' }}</span>
      </div>
      <div class="flex flex-row items-center space-x-4 p-2 m-1">
        <icon name="game-icons:standing-potion" class="text-2xl" />
        <span>{{ user?.mana || 0 }}</span>
      </div>
      <div class="flex flex-row items-center space-x-2">
        <icon name="game-icons:health-potion" class="text-2xl" />
        <span>{{ user?.karma || 0 }}</span>
      </div>
      <button
        :class="[
          'm-1 rounded-2xl p-2 py-1 text-white text-lg',
          isLoggedIn ? 'bg-warning' : 'bg-primary'
        ]"
        @click.stop="handleButtonClick"
      >
        {{ isLoggedIn ? 'Logout' : 'Login' }}
      </button>
      <div
        v-if="showLogin"
        class="absolute top-0 left-0 w-full h-full bg-opacity-50 bg-black flex items-center justify-center z-50"
      >
        <login-form v-if="showLogin" @close="showLogin = false" />
      </div>
      <BackLink class="flex flex-row" />
      <HomeLink class="flex flex-row" />
      <ForwardLink class="flex flex-row" />
      <layout-selector class="flex flex-row" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const userStore = useUserStore()
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
  try {
    isLoading.value = true
    await userStore.logout()
  } catch (error: any) {
    errorMessage.value = 'Failed to logout. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
