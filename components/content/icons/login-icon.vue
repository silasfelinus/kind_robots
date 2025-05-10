<!-- /components/content/story/login-icon.vue -->
<template>
  <router-link
    :to="routeToNavigate"
    class="group relative flex items-center justify-center w-[3rem] h-[3rem]"
  >
    <div v-if="isLoggedIn" class="flex flex-col items-center">
      <user-avatar
        class="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-full border border-base-300 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      />
    </div>
    <div v-else class="flex flex-col items-center">
      <Icon
        name="kind-icon:person"
        class="w-full h-full max-w-[3rem] max-h-[3rem] transition-transform hover:scale-110"
      />
    </div>

    <span
      v-if="!isEditing && !displayStore.bigMode"
      class="absolute top-full mt-1 text-xs text-center pointer-events-none"
    >
      {{ isLoggedIn ? username : 'Login?' }}
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useIconStore } from '@/stores/iconStore'
import { storeToRefs } from 'pinia'

const displayStore = useDisplayStore()
const { bigMode } = storeToRefs(displayStore)

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'User')

const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)

const iconStore = useIconStore()
const { isEditing } = storeToRefs(iconStore)
</script>
