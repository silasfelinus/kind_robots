<template>
  <button
    class="btn btn-outline btn-primary flex items-center space-x-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
    @click="loginWithGoogle"
  >
    <Icon name="kind-icon:google" class="w-5 h-5" />
    <span>Sign in with Google</span>
  </button>
</template>

<script setup>
function loginWithGoogle() {
  window.location.href = '/api/auth/google' // Perform a full redirect
}
</script>
