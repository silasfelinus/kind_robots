<template>
  <div
    class="banner-container flex flex-col lg:flex-row items-center justify-center border-accent border bg-primary text-white px-4 py-3 rounded-lg shadow-lg w-full mb-6"
  >
    <!-- Display the image if it exists, otherwise use default -->
    <div class="flex-shrink-0 h-auto">
      <img
        v-if="page && page.image"
        :src="'/images/' + page.image"
        alt="Page banner image"
        class="object-contain rounded-lg max-h-full"
        :style="{ height: '100%', width: 'auto' }"
      />
    </div>

    <!-- Title and Subtitle -->
    <div
      class="flex flex-col justify-center text-center lg:text-left lg:w-3/4 ml-4"
    >
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
