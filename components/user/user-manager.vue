<!-- /components/content/user/user-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <!--
      NO ACCOUNT ROW HERE, and none teleported elsewhere either.

      This opened with a full-width `justify-end` strip holding Refresh and Log
      Out. Silas asked for that band to go (2026-08-10), so the pair moved into
      the header through kr-header-actions -- and when the header collapsed into
      the account hub they landed in its panel, beside the hub's own reload and
      logout. Silas, seeing that: "a refresh option that has the same icon as
      our full refresh, but I have no idea what it does, and ANOTHER logout
      button."

      Two controls doing a job the hub already does, two clicks from the
      controls that do it properly. So they are gone from here rather than moved
      again: the hub's Reload restarts the app (a superset of this page's
      store-level refresh) and its account menu owns logging out. This page
      still refreshes its own data on mount, which is what actually populated
      it -- the button was only ever a manual re-trigger.
    -->

    <div v-if="managerError" class="shrink-0 kr-note kr-note-error">
      {{ managerError }}
    </div>

    <div v-if="isLoadingManager" class="shrink-0 kr-panel-muted p-4">
      <span class="loading loading-spinner loading-sm" />
      <span class="ml-2">Loading user account details...</span>
    </div>

    <section
      v-if="activeTab === 'profile' && !isLoggedIn"
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-base-300 bg-base-200 p-8"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15"
        >
          <Icon name="kind-icon:user" class="h-8 w-8 text-primary" />
        </div>
        <h2 class="text-xl font-black text-base-content">Welcome, guest</h2>
        <p class="max-w-xs text-sm text-base-content/60">
          Log in to save your progress, set an avatar, and access your full
          account.
        </p>
      </div>
      <NuxtLink to="/login" class="btn btn-primary rounded-xl px-8">
        <Icon name="kind-icon:login" class="size-5" />
        Log In
      </NuxtLink>
    </section>

    <section
      v-else-if="activeTab === 'profile'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <user-dashboard class="min-h-0 flex-1" />
    </section>

    <section
      v-else-if="
        activeTab === 'avatars' ||
        activeTab === 'friends' ||
        activeTab === 'achievements'
      "
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
    >
      <div class="kr-scroll overscroll-contain p-4">
        <avatar-picker
          v-if="activeTab === 'avatars'"
          default-collection-label="avatars"
          :dismissible="true"
          @selected="onAvatarChosen"
          @close="closePicker"
        />
        <friend-gallery v-else-if="activeTab === 'friends'" />
        <achievement-gallery v-else />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'themes'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <theme-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'chats'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <chat-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        :show-header="false"
      />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center kr-note kr-note-warning"
    >
      Unknown user tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ArtImage } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import {
  getDashboardDefaultTab,
  getDashboardTabs,
  type DashboardKey,
} from '@/stores/helpers/dashboardHelper'

const dashboardKey = 'user' satisfies DashboardKey

type UserTab = (typeof validTabs)[number]

const validTabs = getDashboardTabs(dashboardKey).map((tab) => tab.key)
const fallbackTab = getDashboardDefaultTab(dashboardKey) as UserTab

const navStore = useNavStore()
const userStore = useUserStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const activeTab = computed<UserTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey)

  return validTabs.includes(selectedTab as UserTab)
    ? (selectedTab as UserTab)
    : fallbackTab
})

const isLoggedIn = computed(() => userStore.isLoggedIn)

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

function onAvatarChosen(_artImage: ArtImage): void {
  navStore.setDashboardTab(dashboardKey, 'profile', 'avatar chosen')
}

function closePicker(): void {
  navStore.setDashboardTab(dashboardKey, 'profile', 'avatar picker closed')
}
</script>
