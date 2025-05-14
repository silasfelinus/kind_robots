<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <!-- Root container with scrollable content -->
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto rounded-2xl border-2 border-black z-20 scroll-smooth"
    @scroll="handleScroll"
    ref="scrollContainer"
  >
    <!-- Foreground scroll content -->
    <div
      class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-4 space-y-6"
    >
      <!-- Title + Description Block -->
      <div
        class="text-center space-y-2 cursor-pointer"
        @click="handleSidebarClose"
      >
        <div class="absolute top-0 right-0 z-30">
          <Icon :name="icon" class="w-full h-auto text-primary" />
        </div>
        <h1
          v-if="room"
          class="text-sm md:text-md lg:text-lg xl:text-2xl font-bold bg-secondary text-black border border-black rounded-2xl px-4 py-1 inline-block animate-fade-in-up"
        >
          The {{ room }}
        </h1>
        <h2
          v-if="subtitle"
          class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-200"
        >
          {{ subtitle }}
        </h2>
        <h2
          v-if="description"
          class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-300"
        >
          {{ description }}
        </h2>
      </div>

      <!-- Nav + Mode Row -->
      <div class="flex flex-col gap-4 w-full pointer-events-auto">
        <div
          class="flex-grow flex items-center justify-center overflow-auto rounded-2xl border-2 border-black"
        >
          <component
            v-if="Array.isArray(parsedNavComponent)"
            is="smart-nav"
            :component-list="parsedNavComponent"
            class="w-full max-w-3xl"
          />
          <component
            v-else-if="
              typeof parsedNavComponent === 'string' && parsedNavComponent
            "
            :is="parsedNavComponent"
            class="w-full max-w-3xl"
          />
        </div>
        <div
          class="flex-grow flex items-center justify-center overflow-auto rounded-2xl border-2 border-black"
        >
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>

      <!-- Bot Tips -->
      <div
        v-if="dottitip && amitip"
        class="space-y-3 max-w-2xl mx-auto pb-3 px-2"
        @click="handleSidebarClose"
      >
        <div class="chat chat-end animate-fade-in-up delay-300 text-black">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble bg-primary text-black border border-black">
            <span class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg"
              >DottiBot:</span
            >
            <div>{{ dottitip }}</div>
          </div>
        </div>
        <div class="chat chat-start animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble bg-secondary text-black border border-black">
            <span class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg"
              >AMIbot:</span
            >
            <div>{{ amitip }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Parallax Background Layer -->
    <div
      class="absolute inset-0 -z-10 will-change-transform transition-transform duration-300 ease-out"
      :style="`transform: translateY(${parallaxOffset}px);`"
    >
      <img
        v-if="image"
        :src="`/images/${image}`"
        class="w-full h-full object-cover"
        alt="Ambient Background"
      />
      <div
        class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none"
      />
      <!-- Butterfly Layer -->
      <img
        src="/images/overlays/butterflies.webp"
        class="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70 pointer-events-none"
        alt="Butterfly Overlay"
        style="transform: translateY(calc(var(--parallaxOffset, 0px) * 0.5))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { ref, computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const {
  room,
  subtitle,
  description,
  icon,
  dottitip,
  amitip,
  navComponent,
  image,
} = storeToRefs(usePageStore())

const parsedNavComponent = computed(() => {
  try {
    const raw = navComponent.value
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : null
      }
      return raw.trim()
    }
    return null
  } catch (e) {
    console.warn('Failed to parse navComponent:', e)
    return null
  }
})

const handleSidebarClose = () => {
  console.log('Sidebar closing triggered')
  displayStore.setSidebarRight(false)
}

const parallaxOffset = ref(0)
const scrollContainer = ref<HTMLElement | null>(null)

const handleScroll = () => {
  if (scrollContainer.value) {
    parallaxOffset.value = scrollContainer.value.scrollTop * -0.25
    scrollContainer.value.style.setProperty(
      '--parallaxOffset',
      `${parallaxOffset.value}px`,
    )
  }
}
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

.chat-bubble {
  line-height: 1.5;
  max-width: 90%;
  word-break: break-word;
  border: 1px solid black;
}
</style>
