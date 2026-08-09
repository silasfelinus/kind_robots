<!-- /components/content/user/user-dashboard.vue -->
<template>
  <section class="kr-surface gap-4 rounded-2xl bg-base-200 p-3 sm:p-4">
    <header
      class="kr-toolbar kr-panel-flat px-4 py-3"
    >
      <Icon name="kind-icon:sparkles" class="h-5 w-5 shrink-0 text-primary" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-base font-black text-base-content">
          {{ welcomeMessage }}
        </p>
        <p class="text-xs text-base-content/55">
          Karma, mana, achievements, and everything you've made — all in one
          place.
        </p>
      </div>

      <button
        v-if="!isGuest"
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        @click="introStore.open()"
      >
        <Icon name="kind-icon:map" class="h-4 w-4" />
        Replay intro
      </button>

      <NuxtLink
        v-if="isGuest"
        to="/login"
        class="btn btn-primary btn-sm rounded-xl"
      >
        <Icon name="kind-icon:login" class="h-4 w-4" />
        Sign in
      </NuxtLink>

      <button
        v-else
        class="btn btn-outline btn-sm rounded-xl border-error/40 text-error hover:border-error hover:bg-error hover:text-error-content"
        type="button"
        @click="logout"
      >
        <Icon name="kind-icon:logout" class="h-4 w-4" />
        Sign out
      </button>
    </header>

    <div class="kr-scroll">
      <div class="flex flex-col gap-4 pr-1">
        <div
          v-if="isGuest"
          class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
        >
          <span
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200 text-base-content/40"
          >
            <Icon name="kind-icon:user" class="h-8 w-8" />
          </span>

          <div>
            <p class="text-lg font-black text-base-content">Guest mode.</p>
            <p class="mt-1 text-sm text-base-content/55">
              Charming, mysterious, and tragically short on saved stuff.
            </p>
          </div>

          <NuxtLink to="/login" class="btn btn-secondary mt-2 rounded-xl">
            Go to login
          </NuxtLink>
        </div>

        <template v-else>
          <div
            class="grid w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
          >
            <aside class="flex w-full flex-col gap-3">
              <div
                class="flex flex-col items-center gap-3 kr-panel-flat p-4"
              >
                <user-avatar
                  class="h-24 w-24 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-base-100"
                />

                <div class="flex w-full flex-col items-center gap-1">
                  <h2 class="max-w-full truncate text-xl font-black text-base-content">
                    {{ displayName }}
                  </h2>

                  <span class="badge badge-accent badge-sm">Logged in</span>
                </div>
              </div>

              <div class="kr-panel-flat p-3">
                <div class="mb-2 flex items-center gap-1.5">
                  <Icon
                    name="kind-icon:camera"
                    class="h-3.5 w-3.5 text-primary"
                  />
                  <span class="text-xs font-bold text-base-content/60">
                    Change Avatar
                  </span>
                </div>

                <image-upload class="w-full" />
              </div>

              <div class="kr-panel-flat p-3">
                <div class="flex flex-wrap items-center justify-center gap-3">
                  <jellybean-icon />
                  <theme-icon class="flex flex-row" />
                </div>
              </div>
            </aside>

            <main class="flex min-w-0 flex-col gap-4">
              <animation-selector />

              <label
                class="flex cursor-pointer items-center justify-between gap-4 kr-panel-flat px-4 py-3"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning"
                  >
                    <Icon name="kind-icon:eye" class="h-5 w-5" />
                  </span>

                  <span class="min-w-0">
                    <span class="block font-black text-base-content">
                      Dashboard maturity toggle
                    </span>
                    <span class="block text-xs text-base-content/55">
                      Show a quick 18+ visibility control in the workspace
                      header. This preference stays in this browser.
                    </span>
                  </span>
                </span>

                <input
                  type="checkbox"
                  class="toggle toggle-warning shrink-0"
                  :checked="showDashboardMaturityToggle"
                  @change="onDashboardMaturityToggleChange"
                />
              </label>

              <!-- Karma / mana / achievements ─────────────────────────────── -->
              <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div
                  class="kr-panel-flat p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      name="kind-icon:jellybean"
                      class="h-5 w-5 text-accent"
                    />
                    <span class="text-sm font-black">Karma</span>
                  </div>

                  <p class="mt-2 text-2xl font-black text-accent">
                    {{ karmaStore.balance }}
                  </p>

                  <p class="mt-1 text-xs text-base-content/55">
                    {{ karmaStore.transactions.length }} recent
                    {{
                      karmaStore.transactions.length === 1
                        ? 'entry'
                        : 'entries'
                    }}
                  </p>

                  <NuxtLink
                    to="/wallet"
                    class="btn btn-ghost btn-xs mt-2 w-full rounded-xl"
                  >
                    Full history
                  </NuxtLink>
                </div>

                <div
                  class="kr-panel-flat p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      name="kind-icon:sparkles"
                      class="h-5 w-5 text-secondary"
                    />
                    <span class="text-sm font-black">Mana</span>
                  </div>

                  <p class="mt-2 text-2xl font-black text-secondary">
                    {{ manaStore.balance }}
                    <span class="text-sm font-bold text-base-content/45">
                      / {{ manaStore.cap }}
                    </span>
                  </p>

                  <progress
                    class="progress progress-secondary mt-2 w-full"
                    :value="manaStore.pct"
                    max="100"
                  />

                  <p class="mt-1 text-xs text-base-content/55">
                    {{
                      manaStore.refillReady
                        ? 'Refill ready'
                        : `Refills in ${manaStore.refillCountdown}`
                    }}
                  </p>
                </div>

                <div
                  class="kr-panel-flat p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      name="kind-icon:trophy"
                      class="h-5 w-5 text-success"
                    />
                    <span class="text-sm font-black">Achievements</span>
                  </div>

                  <p class="mt-2 text-2xl font-black text-success">
                    {{ earnedAchievements.length }}
                  </p>

                  <p class="mt-1 text-xs text-base-content/55">earned</p>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs mt-2 w-full rounded-xl"
                    @click="goToAchievementsTab"
                  >
                    See all
                  </button>
                </div>
              </div>

              <div
                v-if="earnedAchievements.length"
                class="kr-panel-flat p-3"
              >
                <p class="mb-2 text-xs font-black uppercase tracking-widest text-base-content/50">
                  Recent achievements
                </p>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <EarnedAchievementCard
                    v-for="earned in recentAchievements"
                    :key="earned.id"
                    :achievement="earned"
                    :acquired-at="earned.acquiredAt"
                  />
                </div>
              </div>

              <!-- Theme / maturity / server preferences ───────────────────── -->
              <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div
                  class="flex flex-col gap-2 kr-panel-flat p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      name="kind-icon:paintbrush"
                      class="h-5 w-5 text-primary"
                    />
                    <span class="text-sm font-black">Theme</span>
                  </div>

                  <p class="truncate text-sm text-base-content/70">
                    {{ themeStore.currentTheme }}
                  </p>

                  <button
                    type="button"
                    class="btn btn-ghost btn-xs w-full rounded-xl"
                    @click="goToThemesTab"
                  >
                    Change theme
                  </button>
                </div>

                <div
                  class="flex flex-col gap-2 kr-panel-flat p-4"
                >
                  <label class="flex cursor-pointer items-center gap-2">
                    <Icon name="kind-icon:eye" class="h-5 w-5 text-warning" />
                    <span class="text-sm font-black">Show mature content</span>
                  </label>

                  <p class="text-xs text-base-content/55">
                    Reveal content flagged mature while you browse.
                  </p>

                  <label
                    class="flex items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
                  >
                    <span class="text-xs font-bold">
                      {{ showMature ? 'On' : 'Off' }}
                    </span>
                    <input
                      type="checkbox"
                      class="toggle toggle-warning"
                      :checked="showMature"
                      :disabled="accountStore.isSaving"
                      @change="onMatureToggle"
                    />
                  </label>
                </div>

                <div
                  class="flex flex-col gap-2 kr-panel-flat p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon
                      name="kind-icon:server"
                      class="h-5 w-5 text-info"
                    />
                    <span class="text-sm font-black">Server preferences</span>
                  </div>

                  <p class="text-xs text-base-content/55">
                    Pick default art/text generation servers.
                  </p>

                  <server-selector />
                </div>
              </div>

              <div
                class="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
              >
                <user-panel class="min-w-0" />
                <user-galleries class="min-w-0" />
                <cache-clear />
                <card-picker />
              </div>
            </main>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useIntroStore } from '@/stores/introStore'
