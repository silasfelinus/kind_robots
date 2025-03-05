<template>
  <div
    class="tutorial-cards-container fixed bottom-0 right-0 z-40 flex flex-col-reverse items-end space-y-2 space-y-reverse p-2"
  >
    <div v-if="showInfo" class="flex w-full justify-between items-center">
      <div class="flex flex-col-reverse items-end space-y-2 space-y-reverse">
        <MessageCard
          v-if="showAmiCard"
          :show="true"
          bg-class="bg-base-300 shadow-2xl border-accent backdrop-blur-lg"
          image-src="/images/amibotsquare1.webp"
          alt-text="AMI"
          username="AMIbot"
          :message="page?.amitip ?? ''"
          @remove-card="showAmiCard = false"
        />
        <MessageCard
          v-if="showDottiCard"
          :show="true"
          bg-class="bg-base-300 shadow-2xl border-secondary backdrop-blur-lg"
          image-src="/images/avatars/dottie1.webp"
          alt-text="Dotti"
          username="DottiBot"
          :message="page?.dottitip ?? ''"
          @remove-card="showDottiCard = false"
        />
      </div>
      <tooltip-toggle class="ml-auto" />
    </div>
    <div v-else>
      <tooltip-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useContentStore } from '../../../stores/contentStore'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = route.params.name as string

// Define expected content structure
interface PageData {
  title?: string
  description?: string
  subtitle?: string
  image?: string
  icon?: string
  underConstruction?: boolean
  dottitip?: string
  amitip?: string
  tooltip?: string
  message?: string
}

// Fetch the page data using Nuxt Content v3
const { data: page } = await useAsyncData<PageData>(`${name}`, async () => {
  const result = await queryCollection('content').path(`${name}`).first()
  return result || {}
})

const contentStore = useContentStore()
const showInfo = computed(() => contentStore.showInfo)

const showDottiCard = ref(false)
const showAmiCard = ref(false)

// Function to update showInfo based on the tooltips' visibility
const updateShowInfo = () => {
  if (!showAmiCard.value && !showDottiCard.value && contentStore.showInfo) {
    contentStore.toggleInfo() // Toggle off showInfo only if it's currently on
  }
}

// Watch for changes in showAmiCard and showDottiCard
watch(showAmiCard, updateShowInfo)
watch(showDottiCard, updateShowInfo)

// Watch for changes in showInfo
watch(showInfo, (newVal) => {
  if (newVal) {
    showAmiCard.value = true
    showDottiCard.value = true
  }
})

onMounted(() => {
  setTimeout(() => {
    showDottiCard.value = true
  }, 1000) // 1 second delay

  setTimeout(() => {
    showAmiCard.value = true
  }, 2000) // 2 seconds delay
})
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.5s,
    bottom 0.5s ease-in-out;
}
.fade-slide-enter, .fade-slide-leave-to /* .fade-slide-leave-active in <2.1.8 */ {
  opacity: 0;
  bottom: -100px;
}
</style>
