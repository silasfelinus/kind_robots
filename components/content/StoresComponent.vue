<template>
  <div>
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

<script setup lang="ts">
import { reactive } from 'vue'
import {
  useBotStore,
  useGalleryStore,
  useMediaStore,
  useGameStore,
  useProjectStore,
  usePromptStore,
  useReactionStore,
  useResourceStore,
  useUserStore
} from '../../stores'

interface StoreInstance {
  status: 'loading' | 'loaded' | 'error'
  instance: any
}

interface StoreDict {
  [key: string]: StoreInstance
}

const stores: StoreDict = reactive({
  botStore: { status: 'loading', instance: useBotStore() },
  galleryStore: { status: 'loading', instance: useGalleryStore() },
  gameStore: { status: 'loading', instance: useGameStore() },
  mediaStore: { status: 'loading', instance: useMediaStore() },
  projectStore: { status: 'loading', instance: useProjectStore() },
  promptStore: { status: 'loading', instance: usePromptStore() },
  reactionStore: { status: 'loading', instance: useReactionStore() },
  resourceStore: { status: 'loading', instance: useResourceStore() },
  userStore: { status: 'loading', instance: useUserStore() }
})

const storeLoaders = [
  { store: 'botStore', getFunction: stores.botStore.instance.getBots },
  { store: 'galleryStore', getFunction: stores.galleryStore.instance.getGalleries },
  { store: 'gameStore', getFunction: stores.gameStore.instance.getGames },
  { store: 'mediaStore', getFunction: stores.mediaStore.instance.getMedia },
  { store: 'projectStore', getFunction: stores.projectStore.instance.getProjects },
  { store: 'promptStore', getFunction: stores.promptStore.instance.getPrompts },
  { store: 'reactionStore', getFunction: stores.reactionStore.instance.getReactions },
  { store: 'resourceStore', getFunction: stores.resourceStore.instance.getResources },
  { store: 'userStore', getFunction: stores.userStore.instance.loadUsers }
]

storeLoaders.forEach(async ({ store, getFunction }) => {
  try {
    await getFunction()
    stores[store].status = 'loaded'
  } catch (error) {
    console.error(`Error loading ${store}:`, error)
    stores[store].status = 'error'
  }
})
</script>
