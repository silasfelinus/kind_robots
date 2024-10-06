<template>
  <div
    class="banner-container flex flex-col lg:flex-row items-center justify-center h-[15vh] lg:h-[20vh] border-accent border bg-primary text-white px-4 py-3 rounded-lg shadow-lg w-full mb-6"
  >
    <!-- Display the image if it exists, otherwise use default -->
    <img
      v-if="page && page.image"
      :src="'/images/' + page.image"
      alt="Page banner image"
      class="banner-image object-cover rounded-lg lg:w-1/4 w-3/4 mb-4 lg:mb-0 lg:mr-4"
    />

    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center text-center lg:text-left lg:w-3/4">
      <h1 class="text-2xl md:text-4xl font-extrabold">
        {{ page.title || 'Kind Robots' }}
      </h1>
      <p class="text-md md:text-lg font-medium mt-1">
        {{ page.subtitle || 'Craft your universe.' }}
      </p>
    </div>
  </div>
</template>

<script setup>
const { page } = useContent()
</script>
