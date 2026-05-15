<!-- /components/content/user/user-manager.vue -->
<template>
  <dashboard-shell
    title="User Dashboard"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading user account details..."
    nav-grid-class="xl:grid-cols-7"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #actions>
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
    </template>

    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'dashboard'" class="flex flex-col gap-4">
        <user-dashboard />

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <cache-clear />
        </div>
      </section>

      <section
        v-else-if="currentTab === 'subscription'"
        class="rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <subscription-manager />
      </section>

      <section
        v-else-if="currentTab === 'milestones'"
        class="rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <milestone-gallery />
      </section>

      <theme-gallery v-else-if="currentTab === 'themes'" :show-header="false" />

      <chat-gallery v-else-if="currentTab === 'chats'" :show-header="false" />

      <gallery-gallery
        v-else-if="currentTab === 'galleries'"
        :show-header="false"
      />

      <server-manager v-else-if="currentTab === 'servers'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown user tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

const dashboardKey = 'user' as const

const userStore = useUserStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const isLoggingOut = ref(false)
const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const username = computed(() => userStore.username || 'Kind Guest')

const userStatus = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode'

  return `${userStore.role} · User #${userStore.userId}`
})

const managerSummary = computed(() => {
  return `${username.value}. ${userStatus.value}. Karma: ${userStore.karma}, mana: ${userStore.mana}, match record: ${userStore.matchRecord}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'servers') {
    serverStore.setCurrentServerMode('selected')
  }
}

async function refreshManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh user data.'
  } finally {
    isLoadingManager.value = false
  }
}

onMounted(async () => {
  await refreshManagerData() // ← fires on mount, races kind-loader
  setTab(activeTab.value)
})

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await userStore.logout()
    navStore.setDashboardTab(dashboardKey, 'dashboard')
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
