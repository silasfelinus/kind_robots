<template>
  <button
    class="btn btn-primary"
    @click="loginWithGoogle"
  >
    Sign in with Google
  </button>
</template>

<script setup>
function loginWithGoogle() {
  window.location.href = '/api/auth/google'; // Perform a full redirect
}
</script>
