<template>
  <div
    class="flex w-full items-center justify-end overflow-hidden flex-nowrap gap-2"
  >
    <!-- All Icons Treated Equally -->
    <div
      v-for="link in navLinks"
      :key="link.path"
      class="group flex-1 min-w-0 flex flex-col items-center justify-center transition-all"
    >
      <NuxtLink
        :to="link.path"
        class="flex flex-col items-center justify-center w-full"
      >
        <Icon
          :name="link.icon"
          class="w-[clamp(1.5rem,4vw,3rem)] h-[clamp(1.5rem,4vw,3rem)] transition-transform hover:scale-110 duration-300 ease-in-out"
        />
        <div
          v-if="!compact"
          class="mt-1 text-center text-xs md:text-sm hidden md:block truncate w-full"
        >
          {{ link.title }}
        </div>
      </NuxtLink>
    </div>

    <!-- Utility Icons as Flex Items Too -->
    <div
      v-for="icon in utilityIcons"
      :key="icon.name"
      class="flex-1 min-w-0 flex justify-center"
    >
      <component :is="icon.component" :compact="compact" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'

defineProps<{ compact?: boolean }>()

const { navLinks } = storeToRefs(useLinkStore())

const utilityIcons = [
  { name: 'login-path', component: 'login-path' },
  { name: 'jellybean-count', component: 'jellybean-count' },
  { name: 'theme-icon', component: 'theme-icon' },
  { name: 'swarm-icon', component: 'swarm-icon' },
]
</script>