import { useKarmaStore } from '@/stores/karmaStore'
import { useManaStore } from '@/stores/manaStore'
import { useMaturityPreferenceStore } from '@/stores/maturityPreferenceStore'
import { useNavStore } from '@/stores/navStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUploadStore } from '@/stores/uploadStore'
import { useUserStore } from '@/stores/userStore'

const maturityPreferenceStore = useMaturityPreferenceStore()
const userStore = useUserStore()
const imageUploadStore = useUploadStore()
const accountStore = useAccountStore()
const introStore = useIntroStore()
const karmaStore = useKarmaStore()
const manaStore = useManaStore()
const achievementStore = useAchievementStore()
const themeStore = useThemeStore()
const navStore = useNavStore()

const user = computed(() => userStore.user)
const isGuest = computed(() => userStore.isGuest)
const showDashboardMaturityToggle = computed(
  () => maturityPreferenceStore.showDashboardMaturityToggle,
)
const showMature = computed(() => Boolean(user.value?.showMature))

const displayName = computed(() => {
  return isGuest.value ? 'Kind Guest' : user.value?.username || 'Kind User'
})

const welcomeMessage = computed(() => {
  return isGuest.value
    ? 'Welcome, mysterious traveller'
    : `Welcome back, ${user.value?.username || 'traveller'}`
})

