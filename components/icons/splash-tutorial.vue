<!-- /components/content/icons/splash-tutorial.vue -->
<template>
  <div
    v-if="pageStore.page"
    ref="scrollContainer"
    class="relative w-full h-full overflow-y-auto rounded-2xl border-2 border-black z-20"
  >
    <!-- Foreground Content -->
    <div
      ref="contentContainer"
      class="relative z-20 w-full max-w-4xl flex flex-col mx-auto px-4 py-4 space-y-6"
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

      <!-- Toggle + Nav + Mode Row -->
      <div class="flex flex-col gap-4 w-full pointer-events-auto">
        <div
          v-if="parsedNavComponent && parsedNavComponent !== 'mode-row'"
          class="text-center"
        >
          <button
            class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-accent rounded-2xl transition-all"
            @click="showNavComponent = !showNavComponent"
          >
            Toggle Navigation:
            <span class="ml-1 font-mono">
              {{ showNavComponent ? 'Component' : 'Mode Row' }}
            </span>
          </button>
        </div>

        <Transition name="fade-expand">
          <div
            v-if="parsedNavComponent && showNavComponent"
            class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-accent rounded-2xl p-4"
          >
            <label class="text-sm font-semibold text-accent text-center block">
              🔘 Navigation Component:
              <span class="font-mono">{{ parsedNavComponent }}</span>
            </label>
            <div class="flex justify-center w-full max-w-3xl mx-auto">
              <component
                :is="parsedNavComponent"
                class="w-full"
                v-if="parsedNavComponent"
              />
              <div v-else class="text-warning font-mono text-sm">
                ⚠️ Failed to resolve component: {{ parsedNavComponent }}
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="fade-expand">
          <div
            v-if="!showNavComponent"
            class="space-y-2 border border-base-300 bg-base-100 rounded-2xl p-4"
          >
            <label
              class="text-sm font-semibold text-base-content/70 text-center block"
            >
              🎮 Mode Row
            </label>
            <div class="flex justify-center">
              <mode-row class="w-full max-w-3xl" />
            </div>
          </div>
        </Transition>
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

    <!-- Parallax Background -->
    <div
      v-if="image"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      :style="{ height: `${contentHeight * 1.2}px` }"
    >
      <div
        class="parallax-image absolute top-0 left-0 w-full h-full bg-cover bg-center will-change-transform transition-transform duration-100"
        :style="{
          backgroundImage: `url('${resolvedImage}')`,
          transform: `translateY(${scrollOffset}px)`
        }"
      />
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
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
  const img = image.value
  return img?.startsWith('/') ? img : `/images/${img ?? fallbackImage}`
})

const parsedNavComponent = computed(() => {
  const raw = navComponent.value
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
})

const showNavComponent = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
const contentHeight = ref(1000)
const scrollOffset = ref(0)

let resizeObserver: ResizeObserver | null = null
let ticking = false

function updateHeight() {
  if (contentContainer.value) {
    contentHeight.value = contentContainer.value.offsetHeight
  }
}

onMounted(() => {
  nextTick(() => {
    updateHeight()

    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (scrollContainer.value) {
              scrollOffset.value = scrollContainer.value.scrollTop * -0.2
            }
            ticking = false
          })
          ticking = true
        }
      })
    }

    if (contentContainer.value) {
      resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(contentContainer.value)
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver && contentContainer.value) {
    resizeObserver.unobserve(contentContainer.value)
  }
})
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
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.4s ease;
}
.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.chat-bubble {
  line-height: 1.5;
  max-width: 90%;
  word-break: break-word;
  border: 1px solid black;
}
.parallax-image {
  background-size: cover;
  background-position: center top;
}
</style>
