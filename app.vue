<template>
  <div class="container mx-auto px-4">
    <div class="flex flex-col min-h-screen justify-between">
      <div>
        <nuxt-link to="/welcome">
          <img
            v-if="imageLoaded"
            :src="'/images/kindtitle.webp'"
            class="mx-auto"
            alt="Title"
            @load="imageLoaded = true"
          />
        </nuxt-link>
      </div>
      <nuxt-page />
    </div>
    <loading-bar />

    <h2 class="text-center text-xl font-bold mb-4">Stores Loading Status</h2>
    <div class="space-y-2">
      <div v-for="(store, name) in stores" :key="name" class="flex items-center justify-between">
        <span class="font-medium">{{ name }}</span>
        <span
          class="text-sm px-2 py-1 rounded-full"
          :class="{
            'bg-green-500 text-white': store.status === 'loaded',
            'bg-yellow-500 text-white': store.status === 'loading',
            'bg-red-500 text-white': store.status === 'error'
          }"
        >
          {{ store.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  useBotStore,
  useErrorStore,
  useGalleryStore,
  useMediaStore,
  useProjectStore,
  usePromptStore,
  useReactionStore,
  useResourceStore,
  useScreenfxStore,
  useStatusStore,
  useThemeStore,
  useUserStore
} from './stores'

const stores = reactive({
  botStore: { status: useBotStore().load() },
  errorStore: { status: useErrorStore().load() },
  galleryStore: { status: useGalleryStore().load() },
  mediaStore: { status: useMediaStore().load() },
  projectStore: { status: useProjectStore().load() },
  promptStore: { status: usePromptStore().load() },
  reactionStore: { status: useReactionStore().load() },
  resourceStore: { status: useResourceStore().load() },
  screenfxStore: { status: useScreenfxStore().load() },
  statusStore: { status: useStatusStore().load() },
  themeStore: { status: useThemeStore().load() },
  userStore: { status: useUserStore().load() }
})
</script>
