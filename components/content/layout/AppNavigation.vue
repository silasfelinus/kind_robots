<template>
  <div class="overflow-y-auto max-w-lg mx-auto p-4">
    <ul class="space-y-4">
      <li v-for="(item, index) in filteredNavigationTree" :key="index">
        <div
          class="transform transition-all duration-200 hover:scale-105 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg shadow-lg overflow-hidden grid grid-cols-4 gap-4"
        >
          <div v-if="level === 0" class="col-span-1">
            <img
              :src="item.image || item.gallery || '/images/backtree.webp'"
              alt="Section Image"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="col-span-3 p-4 text-default rounded">
            <NuxtLink
              :to="item._path"
              class="block text-center text-2xl font-bold leading-tight text-default overflow-hidden overflow-ellipsis mb-4"
            >
              {{ item.title }}
            </NuxtLink>
            <div v-if="item.children" class="mt-2 grid grid-flow-row gap-2">
              <div
                v-for="child in item.children"
                :key="child._id"
                class="flex flex-wrap"
              >
                <NuxtLink
                  :to="child._path"
                  class="rounded-full bg-primary text-default text-sm px-4 py-2 m-1 hover:bg-blue-600 transition-colors w-full text-center"
                >
                  {{ child.title }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

// Define types for the navigation tree items, including `_id`
interface NavigationItem {
  _id: string // Add _id property
  _path: string
  title: string
  image?: string
  gallery?: string
  children?: NavigationItem[]
}

// Define props with the navigationTree as an array of NavigationItem
const props = defineProps({
  navigationTree: {
    type: Array as () => NavigationItem[],
    default: () => [],
  },
  level: {
    type: Number,
    default: 0,
  },
})

// Filter child routes to exclude children with the same _path as their parent
const filterChildRoutes = (item: NavigationItem) => {
  if (item.children) {
    item.children = item.children.filter(
      (child: NavigationItem) => child._path !== item._path,
    )
  }
  return item
}

// Computed property to return the filtered navigation tree
const filteredNavigationTree = computed(() =>
  props.navigationTree.map(filterChildRoutes),
)
</script>
