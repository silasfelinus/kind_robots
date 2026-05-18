<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-w-0 items-center gap-2 overflow-hidden"
      >
        <section
          class="flex h-full min-w-0 shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-200 px-2"
        >
          <avatar-image
            class="h-9 w-9 shrink-0 rounded-2xl border border-primary object-cover"
          />

          <div class="hidden min-w-0 sm:block">
            <p class="max-w-24 truncate text-sm font-bold">{{ username }}</p>
            <p class="max-w-24 truncate text-xs text-base-content/60">
              {{ userStore.role }}
            </p>
          </div>
        </section>

        <section
          class="flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-2xl border border-base-300 bg-base-200 px-2"
        >
          <button
            v-for="link in footerLinks"
            :key="link.key"
            type="button"
            class="btn btn-xs sm:btn-sm min-w-12 shrink-0 rounded-2xl px-2"
            :class="activeButtonClass(link.key)"
            :title="link.label"
            @click="selectUserTab(link.key)"
          >
            <icon :name="link.icon" class="h-4 w-4 shrink-0" />
            <span class="hidden md:inline">{{ link.shortLabel }}</span>
          </button>
        </section>
      </div>
    </template>

    <template v-else-if="isPriority">
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div
            class="flex min-h-0 flex-col items-center justify-center gap-3 text-center"
          >
            <avatar-image
              class="h-24 w-24 rounded-full border-4 border-primary object-cover shadow-lg"
            />
            <div class="min-w-0">
              <h2 class="truncate text-xl font-black">{{ username }}</h2>
              <p class="text-sm text-base-content/60">{{ statusLine }}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-3">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-2xl bg-base-100 p-2 text-center"
            >
              <p class="truncate text-lg font-black" :class="stat.className">
                {{ stat.value }}
              </p>
              <p
                class="text-[0.65rem] uppercase tracking-wide text-base-content/50"
              >
                {{ stat.label }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            <button
              v-for="link in footerLinks"
              :key="link.key"
              type="button"
              class="group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border bg-base-100 p-3 text-center transition hover:border-primary hover:bg-primary/10"
              :class="cardButtonClass(link.key)"
              @click="selectUserTab(link.key)"
            >
              <icon
                :name="link.icon"
                class="h-7 w-7 text-primary transition group-hover:scale-110"
              />
              <span class="text-sm font-black">{{ link.label }}</span>
              <span class="line-clamp-2 text-xs text-base-content/55">
                {{ link.description }}
              </span>
            </button>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_minmax(0,1fr)] items-stretch gap-3 overflow-hidden"
      >
        <section
          class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-3"
        >
          <avatar-image
            class="h-14 w-14 rounded-2xl border border-primary object-cover"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-black">{{ username }}</p>
            <p class="truncate text-xs text-base-content/60">
              {{ statusLine }}
            </p>
          </div>
        </section>

        <section
          class="grid min-w-0 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-2 md:grid-cols-4 xl:grid-cols-7"
        >
          <button
            v-for="link in footerLinks"
            :key="link.key"
            type="button"
            class="group flex min-h-16 items-center gap-2 rounded-2xl border bg-base-100 px-3 py-2 text-left transition hover:border-primary hover:bg-primary/10"
            :class="cardButtonClass(link.key)"
            @click="selectUserTab(link.key)"
          >
            <icon :name="link.icon" class="h-5 w-5 shrink-0 text-primary" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-black">
                {{ link.label }}
              </span>
              <span class="line-clamp-1 text-xs text-base-content/55">
                {{ link.description }}
              </span>
            </span>
          </button>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/user-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'
import { useNavStore } from '@/stores/navStore'
import { dashboardConfigs } from '@/stores/helpers/dashboardHelper'

type UserDashboardTab = (typeof dashboardConfigs.user.tabs)[number]['key']

type UserFooterLink = {
  label: string
  shortLabel: string
  key: UserDashboardTab
  icon: string
  description: string
}

const displayStore = useDisplayStore()
const userStore = useUserStore()
const navStore = useNavStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')

const username = computed(() => userStore.username || 'Kind Guest')

const statusLine = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode, chaos politely supervised'
  return `${userStore.role} · ${userStore.karma} karma · ${userStore.mana} mana`
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
    label: 'Role',
    value: userStore.role,
    className: 'text-accent',
  },
])

const footerLinks: UserFooterLink[] = [
  {
    label: 'Dashboard',
    shortLabel: 'Dash',
    key: 'dashboard',
    icon: 'kind-icon:user',
    description: 'Profile, avatar, account basics',
  },
  {
    label: 'Subscription',
    shortLabel: 'Sub',
    key: 'subscription',
    icon: 'kind-icon:jellybean',
    description: 'Plans, credits, billing tools',
  },
  {
    label: 'Milestones',
    shortLabel: 'Goals',
    key: 'milestones',
    icon: 'kind-icon:trophy',
    description: 'Rewards, progress, achievements',
  },
  {
    label: 'Themes',
    shortLabel: 'Theme',
    key: 'themes',
    icon: 'kind-icon:palette',
    description: 'DaisyUI and custom site themes',
  },
  {
    label: 'Chats',
    shortLabel: 'Chats',
    key: 'chats',
    icon: 'kind-icon:chat',
    description: 'Conversations and chat galleries',
  },
  {
    label: 'Galleries',
    shortLabel: 'Art',
    key: 'galleries',
    icon: 'kind-icon:gallery',
    description: 'Collections, art, and visual chaos',
  },
]

function selectUserTab(tab: UserDashboardTab) {
  navStore.setDashboardTab('user', tab)
}

function activeButtonClass(tab: UserDashboardTab) {
  return navStore.getDashboardTab('user') === tab
    ? 'btn-primary scale-105'
    : 'btn-ghost bg-base-100'
}

function cardButtonClass(tab: UserDashboardTab) {
  return navStore.getDashboardTab('user') === tab
    ? 'border-primary bg-primary/10 text-primary shadow-sm'
    : 'border-base-300 text-base-content'
}
</script>
