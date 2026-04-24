<template>
  <section
    class="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl bg-base-300 p-3"
  >
    <header
      class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <div class="flex items-center gap-3">
        <avatar-image
          class="h-16 w-16 rounded-2xl border-2 border-primary object-cover"
        />
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black">{{ username }}</h1>
          <p class="truncate text-sm text-base-content/60">{{ userStatus }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl border border-base-300 bg-base-200 p-2 text-center"
        >
          <p class="truncate text-lg font-black" :class="stat.className">
            {{ stat.value }}
          </p>
          <p class="text-xs uppercase tracking-wide text-base-content/50">
            {{ stat.label }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <button
          v-if="userStore.isLoggedIn"
          type="button"
          class="btn btn-warning btn-sm"
          @click="logout"
        >
          Logout
        </button>
        <NuxtLink v-else to="/login" class="btn btn-primary btn-sm">
          Login
        </NuxtLink>
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden pt-3 xl:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <div class="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-1">
          <button
            v-for="section in sections"
            :key="section.key"
            type="button"
            class="flex items-center gap-3 rounded-2xl border p-3 text-left transition"
            :class="
              activeSection === section.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-base-300 bg-base-200 hover:border-primary/60'
            "
            @click="activeSection = section.key"
          >
            <icon :name="section.icon" class="h-5 w-5 shrink-0" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-black">{{
                section.label
              }}</span>
              <span
                class="hidden truncate text-xs text-base-content/55 xl:block"
                >{{ section.description }}</span
              >
            </span>
          </button>
        </div>

        <div
          class="mt-3 hidden min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 xl:block"
        >
          <p class="text-sm font-bold">User Control Deck</p>
          <p class="mt-2 text-sm text-base-content/60">
            One screen, many trapdoors. Pick a panel and pretend this was always
            organized.
          </p>
          <div class="mt-3">
            <jellybean-counter />
          </div>
        </div>
      </aside>

      <main
        class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <section
          v-if="activeSection === 'dashboard'"
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <div class="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="flex flex-col items-center gap-3 text-center">
                <avatar-image
                  class="h-32 w-32 rounded-full border-4 border-primary object-cover shadow-lg"
                />
                <avatar-upload class="h-16 w-16" />
                <div>
                  <h2 class="text-xl font-black">{{ username }}</h2>
                  <p class="text-sm text-base-content/60">
                    {{ userStore.user?.email || 'No email attached' }}
                  </p>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2">
                <NuxtLink
                  v-for="quickLink in quickLinks"
                  :key="quickLink.to"
                  :to="quickLink.to"
                  class="btn btn-sm"
                >
                  <icon :name="quickLink.icon" class="h-4 w-4" />
                  {{ quickLink.label }}
                </NuxtLink>
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <h2 class="text-xl font-black">Account Snapshot</h2>
                <div class="mt-3 grid gap-2 md:grid-cols-2">
                  <div
                    v-for="detail in accountDetails"
                    :key="detail.label"
                    class="rounded-2xl bg-base-100 p-3"
                  >
                    <p
                      class="text-xs uppercase tracking-wide text-base-content/50"
                    >
                      {{ detail.label }}
                    </p>
                    <p class="truncate text-base font-bold">
                      {{ detail.value }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
                <h2 class="text-xl font-black">Profile Tools</h2>
                <div class="mt-3 grid gap-3">
                  <user-panel />
                  <cache-clear />
                  <theme-toggle class="flex flex-row" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else-if="activeSection === 'subscription'"
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <subscription-manager />
        </section>

        <section
          v-else-if="activeSection === 'milestones'"
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
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
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <server-manager />
        </section>

        <section
          v-else-if="activeSection === 'themes'"
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <theme-manager />
        </section>

        <section
          v-else-if="activeSection === 'chats'"
          class="h-full min-h-0 overflow-y-auto p-3"
        >
          <chat-gallery />
        </section>

        <section
          v-else-if="activeSection === 'galleries'"
          class="h-full min-h-0 overflow-y-auto p-3"
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
const activeSection = ref<UserManagerSection>('dashboard')

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

const quickLinks = computed(() =>
  sections.map((section) => ({
    label: section.label,
    icon: section.icon,
    to: section.key === 'subscription' ? '/subscription' : `/${section.key}`,
  })),
)

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
  await userStore.logout()
}
</script>
