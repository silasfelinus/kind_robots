<template>
  <div class="relative flex flex-col items-start box-border">
    <!-- User Avatar and Login Button -->
    <router-link :to="dashboardRoute" class="flex items-center space-x-2">
      <template v-if="isLoggedIn">
        <user-avatar class="h-5 w-5 md:h-8 md:w-8 lg:w-10 lg:w-10 xl:w:12 xl:h-12 rounded-full border border-base-300" />
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
