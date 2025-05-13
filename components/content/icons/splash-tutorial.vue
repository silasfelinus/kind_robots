<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div
    class="relative w-full h-screen md:h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
  >
    <!-- Background Image -->
    <img
      v-if="image"
      :src="`/images/${image}`"
      class="absolute inset-0 h-full w-auto object-cover z-0"
      alt="Ambient Background"
    />
    <!-- Bokeh Overlay -->
    <div
      class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-10 pointer-events-none"
    />

    <!-- Foreground Content Grid -->
    <div
      class="relative z-20 min-h-full max-w-4xl mx-auto px-4 py-2 grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3"
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
        <div>
          <h2
            v-if="subtitle"
            class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-200"
          >
            {{ subtitle }}
          </h2>
        </div>
        <h2
          v-if="description"
          class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-300"
        >
          {{ description }}
        </h2>
      </div>

      <!-- Shared container for nav + mode-row -->
      <div
        class="flex flex-col gap-4 overflow-hidden h-full w-full pointer-events-auto"
      >
        <!-- NavComponent (takes half space) -->
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
            v-else-if="typeof parsedNavComponent === 'string'"
            :is="parsedNavComponent"
            class="w-full max-w-3xl"
          />
        </div>

        <!-- Mode-row (takes half space) -->
        <div
          class="flex-grow flex items-center justify-center overflow-auto rounded-2xl border-2 border-black"
        >
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>

      <!-- Bot Tips (anchored to bottom) -->
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
            <span
              class="font-semibold text-xs md:text:sm lg:text-md xl:text-lg text-black"
              >DottiBot:</span
            >
            <div class="text-black">{{ dottitip }}</div>
          </div>
        </div>

        <div class="chat chat-start animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble bg-secondary text-black border border-black">
            <span
              class="font-semibold text-xs md:text:sm lg:text-md xl:text-lg text-black"
              >AMIbot:</span
            >
            <div class="text-black">{{ amitip }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'
import { computed } from 'vue'

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
