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
      class="relative flex h-full w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200 py-0.5 px-0.5"
    >
      <!-- Unread message badge -->
      <span
        v-if="hasUnread"
        class="absolute right-1 top-1 z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-error shadow"
        aria-label="Unread messages"
      />

      <!-- Avatar -->
      <div
        class="flex min-h-0 flex-1 w-full items-center justify-center overflow-hidden"
      >
        <user-avatar
          class="h-full max-h-full aspect-square shrink-0 rounded-full border border-primary/60 object-cover"
        />
      </div>
    </div>

    <!-- Guest state — plain icon, no label needed -->
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
import { useChatStore } from '@/stores/chatStore'

const userStore = useUserStore()
const chatStore = useChatStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

const hasUnread = computed(() =>
  (chatStore.unreadMessages ?? []).some(
    (msg) => msg.recipientId === userStore.user?.id,
  ),
)

const navLabel = computed(() =>
  isLoggedIn.value
    ? `${roleLabel.value}${hasUnread.value ? ' (unread messages)' : ''}`
    : 'Login?',
)

const routeToNavigate = computed(() =>
  isLoggedIn.value ? '/dashboard' : '/login',
)

defineExpose({ navLabel })
</script>
