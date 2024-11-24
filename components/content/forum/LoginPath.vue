<template>
  <div class="relative flex flex-col items-start box-border">
    <!-- User Avatar and Login Button -->
    <router-link :to="dashboardRoute" class="flex items-center md:flex-col md:items-center md:space-x-0">
      <template v-if="isLoggedIn">
        <div class="flex flex-col items-center">
          <user-avatar class="h-7 w-7 md:h-9 md:w-9 lg:w-12 lg:h-12 xl:w-15 xl:h-15 rounded-full border border-1 border-base-300" />
          <span class="hidden sm:block text-sm md:text-base mt-2">Username</span>
        </div>
      </template>
      <template v-else>
        <button class="flex items-center justify-center space-x-2">
          <Icon name="kind-icon:person" class="w-5 h-5" />
          <span class="hidden md:block">Login</span>
        </button>
      </template>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const dashboardRoute = '/dashboard'
</script>
