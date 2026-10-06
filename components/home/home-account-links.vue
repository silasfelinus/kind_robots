<template>
  <section class="kr-container p-4 sm:p-6">
    <div class="home-account-links-grid grid gap-3">
      <NuxtLink
        to="/plan/newsfeed"
        class="kr-panel flex min-h-32 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:news" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Newsfeed</h2>
          <p class="kr-text-dim-sm mt-1">
            Fresh art, stories, projects, and gathered updates in one stream.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">Open newsfeed →</span>
      </NuxtLink>

      <NuxtLink
        to="/friends"
        class="kr-panel flex min-h-32 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:users" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Friends</h2>
          <p class="kr-text-dim-sm mt-1">
            Friend requests, people, chats, messages, and blocks.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">Open friends →</span>
      </NuxtLink>

      <NuxtLink
        to="/build/animation-manager"
        class="kr-panel flex min-h-32 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:sparkles" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Animation Manager</h2>
          <p class="kr-text-dim-sm mt-1">
            Preview effects, layer favorites, and choose startup animations.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">
          Open animation manager →
        </span>
      </NuxtLink>

      <NuxtLink
        v-if="userStore.isAdmin"
        to="/user-admin"
        class="kr-panel flex min-h-32 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:users" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Users & Moderation</h2>
          <p class="kr-text-dim-sm mt-1">
            Manage accounts, permissions, and escalated forum posts.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">
          Open admin tools →
        </span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
</script>

<style scoped>
.home-account-links-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
}
</style>
