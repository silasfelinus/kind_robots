<template>
  <div class="flex flex-wrap justify-center">
    <!-- Always show Random Link -->
    <NuxtLink
      :to="randomHighlightPage._path"
      class="group flex flex-col items-center justify-center rounded-2xl text-center hover:scale-110 transition-all ease-in-out"
    >
      <Icon
        name="kind-icon:galaxy"
        :title="'Go to Random Highlight Page'"
        class="Icon-effect w-6 h-6 md:w-12 md:h-12 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
      />
      <div
        class="m-1 text-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {{ randomLinkText }}
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useContentStore } from '../../../stores/contentStore'

const contentStore = useContentStore()

const randomHighlightPage = computed(() => {
  const highlightPages = contentStore.highlightPages
  return highlightPages.length > 0
    ? highlightPages[Math.floor(Math.random() * highlightPages.length)]
    : {}
})

const randomLinkTexts = [
  'Randomizer',
  'Teleport me somewhere else!',
  'Show me another page',
]

const randomLinkText = ref(
  randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)],
)

onMounted(() => {
  randomLinkText.value =
    randomLinkTexts[Math.floor(Math.random() * randomLinkTexts.length)]
})
</script>

<style scoped></style>
