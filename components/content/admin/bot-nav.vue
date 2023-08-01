<template>
  <nav class="w-full bg-base p-4">
    <div class="flex justify-center mb-2 flex-wrap">
      <button class="btn bg-primary my-2 mx-1 flex-1 text-center" @click="activeSection = 'home'">
        Home
      </button>
      <button
        v-for="tag in uniqueTags"
        :key="tag"
        class="btn bg-primary my-2 mx-1 flex-1 text-center"
        @click="activeSection = tag"
      >
        {{ tag.charAt(0).toUpperCase() + tag.slice(1) }}
      </button>
      <button class="btn bg-secondary my-2 mx-1 flex-1 text-center" @click="toggleModelCarousel">
        Toggle Carousel
      </button>
    </div>

    <!-- Home Section -->
    <div v-if="activeSection === 'home'" class="w-full flex flex-col">
      <div v-for="page in pagesByTag('home')" :key="page._id">
        <NuxtLink :to="page._path">{{ page.title }}</NuxtLink>
      </div>
    </div>

    <!-- Image Nav Section -->
    <div v-if="activeSection && activeSection !== 'home' && !showModelCarousel">
      <div v-for="page in pagesByTag(activeSection)" :key="page._id" class="m-2">
        <NuxtLink :to="page._path">
          <img v-if="page.image" :src="`/images/${page.image}`" alt="Page Image" />
          <div>{{ page.title }}</div>
        </NuxtLink>
      </div>
    </div>

    <!-- Carousel Section -->
    <div v-if="showModelCarousel && activeSection && activeSection !== 'home'">
      <model-carousel
        :model-type="screenStore.currentModelType"
        :layout="screenStore.currentLayout"
      ></model-carousel>
      <div class="text-xl text-primary">{{ currentBotName }}</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '../../../stores/contentStore'
import { useScreenStore } from '../../../stores/screenStore'
import { useBotStore } from '../../../stores/botStore'

const activeSection = ref<string | null>('home') // Default to home
const showModelCarousel = ref(false) // Toggle to show model carousel or navigation links

const contentStore = useContentStore()
const screenStore = useScreenStore()
contentStore.getPages()

const botStore = useBotStore()
const currentBotName = computed(() => botStore.currentBot?.name || '')

const uniqueTags = computed(() => {
  const tags: string[] = contentStore.pages
    .map((page: any) => page.tags)
    .flat()
    .filter((tag: string) => tag && typeof tag === 'string' && tag !== 'home')
  return Array.from(new Set(tags))
})

const pagesByTag = (tag: string) => {
  return contentStore.pages.filter((page: any) => page.tags?.includes(tag))
}

const toggleModelCarousel = () => {
  showModelCarousel.value = !showModelCarousel.value // Toggle between carousel and navigation links
}
</script>

<style scoped>
.btn {
  min-width: 80px; /* Ensuring a minimum width */
  max-width: 150px; /* Setting a maximum width */
  padding: 10px; /* Adding some padding */
  border: none; /* Removing borders */
  color: white; /* Setting text color */
  cursor: pointer; /* Making it clear that it's clickable */
  overflow: hidden; /* Handling overflow */
  text-overflow: ellipsis; /* Handling long text */
  white-space: nowrap; /* Preventing wrapping within the button */
}
.bg-primary {
  background-color: #007bff; /* Example primary color */
}
.bg-secondary {
  background-color: #6c757d; /* Example secondary color */
}
</style>
