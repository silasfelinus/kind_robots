<template>
  <div class="relative flex flex-col items-start box-border">
    <!-- User Avatar and Login Button -->
    <router-link
      :to="dashboardRoute"
      class="flex items-center md:flex-col md:items-center md:space-x-0"
    >
      <template v-if="isLoggedIn">
        <div class="flex flex-col items-center">
          <user-avatar
            class="h-4 w-4 md:h-7 md:w-7 lg:w-9 lg:h-9 xl:w-12 xl:h-12 rounded-full border border-1 border-base-300"
          />
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
