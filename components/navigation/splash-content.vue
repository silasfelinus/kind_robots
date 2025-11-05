<!-- /components/content/icons/splash-content.vue -->
<template>
  <div
    ref="contentContainer"
    class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-6 space-y-6"
  >
    <!-- Hero header block (now includes Kind title + nav controls) -->
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
        <!-- Kind title pill + theme switch -->
        <div v-if="title" class="flex items-center justify-between gap-3 mb-1">
          <div
            class="inline-flex max-w-full items-center gap-2 rounded-2xl border border-black bg-base-100/95 px-3 py-1.5 sm:px-4 sm:py-2 shadow-md"
          >
            <!-- Kind pill -->
            <span
              class="inline-flex items-center justify-center rounded-full bg-black text-base-100 px-2 py-px text-[0.6rem] sm:text-[0.7rem] font-semibold tracking-[0.2em] uppercase whitespace-nowrap"
            >
              Kind
            </span>

            <!-- Page title text -->
            <span
              class="truncate font-semibold leading-tight text-[clamp(0.9rem,1.9vw,1.4rem)] tracking-tight"
            >
              {{ title }}
            </span>
          </div>

          <!-- Theme button -->
          <button
            v-if="theme && themeStore.currentTheme !== theme"
            @click="themeStore.setActiveTheme(theme)"
            class="inline-flex items-center justify-center rounded-full border border-black bg-accent px-3 py-1 text-[0.7rem] sm:text-xs lg:text-sm font-semibold text-black shadow-sm hover:translate-y-[1px] hover:shadow-md transition"
          >
            <span
              class="mr-1.5 text-[0.65rem] uppercase tracking-[0.16em] opacity-80"
            >
              Theme
            </span>
            <span class="font-mono">{{ theme }}</span>
          </button>
        </div>

        <!-- Room title + subtitle / description -->
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

          <p
            v-if="subtitle"
            class="text-xs sm:text-sm text-base-content/80 max-w-prose"
          >
            {{ subtitle }}
          </p>

          <!-- Description as bold tag line -->
          <p
            v-if="description"
            class="inline-flex items-center rounded-full border border-black bg-secondary px-3 py-0.5 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-[0.18em]"
          >
            {{ description }}
          </p>
        </div>

        <!-- Back / Next navigation row -->
        <div
          class="pt-1 flex items-center justify-between gap-2 text-xs sm:text-sm"
        >
          <button
            v-if="showBack"
            class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-300 px-3 py-1 flex items-center gap-1"
            @click="goBack"
          >
            <Icon name="kind-icon:arrow-left" class="w-3 h-3" />
            <span>Back</span>
          </button>

          <span class="flex-1" />

          <button
            v-if="nextLink"
            class="btn btn-ghost btn-xs sm:btn-xs rounded-full border border-base-300 px-3 py-1 flex items-center gap-1"
            @click="goNext"
          >
            <span>Next</span>
            <Icon name="kind-icon:arrow-right" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </section>

    <!-- Directory / Navigation container -->
    <section
      class="relative bg-base-300 rounded-2xl shadow-md overflow-hidden animate-fade-in-up"
    >
      <div class="p-4 sm:p-6 space-y-4">
        <!-- Header row for the directory view -->
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg sm:text-xl font-bold text-base-content">
            Browse Rooms and Tools
          </h2>
        </div>

        <!-- Smart nav grid -->
        <smart-grid v-if="navInitialized" />

        <!-- Simple loading / fallback -->
        <div
          v-else
          class="w-full flex items-center justify-center py-8 text-sm text-base-content/70"
        >
          Loading navigation...
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/splash-content.vue
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '#components'
import { usePageStore } from '@/stores/pageStore'
import { useThemeStore } from '@/stores/themeStore'
import { useNavStore } from '@/stores/navStore'

const contentContainer = ref<HTMLElement | null>(null)

const pageStore = usePageStore()
const themeStore = useThemeStore()
const navStore = useNavStore()

const route = useRoute()
const router = useRouter()

const title = computed(() => pageStore.page?.title)
const room = computed(() => pageStore.page?.room)
const subtitle = computed(() => pageStore.page?.subtitle)
const description = computed(() => pageStore.page?.description)
const icon = computed(() => pageStore.page?.icon)
const theme = computed(() => pageStore.page?.theme)

const navInitialized = computed(() => navStore.isInitialized)

const showBack = computed(() => route.path !== '/')

// Optional next link support: add `next` to page metadata when ready
const nextLink = computed<string | null>(() => {
  return (pageStore.page as any)?.next ?? null
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function goNext() {
  if (nextLink.value) {
    router.push(nextLink.value)
  }
}

onMounted(async () => {
  if (!navStore.isInitialized) {
    await navStore.initialize()
  }
  // Land in "all" by default in the unified grid
  navStore.setActiveModelType(null)
})
</script>
