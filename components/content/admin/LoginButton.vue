<template>
  <div class="relative flex items-center">
    <!-- Button column -->
    <div class="ml-4">
      <div v-if="isLoggedIn">
        <router-link to="/dashboard" class="cursor-pointer hover:underline">
          {{ username }}!
        </router-link>
        <jellybean-count />
      </div>
      <div v-else>
        <button
          class="bg-primary p-2 rounded-lg text-white text-lg"
          @click="toggleLogin"
        >
          Login
        </button>
      </div>
    </div>
    <!-- Login Form -->
    <transition name="fade">
      <login-form v-if="showLogin" @close="showLogin = false" />
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
