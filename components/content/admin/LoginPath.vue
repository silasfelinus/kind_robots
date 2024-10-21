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

        <!-- Login Overlay (Hidden until hover) -->
        <div
          class="absolute left-0 top-full mt-1 p-2 bg-primary text-white rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 duration-300 ease-in-out"
        >
          <router-link to="/logout">
            <button class="flex items-center justify-center space-x-2">
              <Icon name="bi:box-arrow-in-right" class="w-5 h-5" />
              <span>Logout</span>
            </button>
          </router-link>
        </div>
      </div>
      <div v-else class="relative group">
        <!-- Default Guest Layout -->
        <router-link
          to="/dashboard"
          class="cursor-pointer text-primary text-lg w-full box-border"
        >
          Kind Guest
        </router-link>

        <!-- Login Overlay (Hidden until hover) -->
        <div
          class="absolute left-0 top-full mt-1 p-2 bg-primary text-white rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 duration-300 ease-in-out"
        >
          <router-link to="/login">
            <button class="flex items-center justify-center space-x-2">
              <Icon name="bi:person-fill" class="w-5 h-5" />
              <span>Login</span>
            </button>
          </router-link>
        </div>
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
