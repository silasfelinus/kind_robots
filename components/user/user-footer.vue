<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-w-0 items-center gap-2 overflow-x-auto"
      >
        <avatar-image
          class="h-10 w-10 shrink-0 rounded-2xl border border-primary object-cover"
        />

        <div class="min-w-0 shrink-0">
          <p class="truncate text-sm font-bold">{{ username }}</p>
          <p class="truncate text-xs text-base-content/60">{{ statusLine }}</p>
        </div>

        <button
          v-for="link in footerLinks"
          :key="link.key"
          type="button"
          class="btn btn-sm shrink-0"
          :class="navStore.userDashboardTab === link.key ? 'btn-primary' : ''"
          @click="selectUserTab(link.key)"
        >
          <icon :name="link.icon" class="h-4 w-4" />
          {{ link.label }}
        </button>
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
            <div class="rounded-2xl bg-base-100 p-2 text-center">
              <p class="text-lg font-black text-primary">
                {{ userStore.karma }}
              </p>
              <p
                class="text-[0.65rem] uppercase tracking-wide text-base-content/50"
              >
                Karma
              </p>
            </div>
            <div class="rounded-2xl bg-base-100 p-2 text-center">
              <p class="text-lg font-black text-secondary">
                {{ userStore.mana }}
              </p>
              <p
                class="text-[0.65rem] uppercase tracking-wide text-base-content/50"
              >
                Mana
              </p>
            </div>
            <div class="rounded-2xl bg-base-100 p-2 text-center">
              <p class="text-lg font-black text-accent">{{ userStore.role }}</p>
              <p
                class="text-[0.65rem] uppercase tracking-wide text-base-content/50"
              >
                Role
              </p>
            </div>
          </div>
        </section>

        <section
          class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button
              v-for="link in footerLinks"
              :key="link.key"
              type="button"
              class="btn btn-sm shrink-0"
              :class="
                navStore.userDashboardTab === link.key ? 'btn-primary' : ''
              "
              @click="selectUserTab(link.key)"
            >
              <icon :name="link.icon" class="h-4 w-4" />
              {{ link.label }}
              <icon
                :name="link.icon"
                class="h-7 w-7 text-primary transition group-hover:scale-110"
              />
              <span class="text-sm font-bold">{{ link.label }}</span>
              <span class="line-clamp-2 text-xs text-base-content/55">{{
                link.description
              }}</span>
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
          class="flex min-w-0 items-center gap-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200 px-3"
        >
          <button
            v-for="link in footerLinks"
            :key="link.key"
            type="button"
            class="btn btn-sm shrink-0"
            :class="navStore.userDashboardTab === link.key ? 'btn-primary' : ''"
            @click="selectUserTab(link.key)"
          >
            <icon :name="link.icon" class="h-4 w-4" />
            {{ link.label }}
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
import { useNavStore, type UserDashboardTab } from '@/stores/navStore'

type UserFooterLink = {
  label: string
  key: UserDashboardTab
  icon: string
  description: string
}

const displayStore = useDisplayStore()
const userStore = useUserStore()
const navStore = useNavStore()

function selectUserTab(tab: UserDashboardTab) {
  navStore.setUserDashboardTab(tab)
}

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')

const username = computed(() => userStore.username || 'Kind Guest')

const statusLine = computed(() => {
  if (!userStore.isLoggedIn) return 'Guest mode, chaos politely supervised'
  return `${userStore.role} · ${userStore.karma} karma · ${userStore.mana} mana`
})

const footerLinks: UserFooterLink[] = [
  {
    label: 'Dashboard',
    key: 'dashboard',
    icon: 'kind-icon:user',
    description: 'Profile, avatar, account basics',
  },
  {
    label: 'Subscription',
    key: 'subscription',
    icon: 'kind-icon:jellybean',
    description: 'Plans, credits, billing tools',
  },
  {
    label: 'Milestones',
    key: 'milestones',
    icon: 'kind-icon:trophy',
    description: 'Rewards, progress, achievements',
  },
  {
    label: 'Servers',
    key: 'servers',
    icon: 'kind-icon:server',
    description: 'AI endpoints and model backends',
  },
  {
    label: 'Themes',
    key: 'themes',
    icon: 'kind-icon:palette',
    description: 'DaisyUI and custom site themes',
  },
  {
    label: 'Chats',
    key: 'chats',
    icon: 'kind-icon:chat',
    description: 'Conversations and chat galleries',
  },
  {
    label: 'Galleries',
    key: 'galleries',
    icon: 'kind-icon:gallery',
    description: 'Collections, art, and visual chaos',
  },
]

const compactLinks = computed(() => footerLinks.slice(0, 4))
</script>
