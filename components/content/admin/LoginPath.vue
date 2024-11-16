<template>
  <div class="relative flex flex-col items-start space-y-2 lg:ml-10 box-border">
    <!-- User Avatar and Jellybean Count -->
    <div v-if="isLoggedIn" class="flex items-center space-x-2">
      <user-picture class="h-10 w-10 rounded-full border border-base-300" />
      <jellybean-count />
    </div>

    <!-- Username (Visible only on md and above) -->
    <div v-if="isLoggedIn" class="hidden md:block">
      <router-link to="/dashboard" class="cursor-pointer hover:underline">
        {{ username }}!
      </router-link>
    </div>

    <!-- Guest Login Button -->
    <div v-else class="relative group">
      <router-link to="/dashboard">
        <button class="flex items-center justify-center space-x-2">
          <Icon name="kind-icon:person" class="w-5 h-5" />
          <span class="hidden md:block">Login</span>
        </button>
      </router-link>
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
