<template>
  <div :class="['flex flex-col min-h-screen bg-base']">
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 bg-primary text-white">
      <div class="logo text-3xl font-extrabold">KindRobots</div>
      <h1 class="text-xl font-bold">@ {{ page.title }}</h1>
      <h2 class="text-lg font-medium">{{ page.subtitle }}</h2>
    </nav>
    <!-- Main Content -->
    <main class="flex-1 p-4 bg-secondary">
      <!-- Banner Image -->
      <div class="p-4 rounded-xl bg-base-200 mx-auto my-6">
        <div class="p-3 rounded-xl bg-accent">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="mx-auto my-2 rounded-lg shadow-lg w-full h-auto"
          />
        </div>
      </div>
      <slot />
      <!-- Display tooltip -->
      <div v-if="showTooltip" class="mt-4 p-3 rounded-md bg-accent text-white">
        {{ page.tooltip }}
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-primary text-white text-center"><home-nav />KindRobots © 2023</footer>
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
