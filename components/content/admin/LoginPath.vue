<template>
  <div class="relative flex items-center space-x-4 lg:ml-10 box-border">
    <!-- Button column -->
    <div class="ml-4 box-border">
      <div v-if="isLoggedIn" class="flex flex-col items-start box-border">
        <router-link to="/dashboard" class="cursor-pointer hover:underline">
          {{ username }}!
        </router-link>
        <jellybean-count />
      </div>
      <div v-else>
        <router-link
          to="/login"
          class="p-2 rounded-lg text-primary text-lg w-full box-border"
        >
          Login
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
