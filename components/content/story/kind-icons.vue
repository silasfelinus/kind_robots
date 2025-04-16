<template>
  <NuxtLink
    v-for="link in navLinks"
    :key="link.path"
    :to="link.path"
    class="flex flex-col items-center cursor-pointer max-w-[80px]"
    :title="compact ? '' : link.title"
  >
    <Icon
      :name="link.icon"
      class="h-6 w-6 md:h-8 md:w-8 transition-transform hover:scale-110"
    />
    <span
      v-if="!compact"
      class="text-xs md:text-sm font-semibold text-center mt-1"
    >
      {{ link.title }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
// /components/content/story/kind-icons.vue
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'

defineProps<{ compact?: boolean }>()

const { navLinks } = storeToRefs(useLinkStore())
</script>
