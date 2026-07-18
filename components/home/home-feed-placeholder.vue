<!-- /components/home/home-feed-placeholder.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 rounded-2xl border border-base-300 bg-base-200 p-8 text-center"
  >
    <div
      class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15"
    >
      <Icon name="kind-icon:scroll" class="h-8 w-8 text-primary" />
    </div>

    <div class="flex max-w-md flex-col items-center gap-2">
      <h1 class="text-xl font-black text-base-content">
        {{ headline }}
      </h1>
      <p class="text-sm text-base-content/60">
        The recommended newsfeed is on its way — AI news, activism, and the rest
        of the swarm's activity, curated right here. Until it lands, here's
        where to go next.
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-3">
      <NuxtLink
        v-if="isLoggedIn"
        to="/dashboard"
        class="btn btn-primary rounded-xl px-6"
      >
        <Icon name="kind-icon:dashboard" class="size-4" />
        Go to your Dashboard
      </NuxtLink>

      <NuxtLink v-else to="/login" class="btn btn-primary rounded-xl px-6">
        <Icon name="kind-icon:login" class="size-4" />
        Log In
      </NuxtLink>

      <NuxtLink to="/newsfeed" class="btn btn-ghost rounded-xl px-6">
        <Icon name="kind-icon:news" class="size-4" />
        Preview the Newsfeed Lab
      </NuxtLink>
    </div>
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
