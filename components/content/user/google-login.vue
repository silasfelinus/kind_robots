<template>
  <div class="flex flex-col items-start space-y-4">
    <div class="flex items-center space-x-2">
      <input
        id="googleTokenToggle"
        v-model="googleToken"
        type="checkbox"
        class="checkbox checkbox-primary"
        @change="toggleGoogleToken"
      />
      <label for="googleTokenToggle" class="text-sm">
        Keep me logged in with Google
      </label>
    </div>
    <button
      type="button"
      class="btn btn-outline btn-primary flex items-center space-x-3 px-4 sm:px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
      @click="loginWithGoogle"
    >
      <Icon name="kind-icon:google" class="w-4 sm:w-5 h-4 sm:h-5" />
      <span class="truncate">Sign in with Google</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const googleToken = computed({
  get: () => userStore.googleToken,
  set: (value) => userStore.setgoogleToken(value),
})
function toggleGoogleToken() {
  userStore.setGoogleToken(googleToken.value) // Update store and save to localStorage
  console.log('Google login preference updated:', googleToken.value)
}

function loginWithGoogle() {
  window.location.href = '/api/auth/google' // Perform a full redirect
}
</script>
