<!-- /components/content/icons/splash-content.vue -->
<template>
  <div
    ref="contentContainer"
    class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-4 space-y-6"
  >
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

    <splash-nav />

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
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
const theme = computed(() => pageStore.page?.theme)
</script>
