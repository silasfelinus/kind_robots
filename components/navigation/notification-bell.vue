<!-- /components/navigation/notification-bell.vue -->
<!--
  Nav notification bell: unread badge + dropdown list. Bound to notificationStore
  (friend requests/accepts, new DMs, admin notices). Loads on mount for logged-in
  users; clicking an item marks it read and follows its linkPath.
-->
<template>
  <div
    v-if="userStore.isLoggedIn && !userStore.isGuest"
    class="dropdown dropdown-end"
  >
    <button tabindex="0" class="btn btn-ghost btn-circle" @click="onOpen">
      <div class="indicator">
        <Icon name="kind-icon:ring" class="h-5 w-5" />
        <span
          v-if="notifications.unreadCount"
          class="badge indicator-item badge-primary badge-xs"
        >
          {{ notifications.unreadCount > 9 ? '9+' : notifications.unreadCount }}
        </span>
      </div>
    </button>

    <div
      tabindex="0"
      class="dropdown-content z-50 mt-2 w-80 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
    >
      <div class="flex items-center justify-between px-2 py-1">
        <span class="font-black">Notifications</span>
        <button
          v-if="notifications.unreadCount"
          class="btn btn-ghost btn-xs"
          @click="notifications.markAllRead()"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <p
          v-if="!notifications.items.length"
          class="px-2 py-6 text-center text-sm text-base-content/50"
        >
          You're all caught up.
        </p>
        <button
          v-for="n in notifications.items"
          :key="n.id"
          class="flex w-full flex-col gap-0.5 rounded-xl px-2 py-2 text-left hover:bg-base-200"
          :class="{ 'bg-base-200/50': !n.isRead }"
          @click="onClick(n)"
        >
          <span class="flex items-center gap-2 text-sm font-semibold">
            <span v-if="!n.isRead" class="h-2 w-2 rounded-full bg-primary" />
            {{ n.title }}
          </span>
          <span
            v-if="n.body"
            class="line-clamp-2 pl-4 text-xs text-base-content/60"
            >{{ n.body }}</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import {
  useNotificationStore,
  type AppNotification,
} from '@/stores/notificationStore'

const userStore = useUserStore()
const notifications = useNotificationStore()

function onOpen() {
  notifications.load()
}

async function onClick(n: AppNotification) {
  await notifications.markRead(n.id)
  if (n.linkPath) navigateTo(n.linkPath)
}

onMounted(() => {
  if (userStore.isLoggedIn && !userStore.isGuest) notifications.load()
})
</script>
