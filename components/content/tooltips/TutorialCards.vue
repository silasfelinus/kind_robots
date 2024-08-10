<template>
  <div
    v-if="showInfo"
    class="tutorial-cards-container fixed bottom-0 right-0 z-40 flex flex-col-reverse items-end space-y-2 space-y-reverse p-2"
  >
    <MessageCard
      v-if="showAmiCard"
      :show="true"
      bg-class="bg-base-200 shadow-xl"
      image-src="/images/amibotsquare1.webp"
      alt-text="AMI"
      username="AMIbot"
      :message="page.amitip"
      @remove-card="showAmiCard = false"
    />
    <MessageCard
      v-if="showSilasCard"
      :show="true"
      bg-class="bg-base-200 shadow-xl"
      image-src="/images/silasfelinus.webp"
      alt-text="Silas"
      username="silasfelinus"
      :message="page.tooltip"
      @remove-card="showSilasCard = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const showInfo = computed(() => pageStore.showInfo)
const { page } = useContent()

const showSilasCard = ref(true)
const showAmiCard = ref(true)
onMounted(() => {
  setTimeout(() => {
    showSilasCard.value = true
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
