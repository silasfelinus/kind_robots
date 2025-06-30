<!-- /components/content/tooltips/dotti-cards.vue -->
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
          :message="amitip"
          @remove-card="showAmiCard = false"
        />
        <MessageCard
          v-if="showDottiCard"
          :show="true"
          bg-class="bg-base-300 shadow-2xl border-secondary backdrop-blur-lg"
          image-src="/images/avatars/dottie1.webp"
          alt-text="Dotti"
          username="DottiBot"
          :message="dottitip"
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
import { ref, watch, onMounted } from 'vue'
import { useContentStore } from '@/stores/contentStore'
import { usePageStore } from '@/stores/pageStore'

const contentStore = useContentStore()
const pageStore = usePageStore()

const { dottitip, amitip } = storeToRefs(pageStore)
const showInfo = computed(() => contentStore.showInfo)

const showDottiCard = ref(false)
const showAmiCard = ref(false)

const updateShowInfo = () => {
  if (!showAmiCard.value && !showDottiCard.value && contentStore.showInfo) {
    contentStore.toggleInfo()
  }
}

watch(showAmiCard, updateShowInfo)
watch(showDottiCard, updateShowInfo)

watch(showInfo, (newVal) => {
  if (newVal) {
    showAmiCard.value = true
    showDottiCard.value = true
  }
})

onMounted(() => {
  setTimeout(() => {
    showDottiCard.value = true
  }, 1000)

  setTimeout(() => {
    showAmiCard.value = true
  }, 2000)
})
</script>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.5s,
    bottom 0.5s ease-in-out;
}
.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  bottom: -100px;
}
</style>
