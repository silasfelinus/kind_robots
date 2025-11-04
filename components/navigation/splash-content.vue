<!-- /components/content/icons/splash-content.vue -->
<template>
  <div
    ref="contentContainer"
    class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-6 space-y-8"
  >
    <!-- Subtitle at the very top, centered above everything -->
    <div v-if="subtitle" class="w-full flex justify-center mb-2">
      <span
        class="inline-flex max-w-full truncate bg-base-100/90 text-black border border-black rounded-md px-3 py-1 text-[clamp(0.7rem,0.9vw,1rem)] leading-none shadow"
      >
        {{ subtitle }}
      </span>
    </div>

    <!-- Hero header block -->
    <section
      class="relative overflow-hidden rounded-3xl border border-black bg-base-100/90 shadow-xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 animate-fade-in-up"
    >
      <!-- Soft icon accent in the background -->
      <div
        v-if="icon"
        class="pointer-events-none absolute -top-10 -right-6 sm:-top-12 sm:-right-8 opacity-20 rotate-6"
      >
        <Icon
          :name="icon"
          class="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 text-primary"
        />
      </div>

      <div class="relative space-y-4 sm:space-y-5">
        <!-- Top line: theme button -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <button
            v-if="theme && themeStore.currentTheme !== theme"
            @click="themeStore.setActiveTheme(theme)"
            class="inline-flex items-center justify-center self-start sm:self-auto rounded-full border border-black bg-accent px-3 py-1 text-[0.7rem] sm:text-xs lg:text-sm font-semibold text-black shadow-sm hover:translate-y-[1px] hover:shadow-md transition"
          >
            <span
              class="mr-1.5 text-[0.65rem] uppercase tracking-[0.16em] opacity-80"
            >
              Theme
            </span>
            <span class="font-mono">{{ theme }}</span>
          </button>
        </div>

        <!-- Room title + description -->
        <div class="space-y-2">
          <h1
            v-if="room"
            class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-tight"
          >
            <span
              class="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-[0_1px_0_rgba(0,0,0,0.55)]"
            >
              The {{ room }}
            </span>
          </h1>

          <!-- Description as a bold pill/tag line -->
          <p
            v-if="description"
            class="inline-flex items-center rounded-full border border-black bg-secondary px-3 py-0.5 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.18em]"
          >
            {{ description }}
          </p>
        </div>
      </div>
    </section>

    <!-- Nav strip -->
    <splash-nav />

    <!-- Dotti and Ami chat banter -->
    <section
      v-if="dottitip && amitip"
      class="space-y-4 max-w-2xl mx-auto pb-4 px-1 sm:px-2"
    >
      <div class="chat chat-end animate-fade-in-up delay-300 text-black">
        <div class="chat-image avatar">
          <div class="w-10 h-10 rounded-full border-2 border-primary">
            <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
          </div>
        </div>
        <div class="chat-bubble bg-primary text-black border border-black">
          <span
            class="font-semibold text-xs sm:text-sm lg:text-base block mb-1"
          >
            DottiBot:
          </span>
          <div class="text-xs sm:text-sm lg:text-base">
            {{ dottitip }}
          </div>
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
            class="font-semibold text-xs sm:text-sm lg:text-base block mb-1"
          >
            AMIbot:
          </span>
          <div class="text-xs sm:text-sm lg:text-base">
            {{ amitip }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-content.vue
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'

const contentContainer = ref<HTMLElement | null>(null)

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
