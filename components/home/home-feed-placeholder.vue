<!-- /components/home/home-feed-placeholder.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-1"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div>
        <h1 class="text-lg font-black text-base-content sm:text-xl">
          {{ headline }}
        </h1>
        <p class="text-sm text-base-content/60">
          AI news, activism, and the rest of the swarm's activity, curated right
          here.
        </p>
      </div>

      <NuxtLink
        v-if="isLoggedIn"
        to="/dashboard"
        class="btn btn-primary btn-sm rounded-xl"
      >
        <Icon name="kind-icon:dashboard" class="size-4" />
        Dashboard
      </NuxtLink>
      <NuxtLink v-else to="/login" class="btn btn-primary btn-sm rounded-xl">
        <Icon name="kind-icon:login" class="size-4" />
        Log In
      </NuxtLink>
    </header>

    <NewsfeedFeed :initial-limit="9" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

const headline = computed(() =>
  isLoggedIn.value ? 'Welcome back' : 'Welcome, guest',
)
</script>
