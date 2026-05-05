<!-- /components/content/icons/login-icon.vue -->
<template>
  <NuxtLink
    :to="routeToNavigate"
    class="flex h-full w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl transition-transform hover:scale-105"
    :title="navLabel"
    :aria-label="navLabel"
  >
    <div
      v-if="isLoggedIn"
      class="flex h-full w-full min-w-0 items-center justify-start gap-1.5 overflow-hidden rounded-2xl border border-base-300 bg-base-200 px-1.5 py-1"
    >
      <user-avatar
        class="h-full max-h-full aspect-square shrink-0 rounded-full border border-primary/60 object-cover"
      />
    </div>

    <div
      v-else
      class="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <Icon name="kind-icon:person" class="h-full w-full" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'User')

const navLabel = computed(() => (isLoggedIn.value ? username.value : 'Login?'))

const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)

defineExpose({ navLabel })
</script>
