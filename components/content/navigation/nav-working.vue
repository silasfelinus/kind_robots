<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <div class="flex justify-center mb-2 flex-wrap space-x-2">
      <button
        v-for="tag in allTags"
        :key="tag"
        :class="`btn ${
          activeSection === tag ? 'bg-primary' : 'bg-secondary'
        } my-2 mx-1 flex-1 text-center transition-all duration-300 ease-in-out`"
        @click="changeSection(tag)"
      >
        {{ tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : '' }}
      </button>
    </div>

    <!-- Always Visible Home Links -->
    <div class="flex justify-center mt-2 flex-wrap space-x-2">
      <div
        v-for="page in pagesByTag('home')"
        :key="page._id"
        class="home-link"
      >
        <NuxtLink
          :to="page._path"
          class="oval-link"
        >
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
          >
          <div>{{ page.title }}</div>
        </NuxtLink>
      </div>
    </div>

    <!-- Carousel Section -->
    <div
      v-if="showModelCarousel && activeSection && activeSection !== 'home'"
      class="transition-all duration-500 ease-in-out"
    >
      <model-carousel :layout="screenStore.currentLayout" />
      <div class="text-xl text-primary">
        {{ currentBotName }}
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../../../stores/contentStore'
import { useScreenStore } from '../../../stores/screenStore'
import { useBotStore } from '../../../stores/botStore'

const contentStore = useContentStore()
const screenStore = useScreenStore()
contentStore.getPages()

const botStore = useBotStore()
const currentBotName = computed(() => botStore.currentBot?.name || '')

const uniqueTags = computed(() => {
  const tags: string[] = contentStore.pages
    .map((page: any) => page.tags)
    .flat()
    .filter((tag: any) => typeof tag === 'string') // Ensure tags are strings
  return Array.from(new Set(tags)).filter(tag => tag !== 'home')
})

const allTags = computed(() => ['home', ...uniqueTags.value])

const changeSection = (section: string) => {
  setActiveSection(section)
}
const pagesByTag = (tag: string) => {
  return contentStore.pages.filter((page: any) => page.tags?.includes(tag))
}

const setActiveSection = screenStore.setActiveSection
const toggleModelCarousel = screenStore.toggleModelCarousel

// Access the screenStore's state
const activeSection = computed(() => screenStore.activeSection)
const showModelCarousel = computed(() => screenStore.showModelCarousel)
</script>

<style>
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
  background-color: bg-accent;
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
