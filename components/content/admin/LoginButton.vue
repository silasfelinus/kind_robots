<template>
  <div class="flex items-center">
    <!-- Button column -->
    <div class="ml-4">
      <div v-if="isLoggedIn">
        <div class="hidden lg:inline">Salutations,</div>
        {{ username }}!
        <button
          class="bg-danger p-2 rounded-lg text-white text-sm"
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
  </div>
  <login-form v-if="showLogin" @close="showLogin = false" />
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const userStore = useUserStore()
const errorStore = useErrorStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'Kind Guest')
const showLogin = ref(false)

watch(isLoggedIn, (newValue) => {
  if (newValue) {
    showLogin.value = false
  }
})

const logout = async () => {
  errorStore.clearError() // Clear previous errors
  try {
    await errorStore.handleError(
      async () => userStore.logout(),
      ErrorType.AUTH_ERROR,
      'Failed to logout. Please try again.',
    )
  } catch {
    // No additional action needed, errorStore will manage the error
  }
}
</script>
