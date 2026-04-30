<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-base-300 text-base-content"
  >
    <header
      class="shrink-0 rounded-b-2xl border-b border-base-300 bg-base-100 p-2 shadow-sm sm:p-3"
    >
      <div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <div class="flex min-w-0 items-center gap-2 sm:gap-3">
            <div class="relative shrink-0">
              <avatar-image
                class="h-20 w-20 rounded-2xl border-2 border-primary object-cover shadow-md sm:h-24 sm:w-24"
              />
              <div class="absolute bottom-1 right-1">
                <avatar-upload />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h1
                class="max-w-full wrap-break-word text-xl font-black leading-tight sm:text-2xl"
              >
                {{ username }}
              </h1>
              <p
                class="mt-1 wrap-break-word text-xs text-base-content/60 sm:text-sm"
              >
                {{ userStatus }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end"
        >
          <button
            v-if="userStore.isLoggedIn"
            type="button"
            class="btn btn-warning btn-sm min-h-11 rounded-2xl sm:px-5"
            :disabled="isLoggingOut"
            @click="logout"
          >
            <icon name="kind-icon:logout" class="h-5 w-5" />
            <span>{{ isLoggingOut ? 'Logging out...' : 'Logout' }}</span>
          </button>

          <NuxtLink
            v-else
            to="/login"
            class="btn btn-primary btn-sm min-h-11 rounded-2xl sm:px-5"
          >
            <icon name="kind-icon:login" class="h-5 w-5" />
            <span>Login</span>
          </NuxtLink>

          <NuxtLink
            to="/"
            class="btn btn-ghost btn-sm min-h-11 rounded-2xl sm:px-5"
          >
            <icon name="kind-icon:home" class="h-5 w-5" />
            <span>Home</span>
          </NuxtLink>
        </div>
      </div>

      <div class="mt-2 grid grid-cols-3 gap-2">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="min-w-0 rounded-2xl border border-base-300 bg-base-200 px-2 py-2 text-center"
        >
          <p
            class="truncate text-base font-black sm:text-lg"
            :class="stat.className"
          >
            {{ stat.value }}
          </p>
          <p
            class="truncate text-[0.65rem] uppercase tracking-wide text-base-content/50 sm:text-xs"
          >
            {{ stat.label }}
          </p>
        </div>
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[17rem_minmax(0,1fr)]"
    >
      <aside
        class="shrink-0 overflow-hidden border-b border-base-300 bg-base-100 xl:min-h-0 xl:border-b-0 xl:border-r"
      >
        <nav
          class="flex gap-2 overflow-x-auto p-2 xl:h-full xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden"
        >
          <button
            v-for="section in sections"
            :key="section.key"
            type="button"
            class="flex min-w-32 shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition xl:min-w-0 xl:w-full xl:gap-3 xl:p-3"
            :class="
              activeSection === section.key
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-base-300 bg-base-200 hover:border-primary/60'
            "
            @click="activeSection = section.key"
          >
            <icon :name="section.icon" class="h-5 w-5 shrink-0" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-black">
                {{ section.label }}
              </span>
              <span
                class="hidden truncate text-xs text-base-content/55 xl:block"
              >
                {{ section.description }}
              </span>
            </span>
          </button>
        </nav>
      </aside>

      <main class="min-h-0 overflow-hidden bg-base-100">
        <section
          v-if="activeSection === 'dashboard'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div class="grid min-w-0 gap-3">
              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-4"
              >
                <h2 class="text-xl font-black">Account Snapshot</h2>

                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <div
                    v-for="detail in accountDetails"
                    :key="detail.label"
                    class="min-w-0 rounded-2xl bg-base-100 p-3"
                  >
                    <p
                      class="text-xs uppercase tracking-wide text-base-content/50"
                    >
                      {{ detail.label }}
                    </p>
                    <p class="wrap-break-word text-base font-bold">
                      {{ detail.value }}
                    </p>
                  </div>
                </div>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-4"
              >
                <h2 class="text-xl font-black">Profile Tools</h2>

                <div class="mt-3 grid gap-3">
                  <user-panel />
                  <cache-clear />
                  <theme-toggle class="flex flex-row" />

                  <button
                    v-if="userStore.isLoggedIn"
                    type="button"
                    class="btn btn-warning min-h-12 w-full rounded-2xl"
                    :disabled="isLoggingOut"
                    @click="logout"
                  >
                    <icon name="kind-icon:logout" class="h-5 w-5" />
                    <span>{{
                      isLoggingOut ? 'Logging out...' : 'Logout'
                    }}</span>
                  </button>

                  <NuxtLink
                    v-else
                    to="/login"
                    class="btn btn-primary min-h-12 w-full rounded-2xl"
                  >
                    <icon name="kind-icon:login" class="h-5 w-5" />
                    <span>Login</span>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <div class="grid min-w-0 gap-3 xl:content-start">
              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-4"
              >
                <h2 class="text-lg font-black">Quick Jump</h2>

                <div class="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
                  <button
                    v-for="section in sections"
                    :key="`quick-${section.key}`"
                    type="button"
                    class="btn btn-sm min-h-11 rounded-2xl"
                    :class="
                      activeSection === section.key
                        ? 'btn-primary'
                        : 'btn-ghost bg-base-100'
                    "
                    @click="activeSection = section.key"
                  >
                    <icon :name="section.icon" class="h-5 w-5" />
                    <span class="truncate">{{ section.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="activeSection === 'subscription'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <subscription-manager />
        </section>

        <section
          v-else-if="activeSection === 'milestones'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-4"
          >
            <h2 class="text-2xl font-black">Milestones</h2>
            <p class="mt-1 text-sm text-base-content/60">
              Rewards, progress, jellybeans, and dopamine with better branding.
            </p>

            <div class="mt-4">
              <jellybean-counter />
            </div>
          </div>
        </section>

        <section
          v-else-if="activeSection === 'servers'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <server-manager />
        </section>

        <section
          v-else-if="activeSection === 'themes'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <theme-manager />
        </section>

        <section
          v-else-if="activeSection === 'chats'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <chat-gallery />
        </section>

        <section
          v-else-if="activeSection === 'galleries'"
          class="h-full min-h-0 overflow-y-auto p-2 sm:p-3"
        >
          <gallery-gallery />
        </section>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/user/user-manager.vue
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'
import type { UserDashboardTab } from '@/stores/navStore'

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

const activeSection = computed({
  get: () => navStore.userDashboardTab,
  set: (tab: UserDashboardTab) => navStore.setUserDashboardTab(tab),
})

const username = computed(() => userStore.username || 'Kind Guest')

const userStatus = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode'
  return `${userStore.role} · User #${userStore.userId}`
})

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

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await userStore.logout()
    navStore.setUserDashboardTab('dashboard')
    await navigateTo('/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>
