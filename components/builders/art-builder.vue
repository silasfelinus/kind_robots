<!-- /components/content/builder/art-builder.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4">
    <h2 class="flex items-center gap-2 text-2xl font-bold text-base-content">
      <Icon name="kind-icon:palette" class="h-6 w-6 text-primary" />
      Art Builder
    </h2>

    <p class="text-base text-base-content/70">
      Generate, upload, select, and connect images without making Art and ArtImage arm-wrestle in production.
    </p>

    <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <image-upload />
      <art-gallery />
    </div>
  </section>
</template>

<script setup lang="ts"></script>