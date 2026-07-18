<!-- /components/pages/home-feed.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto overscroll-contain p-3 sm:p-4"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-black text-base-content">
          {{ welcomeMessage }}
        </h1>
        <p class="text-xs text-base-content/55">
          Your recommended newsfeed is being built. Here's a preview of what's
          coming.
        </p>
      </div>

      <NuxtLink to="/dashboard" class="btn btn-outline btn-sm rounded-xl">
        <Icon name="kind-icon:dashboard" class="size-4" />
        Account &amp; settings
      </NuxtLink>
    </header>

    <div
      v-if="previewFeeds.length"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="feed in previewFeeds"
        :key="feed.slug"
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div class="flex items-center gap-2">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <Icon :name="feed.icon" class="size-4" />
          </span>
          <h2 class="min-w-0 truncate text-sm font-black text-base-content">
            {{ feed.title }}
          </h2>
          <span class="badge badge-ghost badge-sm ml-auto shrink-0">
            Coming soon
          </span>
        </div>

        <p class="text-xs text-base-content/60">
          {{ feed.description }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center"
    >
      <Icon name="kind-icon:sparkles" class="size-8 text-base-content/35" />
      <p class="text-sm font-semibold text-base-content/55">
        No feeds enabled yet — recommended feeds will appear here.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useFeedPreferenceStore } from '@/stores/feedPreferenceStore'

const userStore = useUserStore()
const feedPreferenceStore = useFeedPreferenceStore()

const isGuest = computed(() => userStore.isGuest)

const welcomeMessage = computed(() => {
  return isGuest.value
    ? 'Welcome, mysterious traveller'
    : `Welcome back, ${userStore.user?.username || 'traveller'}`
})

const previewFeeds = computed(() => feedPreferenceStore.enabledFeeds)

onMounted(() => {
  feedPreferenceStore.hydrate()
})
</script>
