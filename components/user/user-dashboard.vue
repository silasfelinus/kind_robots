<!-- /components/content/user/user-dashboard.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
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

    <!-- ── Main grid ───────────────────────────────────────────────────── -->
    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
    >
      <!-- Left: profile sidebar -->
      <aside class="flex min-h-0 w-full flex-col gap-3 overflow-y-auto">
        <!-- Avatar + username -->
        <div
          class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div class="relative">
            <user-avatar
              class="h-24 w-24 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-base-100"
            />
          </div>

          <div class="flex w-full flex-col items-center gap-1">
            <h2
              class="max-w-full truncate text-xl font-black text-base-content"
            >
              {{ user?.username || 'Kind Guest' }}
            </h2>
            <span v-if="isLoggedIn" class="badge badge-accent badge-sm">
              Logged in
            </span>
            <span v-else class="text-xs text-base-content/45"
              >Not logged in</span
            >
          </div>
        </div>

        <!-- Avatar upload -->
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="mb-2 flex items-center gap-1.5">
            <Icon name="kind-icon:camera" class="h-3.5 w-3.5 text-primary" />
            <span class="text-xs font-bold text-base-content/60"
              >Change Avatar</span
            >
          </div>
          <image-upload class="w-full" />
        </div>

        <!-- Widgets row -->
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="flex flex-wrap items-center justify-center gap-3">
            <jellybean-icon />
            <theme-icon class="flex flex-row" />
          </div>
        </div>

        <!-- Logout -->
        <button
          v-if="isLoggedIn"
          class="btn btn-outline w-full rounded-xl border-error/40 text-error hover:border-error hover:bg-error hover:text-error-content"
          type="button"
          @click="logout"
        >
          <Icon name="kind-icon:logout" class="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <!-- Right: main content -->
      <main class="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        <!-- Welcome banner -->
        <div
          class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
        >
          <Icon
            name="kind-icon:sparkles"
            class="h-5 w-5 shrink-0 text-primary"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-black text-base-content">
              Welcome back, {{ user?.username || 'traveller' }}
            </p>
            <p class="text-xs text-base-content/55">
              Keep the settings tidy. Let the galleries make a mess elsewhere.
            </p>
          </div>
        </div>

        <!-- Logged-in content -->
        <div
          v-if="isLoggedIn"
          class="grid min-h-0 flex-1 grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
        >
          <user-panel class="min-w-0" />
          <user-galleries class="min-w-0" />
          <card-picker />
        </div>

        <!-- Guest empty state -->
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
const isLoggedIn = computed(() => userStore.isLoggedIn)

function configureUserImageUpload() {
  imageUploadStore.setTarget({
    model: 'User',
    modelId: userStore.userId ?? userStore.user?.id ?? null,
    galleryName: 'avatarUploads',
    collectionLabel: 'avatars',
    promptString: '[UserAvatar]',
    path: '[UserAvatar]',
    buttonLabel: 'Upload avatar',
    icon: 'kind-icon:camera',
    showPreview: false,
    applyImage: async ({ artImageId, imageData }) => {
      if (!userStore.user?.id) return
      await userStore.updateUserInfo({
        id: userStore.user.id,
        artImageId,
        avatarImage: imageData ?? userStore.user.avatarImage ?? '',
      })
    },
  })
}

onMounted(() => {
  configureUserImageUpload()
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
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}
</script>
