<!-- /components/navigation/ami-chat.vue -->
<template>
  <section
    v-if="dottitip && amitip"
    class="space-y-4 max-w-2xl mx-auto pb-4 px-1 sm:px-2"
  >
    <!-- Dotti bubble -->
    <div class="chat chat-end motion-safe:animate-fade-in-up delay-300">
      <div class="chat-image avatar">
        <div
          class="w-10 h-10 rounded-full border-2 border-primary transition-transform duration-300 hover:scale-110 hover:-rotate-3"
        >
          <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
        </div>
      </div>
      <div
        class="chat-bubble bg-primary text-primary-content border border-black/20 shadow-md"
      >
        <span class="font-semibold text-xs sm:text-sm lg:text-base block mb-1">
          DottiBot:
        </span>
        <div class="text-xs sm:text-sm lg:text-base">
          {{ dottitip }}
        </div>
      </div>
    </div>

    <!-- AMI bubble -->
    <div class="chat chat-start motion-safe:animate-fade-in-up delay-500">
      <div class="chat-image avatar">
        <div
          class="w-10 h-10 rounded-full border-2 border-secondary transition-transform duration-300 hover:scale-110 hover:rotate-3"
        >
          <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
        </div>
      </div>
      <div
        class="chat-bubble bg-secondary text-secondary-content border border-black/20 shadow-md"
      >
        <span class="font-semibold text-xs sm:text-sm lg:text-base block mb-1">
          AMIbot:
        </span>
        <div class="text-xs sm:text-sm lg:text-base">
          {{ amitip }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const dottitip = computed(() => pageStore.page?.dottitip)
const amitip = computed(() => pageStore.page?.amitip)
</script>
