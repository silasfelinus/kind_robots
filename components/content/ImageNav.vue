<template>
  <div class="w-full flex flex-col items-center p-4 bg-light-gray">
    <div
      v-for="page in pages"
      :key="page._id"
      class="w-full flex flex-col items-center justify-center my-4"
    >
      <NuxtLink
        :to="page._path"
        class="flex flex-col items-center justify-center"
        @click="clicked = page._id"
      >
        <div
          :class="[
            'w-24 h-24 md:w-32 md:h-32 rounded-full transition-all ease-in-out duration-500',
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
          class="mt-2 text-center text-sm md:text-base transition-colors ease-in-out duration-500 hover:text-blue-600"
          :style="clicked === page._id ? 'font-weight: bold; color: green;' : ''"
        >
          {{ page.title }}
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const clicked = ref(null)

const { find } = queryContent()
  .where({ $not: { _path: '/' } })
  .sort({ _id: 1 })
const { data: pages } = await useAsyncData('pages-list', find)
</script>

<style scoped>
.bg-light-gray {
  background-color: #f6f6f6;
}
</style>
