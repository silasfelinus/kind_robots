<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Section Nav -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="section in sections"
        :key="section.key"
        class="btn btn-sm gap-2"
        :class="activeSection === section.key ? 'btn-primary' : 'btn-ghost'"
        @click="activeSection = section.key"
      >
        <Icon :name="section.icon" class="size-4" />
        {{ section.label }}
      </button>
    </div>

    <!-- Dashboard -->
    <div v-if="activeSection === 'dashboard'" class="flex flex-col gap-4">
      <div class="card bg-base-200">
        <div class="card-body gap-3">
          <div class="flex items-center gap-3">
            <user-avatar class="size-14" />
            <div>
              <h2 class="text-xl font-semibold">{{ username }}</h2>
              <p class="text-sm text-base-content/60">{{ userStatus }}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="stat bg-base-100 rounded-box p-3"
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
              class="flex justify-between text-sm"
            >
              <span class="text-base-content/60">{{ detail.label }}</span>
              <span class="font-medium">{{ detail.value }}</span>
            </li>
          </ul>

          <div class="card-actions justify-end pt-2">
            <button
              class="btn btn-error btn-sm"
              :disabled="isLoggingOut"
              @click="logout"
            >
              <span
                v-if="isLoggingOut"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:logout" class="size-4" />
              {{ isLoggingOut ? 'Logging out…' : 'Log Out' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription -->
    <div v-else-if="activeSection === 'subscription'" class="card bg-base-200">
      <div class="card-body">
        <h3 class="card-title text-base">Subscription</h3>
        <p class="text-sm text-base-content/60">
          Plans, credits, and billing coming soon.
        </p>
      </div>
    </div>

    <!-- Milestones -->
    <div v-else-if="activeSection === 'milestones'" class="card bg-base-200">
      <div class="card-body">
        <h3 class="card-title text-base">Milestones</h3>
        <p class="text-sm text-base-content/60">
          Achievements and progress tracking coming soon.
        </p>
      </div>
    </div>

    <!-- Servers -->
    <div v-else-if="activeSection === 'servers'">
      <server-gallery />
    </div>

    <!-- Themes -->
    <div v-else-if="activeSection === 'themes'">
      <theme-gallery />
    </div>

    <!-- Chats -->
    <div v-else-if="activeSection === 'chats'">
      <chat-gallery />
    </div>

    <!-- Galleries -->
    <div v-else-if="activeSection === 'galleries'">
      <gallery-gallery />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/user/user-manager.vue
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'

type UserManagerSection =
  | 'dashboard'
  | 'subscription'
  | 'milestones'
  | 'servers'
  | 'themes'
  | 'chats'
  | 'galleries'

type ManagerSection = {
  key: UserManagerSection
  label: string
  icon: string
  description: string
}

const userStore = useUserStore()
const navStore = useNavStore()

const isLoggingOut = ref(false)

const sections: ManagerSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'kind-icon:user',
    description: 'Profile and account basics',
  },
  {
    key: 'subscription',
    label: 'Subscription',
    icon: 'kind-icon:jellybean',
    description: 'Plans, credits, receipts',
  },
  {
    key: 'milestones',
    label: 'Milestones',
    icon: 'kind-icon:trophy',
    description: 'Rewards and progress',
  },
  {
    key: 'servers',
    label: 'Servers',
    icon: 'kind-icon:server',
    description: 'Backend endpoints',
  },
  {
    key: 'themes',
    label: 'Themes',
    icon: 'kind-icon:palette',
    description: 'DaisyUI and custom themes',
  },
  {
    key: 'chats',
    label: 'Chats',
    icon: 'kind-icon:chat',
    description: 'Conversation galleries',
  },
  {
    key: 'galleries',
    label: 'Galleries',
    icon: 'kind-icon:gallery',
    description: 'Collections and art',
  },
]

const activeSection = computed<UserManagerSection>({
  get: () => {
    const tab = navStore.getDashboardTab('user')

    if (isUserManagerSection(tab)) {
      return tab
    }

    return 'dashboard'
  },
  set: (tab: UserManagerSection) => {
    navStore.setDashboardTab('user', tab)
  },
})

const username = computed(() => userStore.username || 'Kind Guest')

const userStatus = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode'
  return `${userStore.role} · User #${userStore.userId}`
})

const stats = computed(() => [
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
])

const accountDetails = computed(() => [
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
])

function isUserManagerSection(value: string): value is UserManagerSection {
  return sections.some((section) => section.key === value)
}

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await userStore.logout()
    navStore.setDashboardTab('user', 'dashboard')
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
