<!-- /components/content/layout/nav-grid.vue -->
<template>
  <div class="w-full flex items-start justify-start rounded-2xl p-2">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      <nav-card
        v-for="(card, i) in cards"
        :key="card.path || i"
        :title="card.title"
        :icon="card.icon"
        :description="card.description ?? ''"
        :to="card.onClick ? undefined : card.path"
        :onClick="card.onClick"
        :delay="i"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

defineProps<{
  cards: (LinkItem & { onClick?: () => void })[]
}>()
</script>
