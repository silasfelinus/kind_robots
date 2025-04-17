<!-- /components/content/story/kind-icons.vue -->
<template>
  <div class="flex flex-wrap gap-2 items-center justify-end w-full">
    <!-- Navigation Links -->
    <div class="flex flex-wrap gap-2 justify-end">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.path"
        :to="link.path"
        class="group flex flex-col items-center justify-center w-[72px] sm:w-[80px] md:w-[90px] transition-all"
      >
        <Icon
          :name="link.icon"
          class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
        />
        <div
          v-if="!compact"
          class="mt-1 text-center text-xs md:text-sm hidden md:block group-hover:block"
        >
          {{ link.title }}
        </div>
      </NuxtLink>
    </div>

    <!-- Utility Icons -->
    <div class="flex gap-2">
      <login-path :compact="compact" class="flex max-w-[80px]" />
      <jellybean-count :compact="compact" class="flex max-w-[80px]" />
      <theme-icon :compact="compact" class="flex max-w-[80px]" />
      <swarm-icon :compact="compact" class="flex max-w-[80px]" />
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
