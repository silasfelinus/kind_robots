<!-- /components/content/icons/login-icon.vue -->
<template>
  <router-link
    :to="routeToNavigate"
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
  >
    <user-avatar
      v-if="isLoggedIn"
      class="w-full h-full rounded-full border border-base-300 object-cover"
    />
    <Icon v-else name="kind-icon:person" class="w-full h-full" />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { usesmartIconStore } from '@/stores/smartIconStore'

const userStore = useUserStore()
const smartIconStore = usesmartIconStore()

// Don't need storeToRefs; just use computed
const isEditing = computed(() => smartIconStore.isEditing)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const username = computed(() => userStore.user?.username || 'User')

const navLabel = computed(() => (isLoggedIn.value ? username.value : 'Login?'))

const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)

// exposed label for smart-icons
defineExpose({ navLabel })
</script>
