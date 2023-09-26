<template>
  <div class="bg-base-200 p-2 rounded-2xl relative">
    <button class="absolute top-1 left-1 z-10" @click.stop="toggleMinimize">
      <icon name="material-symbols:hide-rounded" class="text-lg" />
    </button>
    <span class="absolute top-2 right-2">Role: {{ user?.Role || 'Guest' }}</span>

    <h1 class="text-2xl font-semibold ml-6">User Dashboard</h1>
    <div class="relative flex justify-center items-center">
      <user-avatar />
      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
        <h2
          class="text-lg font-semibold bg-base-200 border-accent rounded-2xl border p-2 pt-1 pb-1"
        >
          {{ user?.username || 'Kind Guest' }}
        </h2>
      </div>
    </div>
    <div class="flex items-center space-x-4 m-2">
      <div>
        <p class="text-lg font-medium m-2 mt-4 p-1 pb-0">
          Welcome, {{ user?.username || 'Guest' }}
          <span v-if="!isLoggedIn" class="text-sm text-gray-500 ml-2">(Not logged in)</span>
        </p>
        <div class="flex space-x-4 mt-2">
          <div class="flex items-center space-x-2">
            <icon name="game-icons:health-potion" class="text-lg" />
            <span>Karma: {{ user?.karma || 0 }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <icon name="game-icons:standing-potion" class="text-lg" />
            <span>Mana: {{ user?.mana || 0 }}</span>
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
    <div class="flex flex-row">
      <BackLink class="flex flex-row" />
      <HomeLink class="flex flex-row" />
      <ForwardLink class="flex flex-row" />
      <layout-selector class="flex flex-row" />
      <theme-toggle class="flex flex-row" />
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
