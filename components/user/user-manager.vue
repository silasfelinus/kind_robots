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
        <div class="card rounded-2xl border border-base-300 bg-base-200">
          <div class="card-body gap-3">
            <div class="flex items-center gap-3">
              <user-avatar class="size-14" />

              <div>
                <h2 class="text-xl font-semibold">{{ username }}</h2>

                <p class="text-sm text-base-content/60">
                  {{ userStatus }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div
                v-for="stat in stats"
                :key="stat.label"
                class="stat rounded-box bg-base-100 p-3"
              >
                <div class="stat-title text-xs">{{ stat.label }}</div>

                <div class="stat-value text-lg" :class="stat.className">
                  {{ stat.value }}
                </div>
              </div>
            </div>

            <div class="divider my-1" />

            <ul class="space-y-2">
              <li
                v-for="detail in accountDetails"
                :key="detail.label"
                class="flex justify-between gap-3 text-sm"
              >
                <span class="text-base-content/60">{{ detail.label }}</span>
                <span class="text-right font-medium">{{ detail.value }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        v-else-if="currentTab === 'subscription'"
        class="rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <subscription-manager />>
      </section>

      <section
        v-else-if="currentTab === 'milestones'"
        class="rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <milestone-gallery />>
      </section>

      <theme-gallery v-else-if="currentTab === 'themes'" :show-header="false" />

      <chat-gallery v-else-if="currentTab === 'chats'" :show-header="false" />

      <gallery-gallery
        v-else-if="currentTab === 'galleries'"
        :show-header="false"
      />

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

const username = computed(() => {
  return userStore.username || 'Kind Guest'
})

const userStatus = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode'

  return `${userStore.role} · User #${userStore.userId}`
})

const stats = computed(() => {
  return [
    {
      label: 'Karma',
      value: userStore.karma,
      className: 'text-primary',
    },
    {
      label: 'Mana',
      value: userStore.mana,
      className: 'text-secondary',
    },
    {
      label: 'Record',
      value: userStore.matchRecord,
      className: 'text-accent',
    },
  ]
})

const accountDetails = computed(() => {
  return [
    {
      label: 'Username',
      value: userStore.username || 'Kind Guest',
    },
    {
      label: 'Email',
      value: userStore.user?.email || 'Not set',
    },
    {
      label: 'Role',
      value: userStore.role,
    },
    {
      label: 'User ID',
      value: userStore.userId,
    },
    {
      label: 'Mature Content',
      value: userStore.showMature ? 'Enabled' : 'Disabled',
    },
    {
      label: 'Click Record',
      value: userStore.clickRecord,
    },
  ]
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

async function refreshManagerData() {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      serverStore.initialize({
        fetchRemote: true,
      }),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh user data.'
  } finally {
    isLoadingManager.value = false
  }
}

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

onMounted(async () => {
  await refreshManagerData()
  setTab(activeTab.value)
})
</script>
