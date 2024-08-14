<template>
  <footer
    class="m-2 p-0 relative flex flex-col items-center"
    :class="{ 'min-h-56': !isExtended, 'h-auto': isExtended }"
  >
    <nav
      class="w-auto p-2 rounded-2xl bg-primary flex flex-col items-center border"
    >
      <!-- Highlight Section -->
      <div
        class="flex flex-nowrap justify-center space-x-2 overflow-x-auto pb-10"
      >
        <div
          v-for="page in highlightPages"
          :key="page._id"
          class="flex-shrink-0 m-1 relative group"
        >
          <NuxtLink
            :to="page._path"
            class="flex flex-col items-center py-1 px-1 text-md shadow-lg group"
          >
            <div
              class="bg-base-200 p-2 rounded-2xl overflow-hidden flex items-center justify-center border transition-colors group-hover:border-secondary"
            >
              <img
                :src="`/images/${page.image}`"
                alt="Page Image"
                class="w-24 h-24 object-cover rounded-2xl"
              />
            </div>
            <div class="mt-1 text-center p-1">
              {{ page.title }}
              <div
                v-if="page._path === $route.path"
                class="m-1 text-md bg-secondary rounded-2xl border p-1"
              >
                <icon name="line-md:download-outline-loop" class="text-lg" />
                You are here
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Icon and Text Sections (Displayed only when extended) -->
      <div v-if="isExtended" class="order-last mt-4 p-2 rounded-2xl">
        <div class="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="page in iconAndTextPages"
            :key="page._id"
            class="m-2 relative group"
          >
            <NuxtLink
              :to="page._path"
              class="p-2 text-center bg-secondary rounded-2xl flex items-center justify-center space-x-2 group hover:bg-accent transition-colors duration-300"
            >
              <div v-if="page.icon" class="text-3xl">
                <icon :name="page.icon" />
              </div>
              <div class="text-lg p-1">
                {{ page.title }}
                <div
                  v-if="page._path === $route.path"
                  class="mt-1 text-md text-secondary rounded-full border p-1"
                >
                  <icon name="line-md:download-outline-loop" class="text-lg" />
                  You are here
                </div>
              </div>
            </NuxtLink>
            <div
              v-if="page.underConstruction"
              class="mt-1 bg-warning text-xs rounded-2xl p-1 text-center"
            >
              Under Construction
            </div>
          </div>
        </div>
      </div>
    </nav>
    <div
      class="transition duration-600 ease-in-out absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-base-400 border rounded-2xl p-2 cursor-pointer shadow-lg"
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
  </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore' // Changed to useContentStore

const contentStore = useContentStore() // Changed to contentStore
const isExtended = ref(false)

const toggleExtend = () => {
  isExtended.value = !isExtended.value
}

const highlightPages = computed(() =>
  contentStore.pagesByTagAndSort('home', 'highlight'),
)
const iconAndTextPages = computed(() => [
  ...contentStore.pagesByTagAndSort('home', 'icon'),
  ...contentStore.pagesByTagAndSort('home', 'text'),
])
</script>
