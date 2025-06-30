<!-- /components/content/art/art-nav.vue -->
<template>
  <div
    class="w-full min-h-[100px] flex items-start justify-center rounded-2xl bg-base-200 border border-base-300 p-4"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
      <nav-card
        title="Add Art"
        icon="kind-icon:plus"
        to="/addart"
        description="Upload your own image or generate art using our tools."
        class="animate-fade-in-up"
      />

      <nav-card
        title="Gallery"
        icon="kind-icon:gallery"
        to="/artgallery"
        description="Browse your past artwork and saved creations."
        class="animate-fade-in-up delay-200"
      />

      <nav-card
        title="Edit Art"
        icon="kind-icon:sparkles"
        to="/editor"
        description="Choose an image and transform it with text or presets."
        class="animate-fade-in-up delay-300"
      />

      <nav-card
        title="Animal Hybrid"
        icon="kind-icon:plus"
        to="/hybrid"
        description="Use AI to invent hybrid creatures by merging two real-world animals."
        class="animate-fade-in-up"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-nav.vue
</script>
