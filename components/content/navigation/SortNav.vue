<template>
  <nav
    class="w-full p-2 transition-all duration-500 ease-in-out bg-base-300 border rounded-2xl"
  >
    <div class="flex flex-wrap justify-center m-2 space-x-2">
      <div
        v-for="page in highlightPages"
        :key="page._id"
        class="m-2 relative group"
      >
        <NuxtLink
          :to="page._path"
          class="flex flex-col items-center py-2 px-4 transform transition-transform hover:scale-110"
          @mouseover="isHovered = page._id"
          @mouseleave="isHovered = undefined"
        >
          <img
            :src="`/images/${page.image}`"
            alt="Page Image"
            class="w-24 h-24 rounded-lg object-cover"
          />
          <div class="mt-2">
            {{ page.title }}
          </div>
          <div
            v-if="page.underConstruction"
            class="mt-1 px-2 py-0.5 bg-info text-xs rounded-full"
          >
            Under Development
          </div>
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
      </div>
    </div>
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in IconPages" :key="page._id" class="m-2 relative group">
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full p-2 transform transition-transform hover:scale-110 flex items-center space-x-2"
        >
          <Icon
            name="{{page.icon}}"
            class="w-6 h-6 group-hover:text-accent transition-colors duration-300"
          />
          {{ page.title }}
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
        <div
          v-if="page.underConstruction"
          class="mt-1 px-2 py-0.5 bg-info text-md rounded-full"
        >
          Under Development
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in textPages" :key="page._id" class="m-2 relative group">
        <NuxtLink
          :to="page._path"
          class="p-2 transform transition-transform hover:scale-110"
        >
          {{ page.title }}
        </NuxtLink>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
        <div
          v-if="page.underConstruction"
          class="mt-1 px-2 py-0.5 bg-info text-xs rounded-full"
        >
          Under Development
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const isHovered = ref<string | undefined>(undefined)

const contentStore = useContentStore()

const highlightPages = computed(() =>
  contentStore.pagesByTagAndSort('home', 'highlight'),
)
const IconPages = computed(() => contentStore.pagesByTagAndSort('home', 'Icon'))
const textPages = computed(() => contentStore.pagesByTagAndSort('home', 'text'))
</script>
