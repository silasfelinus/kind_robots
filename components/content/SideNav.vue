<template>
  <div class="w-full flex flex-col items-center p-2 md:flex-row md:flex-wrap md:justify-center">
    <div
      v-for="page in pages"
      :key="page._id"
      class="w-full flex flex-row items-center justify-center my-2 md:w-auto md:mx-2"
    >
      <NuxtLink :to="page._path" class="flex flex-col items-center justify-center">
        <div class="w-24 h-24 md:max-w-48 md:max-h-48 rounded-full transition-all hover:shadow-lg">
          <img
            v-if="page.image"
            :src="`/images/${page.image}`"
            alt="Page Image"
            class="w-full h-full rounded-full object-cover"
          />
        </div>
        <div class="text-black text-center text-sm md:text-base">{{ page.title }}</div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { find } = queryContent()
  .where({ $not: { _path: '/' } })
  .sort({ _id: 1 })
const { data: pages } = await useAsyncData('pages-list', find)
</script>
