<template>
  <div class="bg-base-200 p-6 rounded-2xl">
    <h1 class="text-2xl font-semibold mb-4">User Dashboard</h1>

    <div class="flex items-center space-x-4 mb-6">
      <img
        :src="user.avatarImage"
        :alt="user.username + ' avatar'"
        class="w-32 h-32 rounded-full"
      />
      <div>
        <p class="text-lg font-medium">Welcome, {{ user.username }}</p>
        <div class="flex space-x-4 mt-2">
          <div class="flex items-center space-x-2">
            <icon name="game-icons:health-potion" class="text-lg" />
            <span>Karma: {{ user.karma }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <icon name="game-icons:standing-potion" class="text-lg" />
            <span>Mana: {{ user.mana }}</span>
          </div>
        </div>
      </div>
      <button class="bg-warning p-2 rounded-lg text-white text-lg" @click="logout">Logout</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Mana Purchase Section (Not Implemented) -->
      <div class="bg-primary p-4 rounded-2xl flex items-center justify-center">
        <span class="text-white text-lg">Mana Purchase (Coming Soon)</span>
      </div>

      <!-- Change Data Section (Not Implemented) -->
      <div class="bg-secondary p-4 rounded-2xl flex items-center justify-center">
        <span class="text-white text-lg">Change Data (Coming Soon)</span>
      </div>

      <!-- Change User Avatar Section (Not Implemented) -->
      <div class="bg-accent p-4 rounded-2xl flex items-center justify-center">
        <span class="text-white text-lg">Change Avatar (Coming Soon)</span>
      </div>

      <!-- Additional Section (Feel free to replace with any other feature) -->
      <div class="bg-info p-4 rounded-2xl flex items-center justify-center">
        <span class="text-white text-lg">Additional Feature (Coming Soon)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const user = ref(null)

onMounted(() => {
  user.value = userStore.user
})

const logout = () => {
  userStore.logout()
}
</script>