type EarnedAchievement = (typeof achievementStore.achievements)[number] & {
  acquiredAt: string | null
}

const earnedAchievements = computed<EarnedAchievement[]>(() => {
  const uid = userStore.userId
  if (!uid) return []

  const achievementById = new Map(
    achievementStore.achievements.map((achievement) => [
      achievement.id,
      achievement,
    ]),
  )

  const earned: EarnedAchievement[] = []

  for (const record of achievementStore.achievementRecords) {
    if (record.userId !== uid) continue

    const achievementId = record.achievementId
    if (achievementId == null) continue

    const achievement = achievementById.get(achievementId)
    if (!achievement) continue

    earned.push({
      ...achievement,
      acquiredAt: record.createdAt ? String(record.createdAt) : null,
    })
  }

  return earned.sort((a, b) => {
    return (b.acquiredAt || '').localeCompare(a.acquiredAt || '')
  })
})

const recentAchievements = computed(() => earnedAchievements.value.slice(0, 4))

function goToAchievementsTab(): void {
  navStore.setDashboardTab('user', 'achievements', 'dashboard summary')
}

function goToThemesTab(): void {
  navStore.setDashboardTab('user', 'themes', 'dashboard summary')
}

async function onMatureToggle(event: Event): Promise<void> {
  const checked = (event.target as HTMLInputElement).checked
  await accountStore.updateConsent({ showMature: checked })
}

function configureUserImageUpload() {
  if (isGuest.value || !userStore.user?.id) return

  imageUploadStore.setAvatarTarget({ userId: userStore.user.id })
}

function onDashboardMaturityToggleChange(event: Event): void {
  maturityPreferenceStore.setShowDashboardMaturityToggle(
    (event.target as HTMLInputElement).checked,
  )
}

onMounted(() => {
  maturityPreferenceStore.initialize()
  configureUserImageUpload()

  if (!isGuest.value) {
    void karmaStore.fetch()
    void manaStore.fetch()
    void achievementStore.fetchAchievements()
    void achievementStore.fetchAchievementRecords()
  }
})

onUnmounted(() => {
  imageUploadStore.clearTarget()
})

watch(
  () => userStore.user?.id,
  () => {
    configureUserImageUpload()
  },
)

const logout = async () => {
  try {
    await userStore.logout()
    await navigateTo('/login', { replace: true })
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}
</script>
