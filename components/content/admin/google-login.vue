<template>
  <button
    class="btn btn-primary"
    @click="loginWithGoogle"
  >
    Sign in with Google
  </button>
</template>

<script setup>
import { navigateTo } from 'nuxt/app';

function loginWithGoogle() {
  navigateTo('/api/auth/google');
}
</script>
