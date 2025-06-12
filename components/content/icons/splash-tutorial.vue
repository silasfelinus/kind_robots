<!-- /components/content/icons/splash-tutorial.vue -->

<template>
  <div
    class="relative w-full min-h-[100dvh] overflow-y-auto rounded-2xl border-2 border-black z-20"
    ref="scrollContainer"
  >
    <!-- Foreground content -->
    <div
      class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-4 space-y-6"
      ref="contentContainer"
    >
      <!-- Title + Description Block -->
      <div class="text-center space-y-2">
        <div class="absolute top-0 right-0 z-30" v-if="icon">
          <Icon :name="icon" class="w-full h-auto text-primary" />
        </div>
        <h1
          v-if="room"
          class="text-sm md:text-md lg:text-lg xl:text-2xl font-bold bg-secondary text-black border border-black rounded-2xl px-4 py-1 inline-block animate-fade-in-up"
        >
          The {{ room }}
        </h1>

        <button
          v-if="theme && themeStore.currentTheme !== theme"
          @click="themeStore.setActiveTheme(theme)"
          class="mx-auto block text-xs md:text-sm lg:text-md xl:text-lg font-semibold bg-accent text-black border border-black rounded-2xl px-3 py-1 animate-fade-in-up hover:underline"
        >
          <span class="font-mono">{{ theme }}</span>
        </button>

        <div>
          <h2
            v-if="subtitle"
            class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-200"
          >
            {{ subtitle }}
          </h2>
        </div>
        <div>
          <h2
            v-if="description"
            class="text-xs md:text-sm lg:text-md xl:text-lg font-medium bg-secondary text-black border border-black rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-300"
          >
            {{ description }}
          </h2>
        </div>
      </div>

      <!-- Nav + Mode Row -->
      <div class="flex flex-col gap-4 w-full pointer-events-auto">
        <div class="flex-grow flex items-center justify-center">
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
        <div class="flex-grow flex items-center justify-center">
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>

      <!-- Bot Tips -->
      <div
        v-if="dottitip && amitip"
        class="space-y-3 max-w-2xl mx-auto pb-3 px-2"
      >
        <div class="chat chat-end animate-fade-in-up delay-300 text-black">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble bg-primary text-black border border-black">
            <span
              class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg"
            >
              DottiBot:
            </span>
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
            <span
              class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg"
            >
              AMIbot:
            </span>
            <div>{{ amitip }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Background Image with Parallax -->
    <div
      v-if="image"
      class="absolute top-0 left-0 w-full -z-10 overflow-hidden will-change-transform"
    >
      <img
        :src="resolvedImage"
        @error="handleImageError"
        class="w-full min-h-[100dvh] object-cover"
        alt="Ambient Background"
      />
      <div
        class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// unchanged from your version
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'

const pageStore = usePageStore()

const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
const icon = computed(() => pageStore.page?.icon)
const dottitip = computed(() => pageStore.page?.dottitip)
const amitip = computed(() => pageStore.page?.amitip)
const navComponent = computed(() => pageStore.page?.navComponent)
const image = computed(() => pageStore.page?.image)
const theme = computed(() => pageStore.page?.theme)

const themeStore = useThemeStore()

const parsedNavComponent = computed(() => {
  try {
    const raw = navComponent.value
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed)
        return Array.isArray(parsed) ? parsed : null
      }
      return trimmed
    }
    return null
  } catch (e) {
    console.warn('Failed to parse navComponent:', e)
    return null
  }
})

const fallbackImage = '/images/botcafe.webp'
const currentImage = ref<string | null>(image.value || null)

const handleImageError = () => {
  currentImage.value = fallbackImage
}

const resolvedImage = computed(() => {
  const src = currentImage.value
  if (!src || typeof src !== 'string') return fallbackImage
  return src.startsWith('/') ? src : `/images/${src}`
})

watch(
  image,
  (newVal) => {
    currentImage.value = typeof newVal === 'string' ? newVal : fallbackImage
  },
  { immediate: true },
)
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

img {
  transition:
    transform 0.2s ease-out,
    opacity 0.3s ease-in;
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
