<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <div class="flex justify-center mb-2 flex-wrap space-x-2">
      <button
        v-for="tag in allTags"
        :key="tag"
        :class="[
          'btn',
          'py-2',
          'px-4',
          'text-white',
          'cursor-pointer',
          'overflow-hidden',
          'whitespace-nowrap',
          'transition-all',
          'duration-300',
          'ease-in-out',
          activeSection === tag ? 'btn-primary' : 'btn-accent'
        ]"
        @click="changeSection(tag)"
      >
        {{ tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : '' }}
      </button>
    </div>

    <!-- Always Visible Home Links -->
    <div class="flex justify-center mt-2 flex-wrap space-x-2">
      <div v-for="page in pagesByTag('home')" :key="page._id" class="flex-none">
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full py-1 px-3 transform transition-transform hover:scale-110"
        >
          {{ page.title }}
        </NuxtLink>
      </div>
    </div>

    <!-- Image Nav Section -->
    <div
      v-if="activeSection && activeSection !== 'home' && !showModelCarousel"
      class="transition-all justify-center duration-500 ease-in-out"
    >
      <div v-for="page in pagesByTag(activeSection)" :key="page._id" class="m-2">
        <NuxtLink :to="page._path">
          <img v-if="page.image" :src="`/images/${page.image}`" alt="Page Image" class="block" />
          <div>{{ page.title }}</div>
        </NuxtLink>
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
  return Array.from(new Set(tags)).filter((tag) => tag !== 'home')
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
