<template>
  <div class="smart-links-container flex justify-between items-center w-full">
    <!-- Navigation Links with Icons and Labels -->
    <NuxtLink v-if="prev" :to="prev._path" class="nav-link">
      <icon name="typcn:arrow-back-outline" class="hover:scale-125" />
      <span class="nav-text">{{ prev.title }}</span>
    </NuxtLink>
    <!-- Other Links... -->
    <NuxtLink :to="randomHighlightPage._path" class="nav-link">
      <icon name="game-icons:galaxy" class="hover:scale-125" />
      <span class="nav-text">{{ randomLinkText }}</span>
    </NuxtLink>
    <NuxtLink v-if="next" :to="next._path" class="nav-link">
      <icon name="typcn:arrow-forward-outline" class="hover:scale-125" />
      <span class="nav-text">{{ next.title }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useContentStore } from '../../../stores/contentStore'

const { prev, next } = useContent()
const contentStore = useContentStore()

const randomHighlightPage = computed(
  () =>
    contentStore.highlightPages[
      Math.floor(Math.random() * contentStore.highlightPages.length)
    ] || {},
)

// Use ref for reactive properties that will be set on the client-side
const randomLinkText = ref('Loading...')
const homeLinkText = ref('Home...')

onMounted(() => {
  const randomLinkTexts = ['Randomizer', 'Teleport!', 'Something else']
  const homeLinkTexts = [
    'HomeScreen',
    'Take me home...',
    'Home',
    'Visual Contents',
  ]

  // Set randomized text only on client-side
  randomLinkText.value =
    randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)]
  homeLinkText.value =
    homeLinkTexts[Math.floor(Math.random() * homeLinkTexts.length)]
})
</script>
<style scoped>
.nav-link {
  @apply flex flex-col items-center justify-center text-center transition-transform duration-300 ease-in-out hover:scale-110;
}

.nav-text {
  @apply text-sm md:text-base opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100;
  position: absolute; /* Positioning the label */
  bottom: -20px; /* Positioning below the icon */
  white-space: nowrap;
}

.smart-links-container {
  @apply flex w-full justify-around items-center py-2;
}
</style>
