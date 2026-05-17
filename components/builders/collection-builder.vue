<!-- /components/content/builder/collection-builder.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <h2 class="flex items-center gap-2 text-2xl font-bold text-base-content">
      <Icon name="kind-icon:folder" class="h-6 w-6 text-primary" />
      Collection Builder
    </h2>

    <p class="text-base text-base-content/70">
      Organize art and art images into usable visual groups for pitches, dreams, characters, rewards, and scenarios.
    </p>

    <collection-gallery />
  </section>
</template>

<script setup lang="ts"></script>