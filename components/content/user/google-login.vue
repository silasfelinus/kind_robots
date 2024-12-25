<template>
  <button
    class="btn btn-outline btn-primary flex items-center space-x-3 px-4 sm:px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
    @click="loginWithGoogle"
  >
    <Icon name="kind-icon:google" class="w-4 sm:w-5 h-4 sm:h-5" />
    <span class="truncate">Sign in with Google</span>
  </button>
</template>

<script setup>
function loginWithGoogle() {
  window.location.href = '/api/auth/google' // Perform a full redirect
}
</script>
