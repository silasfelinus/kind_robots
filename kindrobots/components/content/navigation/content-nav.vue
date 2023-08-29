<template>
  <div>
    <div class="mb-4">
      <input id="adminCheckbox" v-model="showAdmin" type="checkbox" />
      <label for="adminCheckbox" class="ml-2">Show Admin Pages</label>
    </div>
    <div class="mb-4">
      <label for="layoutToggle" class="mr-2">Layout:</label>
      <select id="layoutToggle" v-model="layout">
        <option value="full">Full</option>
        <option value="badge">Badge</option>
      </select>
    </div>
    <div class="relative flex flex-col items-center p-8 bg-base overflow-auto h-screen">
      <div
        class="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base opacity-30 pointer-events-none z-10"
      ></div>
      <div class="mt-24 mx-auto max-w-4xl">
        <div class="h-96 carousel carousel-vertical rounded-box">
          <div v-for="page in filteredPages" :key="page._id" class="mt-4 relative group">
            <NuxtLink :to="page._path">
              <div @mouseover="handleMouseover(page)" @mouseout="handleMouseout">
                <img
                  v-if="page.image && layout === 'full'"
                  :src="`/images/${page.image}`"
                  alt="Page Image"
                  class="w-full h-auto object-cover rounded-md mx-auto image-carousel"
                />
                <img
                  v-else-if="page.image && layout === 'badge'"
                  :src="`/images/${page.image}`"
                  alt="Page Image"
                  class="w-24 h-24 object-cover rounded-full mx-auto"
                />
              </div>
              <div
                v-if="tooltipContent"
                class="mt-2 text-center text-sm md:text-base bg-black text-white px-3 py-2 rounded-lg opacity-75 absolute top-0 transform translate-y-full group-hover:block hidden"
              >
                {{ tooltipContent }}
              </div>
              <div class="mt-2 text-center text-sm md:text-base">{{ page.title }}</div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '../../../stores/contentStore'
import { useStatusStore, StatusType } from '../../../stores/statusStore'

interface Page {
  _id: string
  _path: string
  image?: string
  title: string
  subtitle?: string
  folder?: string
  admin?: boolean
  tooltip?: string
}

const contentStore = useContentStore()
const statusStore = useStatusStore()
const showAdmin = ref(false)
const layout = ref('full') // 'full' or 'badge'
const tooltipContent = ref('') // Tooltip content

const filteredPages = computed((): Page[] => {
  if (!contentStore.pages) return []
  const pages = contentStore.pages.filter((page: Page) => !(!showAdmin.value && page.admin))
  console.log(pages)
  return pages
})

const handleMouseover = (page: Page) => {
  tooltipContent.value = page.subtitle ? `'${page.subtitle}'` : ''
  if (page.tooltip) {
    tooltipContent.value += ` ${page.tooltip}`
    statusStore.setStatus(StatusType.INFO, page.tooltip)
  }
}

const handleMouseout = () => {
  tooltipContent.value = ''
  statusStore.clearStatus()
}
</script>

<style scoped>
.bg-light-gray {
  background-color: #f6f6f6;
}

.image-carousel {
  object-fit: cover;
  height: 60vh; /* Increase/decrease this value to show more/less of the top and bottom */
}
</style>
