<template>
  <div
    class="relative flex flex-col items-center overflow-visible bg-base-200 rounded-2xl p-2 border"
    :class="{ 'h-[10vh]': !isExtended, 'h-[25vh]': isExtended }"
  >
    <!-- Toggle Button -->
    <div
      class="transition duration-600 ease-in-out absolute top-4 left-1/2 transform -translate-x-1/2 bg-base-400 border rounded-2xl p-2 cursor-pointer shadow-lg"
      @click.stop="toggleExtend"
    >
      <icon
        :name="
          isExtended
            ? 'line-md:chevron-small-double-down'
            : 'line-md:chevron-small-double-up'
        "
        class="w-6 h-6 text-default"
      />
    </div>

    <!-- Highlight Pages -->
    <div class="flex flex-wrap justify-center space-x-2 overflow-x-auto pb-10">
      <NuxtLink
        v-for="page in highlightPages"
        :key="page._id"
        :to="page._path"
        class="group transition-colors relative p-2 rounded-2xl border bg-primary flex flex-col items-center space-x-2"
        @mouseover="isHovered = page._id"
        @mouseleave="isHovered = undefined"
      >
        <!-- Compact View -->
        <div v-if="!isExtended" class="flex flex-row items-center space-x-2">
          <icon :name="page.icon" class="text-3xl" />
          <div class="text-lg font-bold bg-base-200 p-2 rounded-2xl border">
            {{ page.title }}
          </div>
        </div>

        <!-- Tooltip -->
        <div
          v-if="!isExtended && isHovered === page._id"
          class="absolute -top-32 mb-1 left-1/2 transform -translate-x-1/2 p-2 bg-base-200 rounded-2xl border shadow-lg z-10 flex items-center space-x-4"
        >
          <div class="w-24 h-24 rounded-lg overflow-hidden border bg-secondary">
            <img
              :src="`/images/${page.image}`"
              alt="Page Image"
              class="object-cover w-full h-full"
            />
          </div>
          <div class="text-sm bg-base-200 p-2 rounded-2xl border">
            {{ page.description }}
          </div>
        </div>

        <!-- Extended View -->
        <div v-if="isExtended" class="flex flex-col items-center space-y-2">
          <div class="w-24 h-24 rounded-lg overflow-hidden border bg-secondary">
            <img
              :src="`/images/${page.image}`"
              alt="Page Image"
              class="object-cover w-full h-full"
            />
          </div>
          <div class="text-lg font-bold bg-base-200 p-2 rounded-2xl border">
            {{ page.title }}
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Support and Construction Nav (Displayed only when extended) -->
    <div
      v-if="isExtended"
      class="mt-4 p-2 rounded-2xl bg-base-200 flex flex-col items-center space-y-4"
    >
      <support-nav />
      <construction-nav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '@/stores/contentStore' // Changed to useContentStore
import { useFooterStore } from '@/stores/footerStore'

const contentStore = useContentStore()
const isHovered = ref<string | undefined>(undefined) // Initialize as null and adjust the type
const footerStore = useFooterStore()

const isExtended = computed(() => footerStore.isExtended)

const toggleExtend = () => {
  footerStore.toggleIsExtended()
}

const highlightPages = computed(() => contentStore.highlightPages)
</script>
