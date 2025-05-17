<!-- /components/content/art/art-nav.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
    <NavCard
      title="Add Art"
      icon="kind-icon:plus"
      to="/addart"
      description="Upload your own image or generate art using our tools."
      class="animate-fade-in-up"
    />

    <NavCard
      title="Gallery"
      icon="kind-icon:gallery"
      to="/artgallery"
      description="Browse your past artwork and saved creations."
      class="animate-fade-in-up delay-200"
    />

    <NavCard
      title="Edit Art"
      icon="kind-icon:sparkles"
      to="/editor"
      description="Choose an image and transform it with text or presets."
      class="animate-fade-in-up delay-300"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/art/art-nav.vue
</script>
