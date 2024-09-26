<template>
  <div
    class="relative flex flex-col items-center bg-base-300 rounded-2xl transition-all"
    :class="{
      'h-[10vh] transition-duration-300': !isExtended,
      'h-[40vh] transition-duration-300': isExtended,
    }"
  >
    <!-- Toggle Button -->
    <div
      class="transition duration-600 ease-in-out absolute bottom-0 right-0 transform -translate-x-1/3 rounded-2xl cursor-pointer shadow-lg p-2 z-40 m-4"
      @click.stop="toggleExtend"
    >
      <Icon
        :name="
          isExtended
            ? 'line-md:chevron-small-double-down'
            : 'line-md:chevron-small-double-up'
        "
        class="w-6 h-6 text-default"
      />
    </div>

    <!-- Highlight Pages -->
    <div
      class="text-center text-2xl font-extrabold tracking-wider shadow-lg bg-secondary border rounded-2xl flex flex-col z-40 pointer-events-none"
    >
      Highlight Gallery
    </div>
    <div class="flex flex-wrap justify-center space-x-2 mb-1 pb-5 m-1 w-full">
      <NuxtLink
        v-for="page in highlightPages"
        :key="page._id"
        :to="page._path"
        class="group transition-colors relative p-2 mb-2 rounded-2xl border bg-primary flex flex-col items-center space-x-2"
        @mouseover="isHovered = page._id ?? null"
        @mouseleave="isHovered = null"
        @click="handleLinkClick"
      >
        <!-- Tooltip -->
        <popup-description
          v-if="isHovered === page._id"
          :icon="page.icon"
          :description="page.description"
          :is-hovered="isHovered === page._id"
        />
        <!-- Compact View -->
        <div v-if="!isExtended" class="flex flex-row items-center space-x-2">
          <Icon name="{{page.Icon}}" class="text-3xl" />
          <div class="text-lg font-bold bg-base-300 p-2 rounded-2xl border">
            {{ page.title }}
          </div>
        </div>

        <!-- Extended View -->
        <div v-if="isExtended" class="flex flex-col items-center m-1 space-y-2">
          <div class="w-24 h-24 rounded-lg border bg-secondary">
            <img
              :src="`/images/${page.image}`"
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
            <Icon name="line-md:download-outline-loop" class="text-lg mr-2" />
          </div>
          <div class="flex flex-col items-start">
            <div
              class="text-lg font-bold bg-base-300 p-2 m-1 rounded-2xl border"
            >
              {{ page.title }}
            </div>
            <popup-description
              v-if="isHovered === page._id"
              :icon="page.icon"
              :description="page.description"
              :is-hovered="isHovered === page._id"
            />
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Support and Construction Nav (Displayed only when extended) -->
    <div
      v-if="isExtended"
      class="mt-4 p-2 rounded-2xl bg-base-300 flex flex-col items-center space-y-4 w-full"
    >
      <support-nav />
      <construction-nav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore' // Import the contentStore
import { useFooterStore } from './../../../stores/footerStore'

// Access the content store
const contentStore = useContentStore()
const footerStore = useFooterStore()

const isHovered = ref<string | null>(null)

// Computed properties
const isExtended = computed(() => footerStore.isExtended)
const highlightPages = computed(() => contentStore.highlightPages)

// Methods
const toggleExtend = () => {
  footerStore.toggleIsExtended()
}

const handleLinkClick = () => {
  if (isExtended.value) {
    toggleExtend()
  }
}
</script>
