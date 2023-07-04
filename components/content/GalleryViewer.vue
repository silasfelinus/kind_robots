<template>
  <div class="pt-16">
    <select v-model="selectedGallery" class="form-select">
      <option v-for="gallery in galleries" :key="gallery" :value="gallery">
        {{ gallery }}
      </option>
    </select>

    <div class="row">
      <div v-for="image in currentImages" :key="image" class="col-md-3">
        <div class="card">
          <img
            :src="image.loaded ? `${BASE_URL}/images/${selectedGallery}/${image.name}` : ''"
            class="card-img-top"
            alt="Image description"
            @load="image.loaded = true"
          />
        </div>
      </div>
    </div>

    <nav>
      <ul class="pagination justify-content-center">
        <li
          v-for="page in totalPages"
          :key="page"
          class="page-item"
          :class="{ active: currentPage === page }"
        >
          <a class="page-link" @click="currentPage = page">{{ page }}</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
const galleries = [
  'acrocats',
  'amibot',
  'avatars',
  'background',
  'botcafe',
  'cafepurr',
  'floof',
  'gothcore',
  'flower',
  'fantasycore',
  'ducky',
  'redbubble',
  'seuss',
  'wonderbot',
  'wondercat',
  'wonderchest',
  'wondershed'
]
const selectedGallery = ref(galleries[0])
const galleryData = ref(null)
const currentPage = ref(1)
const imagesPerPage = ref(16)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

watchEffect(async () => {
  try {
    const response = await fetch(`${BASE_URL}/images/${selectedGallery.value}/gallery.json`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    galleryData.value = {
      ...data,
      images: data.images.sort(() => Math.random() - 0.5).map((name) => ({ name, loaded: false })) // Randomize images
    }
    currentPage.value = 1 // Reset to first page when gallery changes
  } catch (e) {
    console.error('Error fetching gallery data', e)
  }
})

const totalPages = computed(() => Math.ceil(galleryData.value?.images.length / imagesPerPage.value))

const currentImages = computed(() => {
  if (!galleryData.value) return []
  const startIndex = (currentPage.value - 1) * imagesPerPage.value
  const endIndex = startIndex + imagesPerPage.value
  return galleryData.value.images.slice(startIndex, endIndex)
})
</script>

<style scoped>
.card-img-top {
  width: 100%;
  height: auto;
}
</style>
