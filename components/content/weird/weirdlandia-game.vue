<template>
  <div class="flex justify-center items-center bg-gray-800 pattern-grid-lg">
    <div class="hero-image-container relative overflow-hidden">
      <img :src="bgImage" class="hero-image w-full object-cover" />

      <!-- Content Layer -->
      <div class="relative z-10">
        <!-- Introduction and About Content -->
        <p class="text-lg leading-relaxed text-white font-medium">
          Welcome to "Weirdlandia", a realm where every choice brings a new,
          unexpected twist. Challenges await at every corner. Carve your own
          journey in this unpredictable realm.
        </p>

        <p class="text-sm text-white font-semibold">
          Weirdlandia is under active development. For more information or to
          request a press packet, message weird@kindrobots.org
        </p>

        <!-- Game Content -->
        <div class="text-default font-light">
          <p>Game has started! Adventure awaits...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const bgImage = ref('')

const fetchBackgroundImage = async () => {
  try {
    const response = await fetch('/api/galleries/random/name/weirdlandia')

    if (!response.ok) {
      throw new Error('Failed to fetch the image.')
    }

    const data = await response.json()
    bgImage.value = data.image
  } catch (error) {
    console.error('There was an error fetching the background image:', error)
  }
}

onMounted(fetchBackgroundImage)
</script>

<style>
/* Custom colors if you want to introduce new shades */
.bg-accent-darkened {
  background-color: #004466; /* This is just an example color */
}
.bg-primary-darkened {
  background-color: #660044; /* This is just an example color */
}
.hero-image-container {
  width: 100%;
  height: 350px; /* or whatever height you prefer for the image */
  position: relative;
}

.hero-image {
  width: 100%;
  height: 100%;
}
.rounded-xl {
  padding: 0; /* Reset padding to eliminate spacing around the image */
}
.relative.z-10 {
  position: absolute; /* This will overlay the content on top of the image */
  top: 0; /* Start from the top edge */
  left: 0; /* Start from the left edge */
  width: 100%; /* Cover full width */
  height: 100%; /* Cover full height */
  padding: 20px;
  display: flex;
  flex-direction: column; /* Stack content vertically */
  justify-content: center; /* Center content vertically */
  background-color: rgba(
    0,
    0,
    0,
    0.5
  ); /* Black with 50% opacity for readability */
}
</style>
