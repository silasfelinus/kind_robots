<!-- /components/content/layout/nav-card.vue -->
<template>
  <NuxtLink
    :to="to"
    class="rounded-2xl border border-base-300 bg-base-100 p-4 flex flex-col gap-2 hover:bg-primary hover:text-black transition-all shadow-md"
  >
    <div class="flex items-center gap-3">
      <Icon :name="icon" class="text-2xl" />
      <h3 class="font-bold text-lg">{{ title }}</h3>
    </div>
    <p class="text-sm text-base-content/70">{{ description }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  to: string
  description: string
}>()
</script>
