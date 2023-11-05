<template>
  <nav class="w-full bg-base p-4 transition-all duration-500 ease-in-out">
    <div class="flex flex-wrap justify-center mt-2 space-x-2">
      <div v-for="page in pagesByTag('weird')" :key="page._id" class="m-2">
        <NuxtLink
          :to="page._path"
          class="btn btn-accent rounded-full py-1 px-3 text-default shadow-lg transform transition-transform hover:scale-110"
        >
          {{ page.title }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePageStore } from '../../../stores/pageStore';

const pageStore = usePageStore();

const pagesByTag = (tag: string) => {
  return pageStore.pages.filter((page: any) => page.tags?.includes(tag));
};
</script>
