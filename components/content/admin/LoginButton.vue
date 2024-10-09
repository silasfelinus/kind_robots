<template>
  <div class="relative flex items-center space-x-4 lg:ml-10 box-border">
    <!-- Button column -->
    <div class="ml-4 box-border">
      <div v-if="isLoggedIn" class="flex flex-col items-start box-border">
        <router-link to="/dashboard" class="cursor-pointer hover:underline">
          {{ username }}!
        </router-link>
        <jellybean-count />
      </div>
      <div v-else>
        <button
          class="p-2 rounded-lg text-primary text-lg w-full box-border"
          @click="toggleLogin"
        >
          Login
        </button>
      </div>
    </div>

    <!-- Login Form Overlay -->
    <transition name="fade">
      <div
        v-if="showLogin"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 box-border"
      >
        <login-form
          class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md box-border"
          @close="showLogin = false"
        />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const showLogin = ref(false)

const username = computed(() => user.value?.username || 'Kind Guest')

const toggleLogin = () => {
  showLogin.value = !showLogin.value
}
</script>

<style scoped>
/* Fade transition for login form overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
