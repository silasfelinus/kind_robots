<template>
  <div :class="['flex flex-col min-h-screen']">
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 bg-primary text-default">
      <div class="logo text-2xl font-bold">KindRobots</div>
      <navigation-row />
      <layout-selector class="absolute right-1 top-1" />
      <user-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
      <theme-toggle />
      <h1 class="text-lg font-semibold">The {{ page.title }} Room</h1>
      <h2 class="text-md font-semibold">{{ page.subtitle }}</h2>
    </nav>
    <!-- Display tooltip -->
    <div v-if="showTooltip" class="mt-4 p-2 text-xl rounded-2xl border bg-secondary">
      {{ page.tooltip }}
    </div>

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-base-200 text-default text-center">
      <!-- Adjusted Image URL -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="mx-auto my-4 rounded-lg shadow-md"
      />
      <!-- Footer -->
      <footer-toggle />
      KindRobots © 2023
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()

const pageTitle = ref('Kind Robots Presents: ' + page.title || 'Kind Robots')

const showTooltip = ref<boolean>(true)

interface GalleryResponse {
  success: boolean
  image?: string
}
const galleryData = ref<GalleryResponse | null>(null)
const fetchError = ref<string | null>(null)

onMounted(async () => {
  try {
    const response = await fetch(
      `https://kindrobots.org/api/gallery/random/name/${page.gallery || 'weirdlandia'}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data')
    }
    galleryData.value = await response.json()
  } catch (error: any) {
    fetchError.value = error.message
  }
})

const randomGalleryImage = computed(() => {
  return galleryData.value?.success ? galleryData.value.image : null
})
</script>
