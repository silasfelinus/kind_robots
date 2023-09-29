<template>
  <div
    class="relative flex flex-col items-center bg-base-200 rounded-2xl transition-all ease-in-out"
    :class="{
      'h-[10vh] transition-duration-300': !isExtended,
      'h-[40vh] transition-duration-300': isExtended
    }"
  >
    <!-- Toggle Button -->
    <div
      class="transition duration-600 ease-in-out absolute bottom-0 right-0 transform -translate-x-1/3 rounded-2xl cursor-pointer shadow-lg p-2 z-50 m-4"
      @click.stop="toggleExtend"
    >
      <icon
        :name="isExtended ? 'line-md:chevron-small-double-down' : 'line-md:chevron-small-double-up'"
        class="w-6 h-6 text-default"
      />
    </div>

    <!-- Highlight Pages -->
    <div
      class="text-center text-2xl font-extrabold tracking-wider shadow-lg bg-secondary border rounded-2xl transform -translate-x-1/3 mb-1 top-0 absolute z-50 pointer-events-none"
    >
      Highlight Gallery
    </div>
    <div class="flex flex-wrap justify-center space-x-2 mb-1 pb-5 mt-10 w-full">
      <NuxtLink
        v-for="page in highlightPages"
        :key="page._id"
        :to="page._path"
        class="group transition-colors relative p-2 mb-2 rounded-2xl border bg-primary flex flex-col items-center space-x-2"
        @mouseover="isHovered = page._id"
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
          <icon :name="page.icon" class="text-3xl" />
          <div class="text-lg font-bold bg-base-200 p-2 rounded-2xl border">
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
            You are here <icon name="line-md:download-outline-loop" class="text-lg mr-2" />
          </div>
          <div class="flex flex-col items-start">
            <div class="text-lg font-bold bg-base-200 p-2 m-1 rounded-2xl border">
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
      class="mt-4 p-2 rounded-2xl bg-base-200 border flex flex-col items-center space-y-4 w-full"
    >
      <support-nav />
      <construction-nav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useFooterStore } from '@/stores/footerStore'

const pageStore = usePageStore()
const footerStore = useFooterStore()

const isHovered = ref(null)

const toggleExtend = () => {
  footerStore.toggleIsExtended()
}

onMounted(() => {
  pageStore.getPages()
})

const isExtended = computed(() => footerStore.isExtended)

const handleLinkClick = () => {
  if (isExtended.value) {
    toggleExtend()
  }
}

const highlightPages = computed(() => pageStore.highlightPages)
</script>
