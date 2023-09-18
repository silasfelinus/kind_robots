<template>
  <div class="w-full flex flex-col items-center p-4 bg-primary rounded-2xl">
    <div class="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 rounded-2xl">
      <div
        v-for="page in pages"
        :key="page._id"
        class="flex flex-col rounded-2xl items-center justify-center my-4 drag-card"
      >
        <div
          class="rounded-2xl border-4 p-2 bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <NuxtLink
            :to="page._path"
            class="flex flex-col items-center justify-center"
            @click="clicked = page._id"
          >
            <div
              :class="[
                'w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 rounded-full transition-all ease-in-out duration-500',
                clicked === page._id ? 'scale-110' : '',
                'hover:scale-105 hover:shadow-lg'
              ]"
            >
              <img
                v-if="page.image"
                :src="`/images/${page.image}`"
                alt="Page Image"
                class="w-full h-full rounded-full object-cover"
              />
            </div>
            <div
              class="mt-2 text-xs sm:text-sm md:text-base transition-colors ease-in-out duration-500 hover:text-accent"
              :style="clicked === page._id ? 'font-weight: bold; color: green;' : ''"
            >
              {{ page.title }}
            </div>
            <div class="mt-1 text-xxs sm:text-xs md:text-sm text-gray-600">
              {{ page.description }}
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// TypeScript code remains the same
import { ref } from 'vue'

const clicked = ref<string | null>(null)

const { find } = queryContent()
  .where({ $not: { _path: '/' } })
  .sort({ _id: 1 })
const { data: pages } = await useAsyncData('pages-list', find)
</script>

<style scoped>
.bg-light-gray {
  background-color: #f6f6f6;
}
.drag-card {
  cursor: grab;
}
</style>
