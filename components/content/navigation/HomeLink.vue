<template>
  <div class="flex space-x-6">
    <!-- Always show Galaxy Link -->
    <NuxtLink
      :to="randomHighlightPage._path"
      class="flex flex-col items-center justify-center rounded-2xl bg-base-200 text-center hover:scale-110 hover:glow-animation"
    >
      <div class="flex items-center space-x-2 flex-grow">
        <icon name="game-icons:galaxy" class="icon-effect" />
      </div>
    </NuxtLink>

    <!-- Show Home icon only if NOT home -->
    <NuxtLink
      v-if="!isHomePage"
      to="/"
      class="flex items-center justify-center rounded-2xl bg-base-200 text-center hover:scale-110 hover:glow-animation"
    >
      <icon name="line-md:home-md-twotone" class="icon-effect" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePageStore } from '@/stores/pageStore';

const pageStore = usePageStore();
const { page } = useContent();
const isHomePage = computed(() => {
  return page.value ? page.value._path === '/' || page.value.path === '/' : false;
});

const randomHighlightPage = computed(() => {
  return pageStore.highlightPages[Math.floor(Math.random() * pageStore.highlightPages.length)] || {};
});
</script>

<style scoped>
.icon-effect {
  @apply w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px #fff;
  }
  50% {
    box-shadow:
      0 0 20px #fff,
      0 0 30px #ff73fd;
  }
  100% {
    box-shadow: 0 0 5px #fff;
  }
}

.glow-animation:hover {
  animation: glow 1.5s infinite;
}
</style>
