<!-- /components/content/user/user-dashboard.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-3 sm:p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-200 p-4 text-center"
    >
      <h1 class="text-2xl font-black text-base-content">User Dashboard</h1>
      <p class="mt-1 text-sm text-base-content/60">
        Profile, avatar, settings, and your magnificent heap of creations.
      </p>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
    >
      <aside
        class="flex min-h-0 w-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <div
          class="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <user-avatar class="h-24 w-24 rounded-full border-2 border-accent" />

          <h2
            class="max-w-full truncate rounded-2xl border border-accent bg-base-300 px-3 py-2 text-lg font-black"
          >
            {{ user?.username || 'Kind Guest' }}
          </h2>

          <p v-if="!isLoggedIn" class="text-sm text-base-content/50">
            Not logged in
          </p>
        </div>

        <div class="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-3">
          <image-upload class="w-full" />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="flex flex-wrap items-center justify-center gap-3">
            <jellybean-icon />
            <theme-toggle class="flex flex-row" />
          </div>
        </div>

        <button
          v-if="isLoggedIn"
          class="btn btn-warning w-full rounded-xl text-lg"
          type="button"
          @click="logout"
        >
          Logout
        </button>
      </aside>

      <main class="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <p class="text-lg font-bold">
            Welcome, {{ user?.username || 'Guest' }}
          </p>
          <p class="text-sm text-base-content/60">
            Keep the settings tidy. Let the galleries make a mess elsewhere.
          </p>
        </div>

        <div
          v-if="isLoggedIn"
          class="grid min-h-0 flex-1 grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
        >
          <user-panel class="min-w-0" />
          <user-galleries class="min-w-0" />
        </div>

        <div
          v-else
          class="flex min-h-64 items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center"
        >
          <div>
            <p class="text-lg font-black">Guest mode activated.</p>
            <p class="mt-1 text-sm text-base-content/60">
              Charming, mysterious, and tragically short on saved stuff.
            </p>
          </div>
        </div>
      </main>
    </div>
  </section>
</template>

<script lang="ts" setup>
// /components/content/user/user-dashboard.vue
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
