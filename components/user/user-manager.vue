<!-- /components/content/user/user-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <!--
      THESE THREE USED TO BE A ROW OF THEIR OWN, right here, as a full-width
      `justify-end` strip above the account panes. Silas, 2026-08-10: "Same dead
      band holds refresh and log out on some pages. Fold them into the header
      row too, so there is no strip between header and content."

      The strip carried two buttons and about 300px of nothing, on /dashboard,
      /themes and /achievements — and the floating "?" landed on top of it,
      which is how it got photographed. kr-header-actions teleports them into
      the header's control strip, so the capability stays and the band is gone;
      see that component for why a teleport rather than a store of descriptors
      (Log Out has its own busy state, and descriptors cannot carry one).

      Labels are `hidden xl:inline`, and `xl` rather than `sm` is a measured
      number, not a guess. Labelled, these two stand at 102px and 92px; icon-
      only they are 46px each. The channel tab strip is the one shrinkable thing
      in this row and it was already sitting on its own min-width floor at 768px
      (112px, one tab) with them labelled — so showing text here spends 100px
      the navigation does not have until the row is genuinely wide. At xl the
      strip has 600px+ and can afford it.

      The icons carry the meaning below that, and both buttons keep their full
      text in `title`/`aria-label`, so nothing is lost to a screen reader or a
      hover.
    -->
    <kr-header-actions>
      <button
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        :disabled="isLoadingManager"
        title="Refresh account data"
        aria-label="Refresh account data"
        @click="refreshManagerData(true)"
      >
        <span
          v-if="isLoadingManager"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
        <span class="hidden xl:inline">Refresh</span>
      </button>

      <NuxtLink
        v-if="!isLoggedIn"
        to="/login"
        class="btn btn-primary btn-sm rounded-xl"
        title="Log in"
        aria-label="Log in"
      >
        <Icon name="kind-icon:login" class="size-4" />
        <span class="hidden xl:inline">Log In</span>
      </NuxtLink>

      <button
        v-else
        class="btn btn-error btn-sm rounded-xl"
        type="button"
        :disabled="isLoggingOut"
        :title="isLoggingOut ? 'Logging out…' : 'Log out'"
        :aria-label="isLoggingOut ? 'Logging out…' : 'Log out'"
        @click="logout"
      >
        <span v-if="isLoggingOut" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:logout" class="size-4" />
        <span class="hidden xl:inline">
          {{ isLoggingOut ? 'Logging out…' : 'Log Out' }}
        </span>
      </button>
    </kr-header-actions>

    <div
      v-if="managerError"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
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
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
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

const isLoggingOut = ref(false)
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

async function logout(): Promise<void> {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    userStore.logout()
    await navigateTo('/login', { replace: true })
  } finally {
    isLoggingOut.value = false
  }
}

function onAvatarChosen(_artImage: ArtImage): void {
  navStore.setDashboardTab(dashboardKey, 'profile', 'avatar chosen')
}

function closePicker(): void {
  navStore.setDashboardTab(dashboardKey, 'profile', 'avatar picker closed')
}
</script>
