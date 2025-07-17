<!-- /components/content/layout/nav-grid.vue -->
<template>
  <div class="w-full flex items-start justify-start rounded-2xl p-2">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      <component
        v-for="(card, i) in cards"
        :key="card.path || i"
        :is="card.onClick ? 'div' : 'NuxtLink'"
        :to="!card.onClick ? card.path : undefined"
        class="group flex flex-col justify-between bg-base-100 border border-base-300 rounded-2xl p-4 hover:bg-base-200 transition-all cursor-pointer"
        :class="`delay-${i * 100}`"
        @click="card.onClick?.()"
      >
        <div class="flex items-center gap-2 mb-2">
          <Icon
            :name="card.icon"
            class="text-lg text-primary group-hover:scale-110 transition-transform"
          />
          <h3
            class="font-semibold text-base leading-snug text-base-content group-hover:text-primary break-words"
          >
            {{ card.title }}
          </h3>
        </div>
        <p class="text-sm text-base-content/80 leading-tight">
          {{ card.description }}
        </p>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

defineProps<{
  cards: (LinkItem & { onClick?: () => void })[]
}>()
</script>
