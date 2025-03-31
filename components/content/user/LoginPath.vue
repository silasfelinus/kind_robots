<!-- /components/content/story/login-path.vue -->
<template>
  <router-link
    :to="routeToNavigate"
    class="group flex flex-col items-center justify-center w-[80px] min-w-[72px] max-w-[90px] transition-all"
  >
    <div v-if="isLoggedIn" class="flex flex-col items-center">
      <user-avatar
        class="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-full border border-base-300 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      />
    </div>
    <div v-else class="flex flex-col items-center">
      <Icon
        name="kind-icon:person"
        class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      />
    </div>

    <!-- Label below the icon -->
    <span
      v-if="!displayStore.bigMode"
      class="mt-2 text-center text-sm md:block hidden"
    >
      {{ isLoggedIn ? username : 'Login?' }}
    </span>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'User')

const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)
</script>
