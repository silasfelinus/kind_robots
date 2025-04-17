<!-- /components/content/story/kind-icons.vue -->
<template>
  <div class="flex gap-1 items-center justify-end w-full">
    <NuxtLink
      v-for="link in navLinks"
      :key="link.path"
      :to="link.path"
      class="group flex flex-col items-center justify-center w-[80px] min-w-[12px] max-w-[90px] transition-all"
    >
      <Icon
        :name="link.icon"
        class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      />
      <div
        v-if="!compact"
        class="mt-2 text-center text-sm md:block hidden group-hover:block"
      >
        {{ link.title }}
      </div>
    </NuxtLink>

    <!-- Utility Icons -->
    <login-path :compact="compact" class="flex max-w-[80px]" />
    <jellybean-count :compact="compact" class="flex max-w-[80px]" />
    <theme-icon :compact="compact" class="flex max-w-[80px]" />
    <swarm-icon :compact="compact" class="flex max-w-[80px]" />
  </div>
</template>

<script setup lang="ts">
// /components/content/story/kind-icons.vue
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'

defineProps<{ compact?: boolean }>()

const { navLinks } = storeToRefs(useLinkStore())
</script>
