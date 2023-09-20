<template>
  <div class="bg-base-200 p-6 rounded-2xl">
    <h1 class="text-2xl font-semibold mb-4">User Dashboard</h1>

    <div class="flex items-center space-x-4 mb-6">
      <user-avatar />
      <div>
        <p class="text-lg font-medium">
          Welcome, {{ user?.username || 'Kind Guest' }}
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
        <button class="bg-warning p-2 rounded-lg text-white text-lg" @click="logout">Logout</button>
      </div>
      <div v-else>
        <button class="bg-primary p-2 rounded-lg text-white text-lg" @click="showLogin = true">
          Login
        </button>
      </div>

      <login-form v-if="showLogin" @close="showLogin = false" />
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
const isLoading = ref(false)
const errorMessage = ref('')

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
