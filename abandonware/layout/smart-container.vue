<!-- /components/layout/smart-container.vue -->
<template>
  <div :class="containerClass">
    <!-- Optional name -->
    <h2 v-if="name" class="text-lg font-bold truncate text-primary">
      {{ name }}
    </h2>

    <!-- Optional image using ArtCard -->
    <ArtCard
      v-if="image"
      :art="image"
      class="w-full rounded-xl shadow-md border border-base-300"
    />

    <!-- Optional path -->
    <div v-if="path" class="text-sm text-base-content/60 break-words">
      {{ path }}
    </div>

    <!-- Custom content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import type { Art } from '~/prisma/generated/prisma/client'

defineProps<{
  name?: string
  path?: string
  image?: Art
}>()

const displayStore = useDisplayStore()

const containerClass = computed(() =>
  displayStore.showExtended
    ? 'w-full max-w-4xl px-6 mx-auto space-y-4'
    : 'w-full max-w-prose px-4 mx-auto space-y-4',
)
</script>
