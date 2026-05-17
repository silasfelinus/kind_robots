<!-- /components/content/builder/pitch-builder.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <h2 class="flex items-center gap-2 text-2xl font-bold text-base-content">
      <Icon name="kind-icon:idea" class="h-6 w-6 text-primary" />
      Pitch Builder
    </h2>

    <p class="text-base text-base-content/70">
      Start with the big-picture idea, then generate, refine, select, or save it.
    </p>

    <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <pitch-gallery />
      <brainstorm-interact />
    </div>
  </section>
</template>

<script setup lang="ts"></script>