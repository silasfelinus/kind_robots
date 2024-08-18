<template>
  <div class="flex items-center justify-center w-full">
    <!-- Previous Link -->
    <NuxtLink
      v-if="prev"
      :to="prev._path"
      class="group nav-icon flex flex-col items-center justify-center"
    >
      <icon name="typcn:arrow-back-outline" class="nav-icon hover:scale-110" />
      <div class="nav-text group-hover:opacity-100">
        {{ prev.title }}
      </div>
    </NuxtLink>

    <!-- Random Link -->
    <NuxtLink
      :to="randomHighlightPage._path"
      class="group nav-icon flex flex-col items-center justify-center"
    >
      <icon name="game-icons:galaxy" class="nav-icon hover:scale-110" />
      <div class="nav-text group-hover:opacity-100">
        {{ randomLinkText }}
      </div>
    </NuxtLink>

    <!-- Home Link -->
    <NuxtLink
      v-if="!isHomePage"
      to="/"
      class="group nav-icon flex flex-col items-center justify-center"
    >
      <icon name="line-md:home-md-twotone" class="nav-icon hover:scale-110" />
      <div class="nav-text group-hover:opacity-100">
        {{ homeLinkText }}
      </div>
    </NuxtLink>

    <!-- Next Link -->
    <NuxtLink
      v-if="next"
      :to="next._path"
      class="group nav-icon flex flex-col items-center justify-center"
    >
      <icon
        name="typcn:arrow-forward-outline"
        class="nav-icon hover:scale-110"
      />
      <div class="nav-text group-hover:opacity-100">
        {{ next.title }}
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

// Stores
const contentStore = useContentStore()
const { page } = contentStore
const { prev, next } = useContent()

// State
const isHomePage = computed(() => page._path === '/' || page.path === '/')

// Random values (client-side only)
const randomLinkTexts = ['Randomizer', 'Teleport!', 'Something else']
const homeLinkTexts = [
  'HomeScreen',
  'Take me home...',
  'Home',
  'Visual Contents',
]

const randomLinkText = ref('')
const homeLinkText = ref('')

const randomHighlightPage = computed(() => {
  const highlightPages = contentStore.highlightPages
  return highlightPages.length > 0
    ? highlightPages[Math.floor(Math.random() * highlightPages.length)]
    : {}
})

// Set random texts on client-side only
onMounted(() => {
  randomLinkText.value =
    randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)]
  homeLinkText.value =
    homeLinkTexts[Math.floor(Math.random() * homeLinkTexts.length)]
})
</script>

<style scoped>
.nav-icon {
  @apply flex flex-col items-center justify-center transition-all ease-in-out;
}

.nav-icon:hover {
  @apply scale-110;
}

.nav-text {
  @apply text-base opacity-0 transition-opacity duration-300;
}

.group:hover .nav-text {
  @apply opacity-100;
}
</style>
