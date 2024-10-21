<template>
  <div class="relative flex items-center space-x-4 lg:ml-10 box-border">
    <!-- Button column -->
    <div class="ml-4 box-border">
      <div
        v-if="isLoggedIn"
        class="relative group flex flex-col items-start box-border"
      >
        <router-link to="/dashboard" class="cursor-pointer hover:underline">
          {{ username }}!
        </router-link>
        <jellybean-count />
      </div>
      <div v-else class="relative group">
        <!-- Default Guest Layout -->
        <router-link to="/dashboard">
          <button class="flex items-center justify-center space-x-2">
            <Icon name="bi:person-fill" class="w-5 h-5" />
            <span>Login</span>
          </button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const username = computed(() => user.value?.username || 'Kind Guest')
</script>
