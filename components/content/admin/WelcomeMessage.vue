<template>
  <div class="flex items-center">
    <img
      v-if="store.avatarImage"
      :src="store.avatarImage"
      class="w-32 h-32 rounded-full mr-2"
      alt="Avatar"
    />
    <welcome-message />
    <icon name="tabler:home" class="text-base-200 text-2xl" />
    <div class="ml-2 flex items-center">
      <NuxtLink
        v-if="isLoggedIn"
        to="/dashboard"
        class="text-accent underline mr-2"
      >
        <span class="text-base-200">{{ welcomeMessage }}</span>
      </NuxtLink>
      <span v-else class="text-base-200 mr-2">{{ welcomeMessage }}</span>
      <button
        v-if="isLoggedIn"
        class="text-accent underline"
        @click="handleLogout"
      >
        Logout
      </button>
      <icon
        v-else
        name="tabler:user"
        class="text-base-200 text-2xl ml-2 cursor-pointer"
        @click="toggleVisibility"
      />
    </div>
    <LoginWindow v-if="isVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const store = useUserStore()
const isLoggedIn = ref(
  store.username !== null && store.username !== 'Kind Guest',
)
const isVisible = ref(false)

const welcomeMessage = computed(() => {
  return isLoggedIn.value
    ? `Hello, ${store.username} 🎉`
    : 'Welcome, Kind Guest'
})

const handleLogout = () => {
  store.logout()
  isLoggedIn.value = false
  localStorage.removeItem('user')
}

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
  if (storedUser && storedUser.username !== 'Kind Guest') {
    store.setUser(storedUser)
    isLoggedIn.value = true
  }
})
</script>

<style scoped>
.text-base-200 {
  font-size: 1.25rem;
}
</style>
