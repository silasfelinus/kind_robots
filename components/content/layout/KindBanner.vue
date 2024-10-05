<template>
  <div
    class="banner-container flex items-center h-1/4 border-accent border-1 bg-primary text-white px-4 py-3 rounded-lg shadow-lg w-full mb-6"
  >
    <!-- Display the image if it exists, otherwise use default -->
    <img
      v-if="page && page.image"
      :src="'/images/' + page.image"
      alt="Page banner image"
      class="banner-image object-cover rounded-lg mr-4"
    />

    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center w-full">
      <h1 class="text-2xl md:text-4xl font-extrabold">
        {{ page.title || 'Kind Robots' }}
      </h1>
      <p class="text-md md:text-lg font-medium mt-1">
        {{ page.subtitle || 'Create your universe.' }}
      </p>
    </div>
  </div>
</template>

<script setup>
const { page } = useContent()
</script>

<style scoped>
.banner-container {
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* Image adjusts based on container height and keeps natural aspect ratio */
.banner-image {
  height: 100%;
  width: auto; /* This keeps the width responsive based on height */
  border-radius: 0.5rem;
}

@media (min-width: 768px) {
  .banner-image {
    max-width: auto;
  }
}
</style>
