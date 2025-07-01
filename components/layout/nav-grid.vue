<!-- /components/content/layout/nav-grid.vue -->
<template>
  <div
    class="w-full min-h-[100px] flex items-start justify-center rounded-2xl bg-base-200 border border-base-300 p-4"
  >
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl"
    >
      <NuxtLink
        v-for="(card, i) in cards"
        :key="card.to"
        :to="card.to"
        class="group relative flex flex-col justify-between rounded-2xl overflow-hidden bg-base-100 border border-base-300 shadow-md hover:shadow-lg transition-all hover:ring hover:ring-primary/50 p-6 w-full h-full animate-fade-in-up"
        :class="`delay-${i * 100}`"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <Icon
              :name="card.icon"
              class="text-3xl text-primary transition-transform group-hover:scale-110"
            />
            <h3
              class="font-bold text-xl text-base-content group-hover:text-primary"
            >
              {{ card.title }}
            </h3>
          </div>
          <p
            class="text-base text-base-content/80 group-hover:text-base-content"
          >
            {{ card.description }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cards: {
    title: string
    icon: string
    to: string
    description: string
  }[]
}>()
</script>
