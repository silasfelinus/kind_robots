<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <!-- Tags Section -->
    <div class="flex justify-center mb-2 flex-wrap space-x-2">
      <button
        v-for="tag in allTags"
        :key="tag"
        :class="`btn ${
          activeSection === tag ? 'bg-primary' : 'bg-accent'
        } my-2 mx-1 flex-1 text-center transition-all duration-300 ease-in-out`"
        @click="setActiveSection(tag)"
      >
        {{ tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : '' }}
      </button>
    </div>

    <!-- Always Visible Home Links -->
    <div class="flex justify-center mt-2 flex-wrap space-x-2">
      <div v-for="page in pagesByTag('home')" :key="page._id" class="home-link">
        <NuxtLink :to="page._path" class="oval-link">
          {{ page.title }}
        </NuxtLink>
      </div>
    </div>

    <!-- Home Section with Model Viewer -->
    <div
      v-if="activeSection === 'home' && !showModelCarousel"
      class="transition-all duration-500 ease-in-out"
    >
      <model-carousel :layout="screenStore.currentLayout" />
    </div>

    <!-- Image Nav Section -->
    <div
      v-if="activeSection && activeSection !== 'home' && !showModelCarousel"
      class="transition-all duration-500 ease-in-out"
    >
      <div
        v-for="page in pagesByTag(activeSection)"
        :key="page._id"
        class="m-2"
      >
        <NuxtLink :to="page._path">
          <img
            v-if="page.image"
            :src="`/images/${page.image}`"
            alt="Page Image"
          />
          <div>{{ page.title }}</div>
        </NuxtLink>
      </div>
    </div>

    <!-- Carousel Section -->
    <div
      v-if="showModelCarousel && activeSection && activeSection !== 'home'"
      class="transition-all duration-500 ease-in-out"
    >
      <bot-carousel :layout="screenStore.currentLayout" />
      <div class="text-xl text-primary">
        {{ currentBotName }}
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Page } from './../../../stores/contentStore'
import { useContentStore } from './../../../stores/contentStore'
import { useScreenStore } from './../../../stores/screenStore'
import { useBotStore } from './../../../stores/botStore'

const contentStore = useContentStore()
const screenStore = useScreenStore()
const botStore = useBotStore()

// Fetch pages from content store when the component is mounted
onMounted(async () => {
  await contentStore.getPages()
})

// Ensure that contentStore.pages matches the Page interface
const pages = computed<Page[]>(() => {
  return contentStore.pages.filter((page): page is Page => {
    return (
      page._id !== undefined &&
      page._path !== undefined &&
      typeof page._id === 'string' &&
      typeof page._path === 'string'
    )
  })
})

// Extract unique tags from pages and filter out the "home" tag
const uniqueTags = computed(() => {
  const tags: string[] = pages.value
    .map((page) => page.tags || [])
    .flat()
    .filter((tag): tag is string => typeof tag === 'string') // Type guard for string
  return Array.from(new Set(tags)).filter((tag) => tag !== 'home')
})

// Include "home" tag with other unique tags
const allTags = computed(() => ['home', ...uniqueTags.value])

// Filter pages based on tags
const pagesByTag = (tag: string) => {
  return pages.value.filter((page) => page.tags?.includes(tag))
}

// Directly use setActiveSection from screenStore
const setActiveSection = (section: string) => {
  screenStore.setActiveSection(section)
}

// Computed properties to track active section and carousel visibility
const activeSection = computed(() => screenStore.activeSection)
const showModelCarousel = computed(() => screenStore.showModelCarousel)

// Get the current bot's name from botStore
const currentBotName = computed(() => botStore.currentBot?.name || '')
</script>

<style scoped>
.btn {
  min-width: 80px;
  max-width: 150px;
  padding: 10px;
  border: none;
  color: white;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  transition: all 0.3s ease-in-out;
}

.oval-link {
  display: inline-block;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border-radius: 20px;
  margin: 2px;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
}

.oval-link:hover {
  transform: scale(1.1);
}

.home-link {
  flex: 0 0 auto;
}
</style>
