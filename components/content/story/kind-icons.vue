<!-- /components/content/story/kind-icons.vue -->
<template>
  <div class="flex w-full items-center justify-end overflow-hidden">
    <div
      class="flex w-full items-center justify-end"
      :class="compact ? 'gap-1' : 'gap-2'"
    >
      <!-- Navigation Links -->
      <NuxtLink
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="group flex flex-col items-center justify-center flex-1 min-w-0 transition-all"
      >
        <Icon
          :name="link.icon"
          class="w-[clamp(1.5rem,4vw,3rem)] h-[clamp(1.5rem,4vw,3rem)] transition-transform transform hover:scale-110 duration-300 ease-in-out"
        />
        <div
          v-if="!compact"
          class="mt-1 text-center text-xs md:text-sm hidden md:block group-hover:block truncate w-full"
        >
          {{ link.title }}
        </div>
      </NuxtLink>

      <!-- Utility Icons (same flex behavior) -->
      <div class="flex flex-1 min-w-0 items-center justify-end gap-2">
        <login-path
          :compact="compact"
          class="flex-1 min-w-0 flex justify-center"
        />
        <jellybean-count
          :compact="compact"
          class="flex-1 min-w-0 flex justify-center"
        />
        <theme-icon
          :compact="compact"
          class="flex-1 min-w-0 flex justify-center"
        />
        <swarm-icon
          :compact="compact"
          class="flex-1 min-w-0 flex justify-center"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/kind-icons.vue
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'

defineProps<{ compact?: boolean }>()

const { navLinks } = storeToRefs(useLinkStore())
</script>
