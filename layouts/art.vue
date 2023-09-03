<template>
  <div :class="['flex flex-col min-h-screen bg-base-100']">
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 bg-primary text-white">
      <div class="logo text-3xl font-extrabold">KindRobots</div>
      <theme-selector />
    </nav>
    <!-- Main Content -->
    <main class="flex-1 p-4 bg-secondary flex flex-col md:flex-row">
      <!-- Banner Image -->
      <div class="flex-1">
        <div class="p-4 rounded-xl bg-base-200 mx-auto my-6">
          <div class="p-3 rounded-xl bg-accent">
            <img
              :src="'/images/' + page.image"
              alt="Main Image"
              class="mx-auto my-2 rounded-lg shadow-lg w-full h-auto md:max-w-lg"
            />
          </div>
        </div>
      </div>
      <slot />
      <!-- Display tooltip -->
      <div v-if="showTooltip" class="flex-1">
        <div class="mt-4 p-3 rounded-md bg-accent text-white tooltip">
          {{ page.tooltip }}
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-primary text-white text-center">
      <home-nav />
      KindRobots © 2023
    </footer>

    <!-- Chat Button -->
    <div class="fixed bottom-4 right-4 p-2 rounded-full bg-accent">
      <icon name="mdi:chat" class="text-white" />
      <span class="text-white ml-2">Chat</span>
    </div>
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
<style scoped>
.tooltip {
  @apply p-2 rounded-md text-sm;
}
</style>
