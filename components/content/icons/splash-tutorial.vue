<template>
  <div
    v-if="pageStore.page"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
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
        <div class="text-center" v-if="canToggleNav">
          <button
            @click="showSmartNav = !showSmartNav"
            class="btn btn-xs md:btn-sm btn-outline rounded-2xl border-base-content/40"
          >
            Toggle Nav:
            <span class="ml-1 font-mono">{{ showSmartNav ? 'Smart' : 'Component' }}</span>
          </button>
        </div>

        <div class="flex-grow flex items-center justify-center">
          <component
            v-if="hasSmartNav && showSmartNav"
            is="smart-nav"
            :component-list="parsedNavComponent"
            class="w-full max-w-3xl"
          />
          <component
            v-if="hasStringNav && (!hasSmartNav || !showSmartNav)"
            :is="parsedNavComponent"
            class="w-full max-w-3xl"
          />
        </div>

        <div class="flex-grow flex items-center justify-center">
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>

      <!-- Bot Tips -->
      <div v-if="dottitip && amitip" class="space-y-3 max-w-2xl mx-auto pb-3 px-2">
        <div class="chat chat-end animate-fade-in-up delay-300 text-black">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble bg-primary text-black border border-black">
            <span class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg">
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
            <span class="font-semibold text-xs md:text-sm lg:text-md xl:text-lg">
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
        class="w-full min-h-[100dvh] object-cover"
        alt="Ambient Background"
      />
      <div class="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm pointer-events-none" />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-tutorial.vue

import { ref, computed, watchEffect } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'

const pageStore = usePageStore()
const themeStore = useThemeStore()

const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
const icon = computed(() => pageStore.page?.icon)
const dottitip = computed(() => pageStore.page?.dottitip)
const amitip = computed(() => pageStore.page?.amitip)
const navComponent = computed(() => pageStore.page?.navComponent)
const image = computed(() => pageStore.page?.image)
const theme = computed(() => pageStore.page?.theme)

const fallbackImage = '/images/botcafe.webp'

const resolvedImage = computed(() => {
  const img = pageStore.page?.image
  if (!img || typeof img !== 'string') return fallbackImage
  return img.startsWith('/') ? img : `/images/${img}`
})

const parsedNavComponent = ref<string | string[] | null>(null)

watchEffect(() => {
  const raw = navComponent.value
  if (!raw) {
    parsedNavComponent.value = null
    return
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        parsedNavComponent.value = Array.isArray(parsed) ? parsed : null
      } catch (err) {
        console.warn('❌ navComponent JSON parse failed:', err)
        parsedNavComponent.value = null
      }
    } else {
      parsedNavComponent.value = trimmed
    }
  } else {
    parsedNavComponent.value = null
  }

  console.groupCollapsed(
    `[splash-tutorial.vue] NavComponent Debug for Page: ${pageStore.page?.title || 'unknown'}`
  )
  console.log('🔹 Raw navComponent:', raw)
  console.log('🔹 Parsed navComponent:', parsedNavComponent.value)
  console.log('🔹 Type:', typeof parsedNavComponent.value)
  if (typeof parsedNavComponent.value === 'string') {
    console.log(`✅ Will render <${parsedNavComponent.value} />`)
  } else if (Array.isArray(parsedNavComponent.value)) {
    console.log(`✅ Will render <smart-nav> with`, parsedNavComponent.value)
  } else {
    console.warn('❌ navComponent is invalid or missing')
  }
  console.groupEnd()
})

const showSmartNav = ref(true)

const hasSmartNav = computed(() => Array.isArray(parsedNavComponent.value))
const hasStringNav = computed(() => typeof parsedNavComponent.value === 'string')
const canToggleNav = computed(() => hasSmartNav.value && hasStringNav.value)
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
