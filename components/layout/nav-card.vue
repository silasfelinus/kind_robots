<template>
  <NuxtLink
    :to="to"
    class="group relative flex flex-col justify-between rounded-2xl overflow-hidden bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all hover:ring hover:ring-primary/50 p-6 w-full h-full"
  >
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <Icon
          :name="icon"
          class="text-3xl text-primary transition-transform group-hover:scale-110"
        />
        <h3
          class="font-bold text-xl text-base-content group-hover:text-primary"
        >
          {{ title }}
        </h3>
      </div>
      <p class="text-base text-base-content/80 group-hover:text-base-content">
        {{ description }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
// /components/content/layout/nav-card.vue
defineProps<{
  title: string
  icon: string
  to: string
  description: string
}>()
</script>
