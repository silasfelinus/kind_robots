<!-- /components/content/user/user-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
    <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        :disabled="isLoadingManager"
        @click="refreshManagerData(true)"
      >
        <span
          v-if="isLoadingManager"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
        Refresh
      </button>

      <button
        class="btn btn-error btn-sm rounded-xl"
        type="button"
        :disabled="isLoggingOut"
        @click="logout"
      >
        <span v-if="isLoggingOut" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:logout" class="size-4" />
        {{ isLoggingOut ? 'Logging out…' : 'Log Out' }}
      </button>
    </div>

    <div
      v-if="managerError"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ managerError }}
    </div>

    <div
      v-if="isLoadingManager"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <span class="loading loading-spinner loading-sm" />
      <span class="ml-2">Loading user account details...</span>
    </div>

    <section
      v-if="activeTab === 'dashboard'"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <div class="flex flex-col gap-4">
        <user-dashboard />

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <cache-clear />
        </div>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'subscription'"
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <subscription-manager />
    </section>

    <section
      v-else-if="activeTab === 'milestones'"
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <milestone-gallery />
    </section>

    <theme-gallery
      v-else-if="activeTab === 'themes'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <chat-gallery
      v-else-if="activeTab === 'chats'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <server-manager
      v-else-if="activeTab === 'servers'"
      class="min-h-0 flex-1"
    />

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown user tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type UserTab =
  | 'dashboard'
  | 'subscription'
  | 'milestones'
  | 'themes'
  | 'chats'
  | 'servers'

const dashboardKey = 'user' as const
const fallbackTab: UserTab = 'dashboard'
const validTabs: UserTab[] = [
  'dashboard',
  'subscription',
  'milestones',
  'themes',
  'chats',
  'servers',
]

const navStore = useNavStore()
const userStore = useUserStore()
const serverStore = useServerStore()

const isLoggingOut = ref(false)
const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const activeTab = computed<UserTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey)

  return validTabs.includes(selectedTab as UserTab)
    ? (selectedTab as UserTab)
    : fallbackTab
})

async function refreshManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await navStore.initialize()

    if (force || !serverStore.hasLoaded) {
      await serverStore.initialize({ force, fetchRemote: true })
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh user data.'
  } finally {
    isLoadingManager.value = false
  }
}

onMounted(async () => {
  await refreshManagerData()
})

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await userStore.logout()
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
