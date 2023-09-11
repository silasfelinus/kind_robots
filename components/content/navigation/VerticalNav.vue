<template>
  <div class="w-full p-2 bg-light-gray">
    <div class="flex flex-wrap justify-center">
      <div
        v-for="page in pages"
        :key="page._id"
        class="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex justify-center items-center p-2"
      >
        <NuxtLink
          :to="page._path"
          class="flex flex-col items-center group w-full text-center relative p-2"
          @click="clicked = page._id"
        >
          <div
            :class="[
              'w-24 h-24 md:w-32 md:h-32 rounded-full transition-all ease-in-out duration-500 relative',
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
            <div
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bg-primary p-2 rounded shadow-lg text-xs md:text-sm z-10"
              style="
                bottom: 100%;
                left: 50%;
                transform: translate(-50%, -10%);
                pointer-events: none;
                transition: opacity 0.2s ease-in-out;
              "
            >
              {{ page.description }}
            </div>
          </div>
          <div
            class="mt-2 text-sm md:text-base transition-colors ease-in-out duration-500 hover:text-blue-600"
            :style="clicked === page._id ? 'font-weight: bold; color: green;' : ''"
          >
            {{ page.title }}
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const clicked = ref<string | null>(null)

const { find } = queryContent()
  .where({ $not: { _path: '/' } })
  .sort({ _id: 1 })
const { data: pages } = await useAsyncData('pages-list', find)
</script>
