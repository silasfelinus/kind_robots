<template>
  <nav class="w-full bg-base p-4">
    <div class="flex justify-center mb-4">
      <button
        class="btn bg-secondary"
        :class="{ 'text-accent': showHome }"
        @click="showHome = !showHome"
      >
        Home
      </button>
      <button
        class="btn bg-primary"
        :class="{ 'text-base': activeSection === 'bots' }"
        @click="activeSection = 'bots'"
      >
        Bots
      </button>
      <button
        class="btn bg-primary"
        :class="{ 'text-base': activeSection === 'art' }"
        @click="activeSection = 'art'"
      >
        Art
      </button>
      <button
        class="btn bg-primary"
        :class="{ 'text-base': activeSection === 'projects' }"
        @click="activeSection = 'projects'"
      >
        Projects
      </button>
    </div>
    <!-- Home Section (Accordion) -->
    <div v-if="showHome" class="w-full flex flex-col">
      <div v-for="page in pagesByTag('home')" :key="page._id">
        <NuxtLink :to="page._path">{{ page.title }}</NuxtLink>
      </div>
    </div>
    <!-- Other Sections (Projects, Bots, Art) -->
    <div v-if="activeSection" class="flex flex-wrap justify-start">
      <div v-for="tag in displayedTags" :key="tag">
        <h2 class="text-xl text-primary">{{ tag }}</h2>
        <div class="flex flex-wrap">
          <div v-for="page in pagesByTag(tag)" :key="page._id" class="m-2">
            <NuxtLink :to="page._path">
              <img v-if="page.image" :src="`/images/${page.image}`" alt="Page Image" />
              <div>{{ page.title }}</div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '../../stores/contentStore'

const activeSection = ref<string | null>(null)

const contentStore = useContentStore()
contentStore.getPages()
const showHome = ref(false)

const displayedTags = computed(() => {
  if (activeSection.value) {
    return [activeSection.value]
  }
  return []
})

const pagesByTag = (tag: string) => {
  return contentStore.pages.filter((page: any) => page.tags?.includes(tag))
}
</script>

<style scoped>
.bg-base {
  background-color: #f6f6f6;
}
.bg-secondary {
  background-color: #e6e6e6; /* Secondary background color */
}
.text-primary {
  color: #007bff;
}
.text-base {
  color: #888888; /* Less bold text color for active section */
}
.text-accent {
  color: #b0c4de; /* Less bold accent color for Home button */
}
.btn {
  padding: 5px 15px;
  margin: 0 5px;
  cursor: pointer;
  transition: color 0.3s ease;
}
</style>
