<!-- /components/content/user/user-dashboard.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <header
      class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
      >
        <Icon name="kind-icon:user" class="h-5 w-5" />
      </span>

      <div class="min-w-0">
        <h1 class="text-xl font-black text-base-content">User Dashboard</h1>
        <p class="truncate text-xs text-base-content/55">
          Profile, avatar, settings, and your magnificent heap of creations.
        </p>
      </div>
    </header>

    <div
      class="grid w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
    >
      <aside class="flex w-full flex-col gap-3">
        <div
          class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div v-if="!isGuest" class="relative">
            <user-avatar
              class="h-24 w-24 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-base-100"
            />
          </div>

          <span
            v-else
            class="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-base-300 bg-base-200 text-base-content/35"
          >
            <Icon name="kind-icon:user" class="h-12 w-12" />
          </span>

          <div class="flex w-full flex-col items-center gap-1">
            <h2
              class="max-w-full truncate text-xl font-black text-base-content"
            >
              {{ displayName }}
            </h2>

            <span v-if="!isGuest" class="badge badge-accent badge-sm">
              Logged in
            </span>

            <span v-else class="text-xs text-base-content/45">
              Guest mode
            </span>
          </div>
        </div>

        <div
          v-if="!isGuest"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-2 flex items-center gap-1.5">
            <Icon name="kind-icon:camera" class="h-3.5 w-3.5 text-primary" />
            <span class="text-xs font-bold text-base-content/60">
              Change Avatar
            </span>
          </div>

          <image-upload class="w-full" />
        </div>

        <div
          v-if="!isGuest"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex flex-wrap items-center justify-center gap-3">
            <jellybean-icon />
            <theme-icon class="flex flex-row" />
          </div>
        </div>

        <NuxtLink
          v-if="isGuest"
          to="/login"
          class="btn btn-primary w-full rounded-xl"
        >
          <Icon name="kind-icon:login" class="h-4 w-4" />
          Sign in
        </NuxtLink>

        <button
          v-else
          class="btn btn-outline w-full rounded-xl border-error/40 text-error hover:border-error hover:bg-error hover:text-error-content"
          type="button"
          @click="logout"
        >
          <Icon name="kind-icon:logout" class="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <main class="flex min-w-0 flex-col gap-4">
        <div
          class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
        >
          <Icon
            name="kind-icon:sparkles"
            class="h-5 w-5 shrink-0 text-primary"
          />

          <div class="min-w-0">
            <p class="truncate text-base font-black text-base-content">
              {{ welcomeMessage }}
            </p>

            <p class="text-xs text-base-content/55">
              Keep the settings tidy. Let the galleries make a mess elsewhere.
            </p>
          </div>
        </div>

        <animation-selector />

        <div
          v-if="!isGuest"
          class="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
        >
          <user-panel class="min-w-0" />
          <user-galleries class="min-w-0" />
          <cache-clear />
          <card-picker />
        </div>

        <div
          v-else
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
      </main>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useUploadStore } from '@/stores/uploadStore'

const userStore = useUserStore()
const imageUploadStore = useUploadStore()

const user = computed(() => userStore.user)
const isGuest = computed(() => userStore.isGuest)

const displayName = computed(() => {
  return isGuest.value ? 'Kind Guest' : user.value?.username || 'Kind User'
})

const welcomeMessage = computed(() => {
  return isGuest.value
    ? 'Welcome, mysterious traveller'
    : `Welcome back, ${user.value?.username || 'traveller'}`
})

function configureUserImageUpload() {
  if (isGuest.value || !userStore.user?.id) return

  imageUploadStore.setAvatarTarget({ userId: userStore.user.id })
}

onMounted(() => {
  configureUserImageUpload()
})

watch(
  () => userStore.user?.id,
  () => {
    configureUserImageUpload()
  }
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
