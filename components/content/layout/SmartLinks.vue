<template>
  <div class="smart-links-container flex justify-between items-center w-full">
    <!-- Previous Link -->
    <NuxtLink v-if="prevPage" :to="prevPage.path" class="nav-link group">
      <Icon name="kind-icon:back-arrow" class="hover:scale-125" />
      <span class="nav-text">{{ prevPage.title }}</span>
    </NuxtLink>

    <!-- Random Highlight Link -->
    <NuxtLink
      :to="randomHighlight?.path || '/'"
      class="nav-link group"
      :aria-label="randomLinkText"
    >
      <Icon name="kind-icon:galaxy" class="hover:scale-125" />
      <span class="nav-text">{{ randomLinkText }}</span>
    </NuxtLink>

    <!-- Next Link -->
    <NuxtLink v-if="nextPage" :to="nextPage.path" class="nav-link group">
      <Icon name="kind-icon:forward-arrow" class="hover:scale-125" />
      <span class="nav-text">{{ nextPage.title }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const route = useRoute()

const pages = computed(() =>
  pageStore.pages.filter((p) => !!p.path && !!p.title),
)

const currentIndex = computed(() =>
  pages.value.findIndex((p) => p.path === route.path),
)

const prevPage = computed(() => {
  return currentIndex.value > 0 ? pages.value[currentIndex.value - 1] : null
})

const nextPage = computed(() => {
  return currentIndex.value < pages.value.length - 1
    ? pages.value[currentIndex.value + 1]
    : null
})

const highlightPages = computed(() =>
  pageStore.pages.filter((p) => p.sort === 'highlight'),
)

const randomHighlight = computed(() => {
  const list = highlightPages.value
  return list.length
    ? list[Math.floor(Math.random() * list.length)]
    : pages.value[Math.floor(Math.random() * pages.value.length)] || null
})

const randomLinkText = ref('Explore')

onMounted(() => {
  const options = ['Randomizer', 'Teleport!', 'Try this one', 'Explore!']
  randomLinkText.value =
    options[Math.floor(Math.random() * options.length)]
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
