<template>
  <div :class="['flex flex-col min-h-screen']">
    <layout-selector />
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 bg-gray-800 text-default">
      <div class="logo text-2xl font-bold">KindRobots</div>
      <div class="login cursor-pointer">{{ isLoggedIn ? 'Logout' : 'Login' }}</div>
      <h1 class="text-lg font-semibold">@ {{ page.title }}</h1>
      <h2 class="text-md font-semibold">{{ page.subtitle }}</h2>
    </nav>
    <home-nav />
    <!-- Main Content -->
    <main class="flex-1 p-4">
      <!-- Adjusted Image URL -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="mx-auto my-4 rounded-lg shadow-md"
      />
      <slot />
      <!-- Display tooltip -->
      <div v-if="showTooltip" class="mt-4 p-2 rounded-md bg-gray-100 text-gray-700">
        {{ page.tooltip }}
      </div>

      <!-- Tags (optional; displayed as a list) -->
      <ul v-if="page.tags && page.tags.length" class="flex flex-wrap gap-2 mt-4">
        <li v-for="tag in page.tags" :key="tag" class="bg-gray-200 rounded-md px-2 py-1 text-sm">
          {{ tag }}
        </li>
      </ul>
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-gray-900 text-default text-center">KindRobots © 2023</footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
useContentHead(page)

const pageTitle = ref('Kind Robots Presents: ' + page.title || 'Kind Robots')

const isLoggedIn = ref<boolean>(false)
const showDescription = ref<boolean>(true)
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
