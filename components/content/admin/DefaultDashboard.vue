<template>
  <div class="bg-base-200 p-2 m-2 rounded-2xl relative border">
    <button class="absolute top-1 left-1 z-10" @click.stop="toggleMinimize">
      <icon name="material-symbols:hide-rounded" class="text-lg" />
    </button>
    <span class="absolute top-2 right-2">Role: {{ user?.Role || 'Guest' }}</span>

    <h1 class="text-2xl font-semibold ml-6 mt-2">User Dashboard</h1>
    <div class="relative flex flex-col items-center justify-center">
      <user-avatar class="w-24 h-24" />
      <h2 class="text-lg font-semibold bg-base-200 border-primary rounded-2xl border p-2 mt-2">
        {{ user?.username || 'Kind Guest' }}
      </h2>
    </div>
    <div class="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 m-2">
      <div>
        <div class="flex space-x-4 mt-2">
          <div class="flex items-center space-x-2">
            <icon name="game-icons:health-potion" class="text-lg" />
            <span>Karma: {{ user?.karma || 0 }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <icon name="fluent-emoji-high-contrast:beans" class="text-lg" />
            <span>Jellybeans: {{ user?.mana || 0 }}</span>
          </div>
        </div>
      </div>
      <div v-if="isLoggedIn">
        <button class="bg-warning p-2 rounded-2xl text-white text-sm" @click="logout">
          Logout
        </button>
      </div>
      <div v-else>
        <button
          class="bg-primary p-2 rounded-2xl border text-white text-lg"
          @click="showLogin = true"
        >
          Login
        </button>
      </div>
    </div>
    <login-form v-if="showLogin" @close="showLogin = false" />
    <!-- Bottom Navigation and Toggles -->
    <div class="flex flex-col md:flex-row md:flex-wrap justify-between items-center mt-4">
      <!-- First Row -->

      <!-- Second Row -->
      <div class="flex flex-row justify-between items-center w-full md:w-auto">
        <theme-toggle />
        <butterfly-toggle />
        <layout-selector />
        <mature-toggle />
      </div>
      <div class="flex flex-row justify-between items-center w-full md:w-auto mb-2 md:mb-0">
        <BackLink />
        <HomeLink />
        <ForwardLink />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useToggleStore, ToggleableScreens, ScreenState } from '@/stores/toggleStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const toggleStore = useToggleStore()

const showLogin = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const toggleMinimize = () => {
  toggleStore.setScreenState(ToggleableScreens.USER_DASHBOARD, ScreenState.COMPACT)
}

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    showLogin.value = false
  }
})

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
