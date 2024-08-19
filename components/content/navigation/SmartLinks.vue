<template>
  <div class="flex items-center relative">
    <!-- Links Container -->
    <div class="flex items-center justify-center w-full">
      <!-- Previous Link -->
      <NuxtLink
        v-if="prev"
        :to="prev._path"
        class="group nav-icon flex flex-col items-center justify-center"
      >
        <icon
          name="typcn:arrow-back-outline"
          size="48"
          class="hover:scale-125"
        />
        <div class="nav-text group-hover:show-text">
          {{ prev.title }}
        </div>
      </NuxtLink>
      <!-- Random Link -->
      <NuxtLink
        :to="randomHighlightPage._path"
        class="group nav-icon flex-col items-center justify-center"
      >
        <icon
          name="game-icons:galaxy"
          class="w-12 h-12 md:w-20 md:h-20 hover:scale-125"
        />
        <div class="nav-text group-hover:show-text">
          {{ randomLinkText }}
        </div>
      </NuxtLink>
      <!-- Home Link -->
      <NuxtLink
        v-if="!isHomePage"
        to="/"
        class="group nav-icon flex-col items-center justify-center"
      >
        <icon
          name="line-md:home-md-twotone"
          class="w-12 h-12 md:w-20 md:h-20 hover:scale-125"
        />
        <div class="nav-text group-hover:show-text">
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
          class="w-12 h-12 md:w-20 md:h-20 hover:scale-125 m-2"
        />
        <div class="nav-text group-hover:show-text">
          {{ next.title }}
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '../../../stores/contentStore'

const { prev, next, page } = useContent()
const contentStore = useContentStore()

const isHomePage = computed(() => {
  return page.value
    ? page.value._path === '/' || page.value.path === '/'
    : false
})

const randomHighlightPage = computed(
  () =>
    contentStore.highlightPages[
      Math.floor(Math.random() * contentStore.highlightPages.length)
    ] || {},
)

const randomLinkTexts = ['Randomizer', 'Teleport!', 'Something else']
const homeLinkTexts = [
  'HomeScreen',
  'Take me home...',
  'Home',
  'Visual Contents',
]

const randomLinkText =
  randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)]
const homeLinkText =
  homeLinkTexts[Math.floor(Math.random() * homeLinkTexts.length)]
</script>

<style scoped>
.nav-icon {
  @apply flex text-center transition-all ease-in-out;
  justify-content: center;
  align-items: center;
}

.nav-text {
  @apply text-lg opacity-0 group-hover:opacity-100 transition-opacity;
}
</style>
