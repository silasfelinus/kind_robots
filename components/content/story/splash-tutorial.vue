<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden rounded-2xl z-10">
    <!-- Fullscreen Background -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <image-toggle class="w-full h-full object-cover" />
    </div>

    <!-- Foreground Content -->
    <div class="relative z-10 container backdrop-blur-xl px-4 py-6 space-y-8 max-w-4xl mx-auto">
      <!-- Title + Icon Block -->
      <div class="relative space-y-4">
        <button
          class="absolute top-0 right-0 max-w-[100px] z-30"
          @click="toggleDebug"
        >
          <Icon :name="page?.icon" class="w-full h-auto text-primary" />
        </button>

        <div
          v-if="page?.title"
          class="bg-primary/80 text-white text-3xl md:text-5xl font-bold px-4 py-2 rounded-xl inline-block animate-fade-in-up"
        >
          The {{ page.title }} Room
        </div>

        <div
          v-if="page?.description"
          class="bg-base-100/70 text-white text-base md:text-lg lg:text-xl font-medium px-3 py-1 rounded-md inline-block animate-fade-in-up delay-200"
        >
          {{ page.description }}
        </div>
      </div>

      <!-- Optional Nav Component -->
      <component
        v-if="page?.navComponent"
        :is="page.navComponent"
        class="w-full pointer-events-auto"
      />

<mode-row />

      <!-- Bot Tips -->
      <div v-if="page?.dottitip && page?.amitip" class="max-w-xl mx-auto space-y-4">
        <div class="chat chat-start animate-fade-in-up delay-300">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-primary">
            <span class="font-semibold">DottiBot:</span> {{ page.dottitip }}
          </div>
        </div>

        <div class="chat chat-end animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-secondary">
            <span class="font-semibold">AMIbot:</span> {{ page.amitip }}
          </div>
        </div>
      </div>
    </div>

    <!-- Debug Overlay -->
    <div
      v-if="debug"
      class="fixed inset-0 bg-black/70 z-50 text-white text-left p-6 overflow-auto"
    >
      <button
        class="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl"
        @click="toggleDebug"
      >
        Close Debug
      </button>
      <pre class="whitespace-pre-wrap break-words">{{ page }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { useRoute } from 'vue-router'
import { queryCollection } from '#content'
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const route = useRoute()
const displayStore = useDisplayStore()

const debug = ref(false)
const toggleDebug = () => (debug.value = !debug.value)

const slug = route.params.slug || 'index'

const { data: page } = await queryCollection('pages')
  .where({ _path: `/pages/${slug}` })
  .findOne()
</script>

<style scoped>
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-500 {
  animation-delay: 0.5s;
}
</style>
