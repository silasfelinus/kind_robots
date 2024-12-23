<template>
  <button
    class="btn btn-outline btn-primary flex items-center space-x-2 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
    @click="loginWithGoogle"
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
      alt="Google"
      class="w-5 h-5"
    />
    <span>Sign in with Google</span>
  </button>
</template>

<script setup>
function loginWithGoogle() {
  window.location.href = '/api/auth/google'; // Perform a full redirect
}
</script>
