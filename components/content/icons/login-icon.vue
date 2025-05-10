<!-- /components/content/story/login-icon.vue -->
<template>
  <router-link
    :to="routeToNavigate"
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
  >
    <user-avatar
      v-if="isLoggedIn"
      class="w-full h-full max-w-[3rem] max-h-[3rem] rounded-full border border-base-300"
    />
    <Icon
      v-else
      name="kind-icon:person"
      class="w-full h-full max-w-[3rem] max-h-[3rem]"
    />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useIconStore } from '@/stores/iconStore'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const iconStore = useIconStore()
const { isEditing } = storeToRefs(iconStore)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'User')
const navLabel = computed(() => (isLoggedIn.value ? username.value : 'Login?'))
const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)

// expose for smart-icons label
defineExpose({ navLabel })
</script>
