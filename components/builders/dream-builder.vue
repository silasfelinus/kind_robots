<!-- /components/content/builder/dream-builder.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <h2 class="flex items-center gap-2 text-2xl font-bold text-base-content">
      <Icon name="kind-icon:moon" class="h-6 w-6 text-primary" />
      Dream Builder
    </h2>

    <p class="text-base text-base-content/70">
      Expand a pitch into a reusable setting with vibe, world logic, art, collections, characters, and scenario hooks.
    </p>

    <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <dream-gallery />
      <dream-interact />
    </div>
  </section>
</template>

<script setup lang="ts"></script>