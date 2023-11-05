<template>
  <div class="flex flex-wrap justify-center">
    <!-- Always show Random Link -->
    <NuxtLink
      :to="randomHighlightPage._path"
      class="group flex flex-col items-center justify-center rounded-2xl text-center hover:scale-110 transition-all ease-in-out"
    >
      <icon
        name="game-icons:galaxy"
        :title="'Go to Random Highlight Page'"
        class="w-20 h-20 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
      <div class="m-1 text-lg opacity-0 group-hover:opacity-100 transition-opacity">
        {{ randomLinkText }}
      </div>
    </NuxtLink>

    <!-- Show Home icon only if NOT home -->
    <NuxtLink
      v-if="!isHomePage"
      to="/"
      class="group flex flex-col items-center justify-center rounded-2xl text-center hover:scale-110 transition-all ease-in-out"
    >
      <icon
        name="line-md:home-md-twotone"
        :title="'Home'"
        class="w-20 h-20 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
      <div class="m-2 text-lg opacity-0 group-hover:opacity-100 transition-opacity">
        {{ homeLinkText }}
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePageStore } from '@/stores/pageStore';

const { page } = useContent();
const pageStore = usePageStore();

const isHomePage = computed(() => {
  return page.value ? page.value._path === '/' || page.value.path === '/' : false;
});

const randomHighlightPage = computed(() => {
  return pageStore.highlightPages[Math.floor(Math.random() * pageStore.highlightPages.length)] || {};
});

const randomLinkTexts = ['Randomizer', 'Teleport me somewhere else!', 'Show me another page'];
const homeLinkTexts = ['Our Colorful HomeScreen', 'Take me home...', 'Home Sweet Home', 'Visual Table of Contents'];

const randomLinkText = randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)];
const homeLinkText = homeLinkTexts[Math.floor(Math.random() * homeLinkTexts.length)];
</script>

<style scoped></style>
