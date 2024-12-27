<template>
  <div class="flex flex-col items-start space-y-4">
    <div class="flex items-center space-x-2">
      <input
        id="googleLoginToggle"
        type="checkbox"
        v-model="googleLogin"
        @change="toggleGoogleLogin"
        class="checkbox checkbox-primary"
      />
      <label for="googleLoginToggle" class="text-sm">
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

<script setup lang='ts'>
import { ref, computed } from "vue";
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const googleLogin = computed({
  get: () => userStore.googleLogin,
  set: (value) => userStore.setGoogleLogin(value),
});
function toggleGoogleLogin() {
  userStore.setGoogleLogin(googleLogin.value); // Update store and save to localStorage
  console.log('Google login preference updated:', googleLogin.value);
}

function loginWithGoogle() {
  window.location.href = '/api/auth/google'; // Perform a full redirect
}


</script>