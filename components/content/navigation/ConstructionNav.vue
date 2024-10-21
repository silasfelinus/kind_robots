<template>
  <div class="relative flex flex-wrap justify-center space-x-2 mb-1">
    <!-- Under Construction Section -->
    <div
      class="flex items-center justify-center text-2xl font-extrabold border shadow-lg bg-secondary rounded-2xl mb-2 px-1"
    >
      Under Construction
      <Icon name="kind-icon:construction" class="text-2xl ml-2" />
    </div>

    <!-- Links -->
    <NuxtLink
      v-for="page in underConstructionPages"
      :key="page._id"
      :to="page._path"
      class="group hover:bg-accent transition-colors relative rounded-2xl border bg-warning flex flex-row items-center space-x-2 w-64 mb-4"
      @mouseover="isHovered = page._id"
      @mouseleave="isHovered = undefined"
      @click="handleLinkClick"
    >
      <!-- Image -->
      <div
        class="w-20 h-20 min-w-20 rounded-lg overflow-hidden border bg-secondary"
      >
        <img
          :src="page.image ? `/images/${page.image}` : '/images/default.jpg'"
          alt="Page Image"
          class="object-cover w-full h-full"
        />
      </div>
      <!-- You are here indicator -->
      <div
        v-if="page._path === $route.path"
        class="flex items-center m-1 p-1 text-xl rounded-2xl border bg-secondary"
      >
        You are here
        <Icon name="kind-icon:download" class="text-lg mr-2" />
      </div>
      <!-- Page Title and Popup -->
      <div class="flex flex-col items-start">
        <div class="text-lg font-bold bg-base-300 px-2 rounded-2xl border">
          {{ page.title }}
        </div>
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFooterStore } from './../../../stores/footerStore'
import { useContentStore } from '../../../stores/contentStore'

const footerStore = useFooterStore()
const contentStore = useContentStore()

const isHovered = ref<string | undefined>(undefined)

const handleLinkClick = () => {
  if (footerStore.isExtended) {
    footerStore.toggleIsExtended()
  }
}

const underConstructionPages = computed(
  () => contentStore.underConstructionPages,
)
</script>
