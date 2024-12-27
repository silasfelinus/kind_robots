<template>
  <div class="relative flex flex-col items-start box-border">
    <!-- User Avatar and Login Button -->
    <router-link
      :to="routeToNavigate"
      class="flex items-center md:flex-col md:items-center md:space-x-0"
    >
      <template v-if="isLoggedIn">
        <div class="flex flex-col items-center">
          <user-avatar
            class="h-14 w-14 md:h-16 md:w-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-full border border-1 border-base-300"
          />
        </div>
      </template>
      <template v-else>
        <button class="flex items-center justify-center space-x-2">
          <Icon name="kind-icon:person" class="w-10 h-10" />
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

// Dynamically determine the route to navigate
const routeToNavigate = computed(() => (isLoggedIn.value ? '/dashboard' : '/login'))
</script>
