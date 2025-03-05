<template>
  <div class="smart-links-container flex justify-between items-center w-full">
    <!-- Previous Link -->
    <NuxtLink v-if="prev" :to="prev._path" class="nav-link group">
      <Icon name="kind-icon:back-arrow" class="hover:scale-125" />
      <span class="nav-text">{{ prev.title }}</span>
    </NuxtLink>

    <!-- Random Highlight Link -->
    <NuxtLink :to="randomHighlightPage?._path || '/'" class="nav-link group">
      <Icon name="kind-icon:galaxy" class="hover:scale-125" />
      <span class="nav-text">{{ randomLinkText }}</span>
    </NuxtLink>

    <!-- Next Link -->
    <NuxtLink v-if="next" :to="next._path" class="nav-link group">
      <Icon name="kind-icon:forward-arrow" class="hover:scale-125" />
      <span class="nav-text">{{ next.title }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'nuxt/app'
import { useContentStore } from '../../../stores/contentStore'

// Simulating `prev` and `next` manually if `useContent()` isn't available
const route = useRoute()
const contentStore = useContentStore()

const prev = computed(
  () =>
    contentStore.pages.find((page) => page._path === route.meta.prev) || null,
)

const next = computed(
  () =>
    contentStore.pages.find((page) => page._path === route.meta.next) || null,
)

// Safe computed with fallback to prevent SSR errors
const randomHighlightPage = computed(() => {
  const pages = contentStore.highlightPages
  return pages.length ? pages[Math.floor(Math.random() * pages.length)] : null
})

// Use ref for reactive properties set on client-side
const randomLinkText = ref('Loading...')

onMounted(() => {
  const randomLinkTexts = ['Randomizer', 'Teleport!', 'Something else']
  randomLinkText.value =
    randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)]
})
</script>

<style scoped>
.nav-link {
  @apply flex flex-col items-center justify-center text-center transition-transform duration-300 ease-in-out hover:scale-110;
}

.nav-text {
  @apply text-sm md:text-base opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100;
}

.smart-links-container {
  @apply flex w-full justify-around items-center py-2;
}
</style>
