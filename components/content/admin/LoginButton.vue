<template>
  <div class="relative flex items-center">
    <!-- Button column -->
    <div class="ml-4">
      <div v-if="isLoggedIn">
        {{ username }}!
        <jellybean-count />
        <button class="b p-2 rounded-lg text-white text-sm" @click="logout">
          logout
        </button>
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
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isLoading = ref(false)
const errorMessage = ref('')

const showLogin = ref(false)

const username = computed(() => user.value?.username || 'Kind Guest')

const toggleLogin = () => {
  showLogin.value = !showLogin.value
}

const logout = async () => {
  try {
    isLoading.value = true
    await userStore.logout()
  } catch {
    errorMessage.value = 'Failed to logout. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
