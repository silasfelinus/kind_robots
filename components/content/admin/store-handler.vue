<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Display each store in a card layout -->
    <div
      v-for="storeName in Object.keys(stores)"
      :key="storeName"
      class="card rounded-lg shadow-lg overflow-hidden"
      @click="loadStore(storeName)"
    >
      <div class="p-4">
        <h2 class="card-title text-lg font-bold">{{ storeName }}</h2>
        <p class="text-sm text-gray-500">Click to load this store</p>
      </div>
    </div>
  </div>

  <!-- Display loaded store data -->
  <div v-if="storeData" class="mt-8">
    <h3 class="text-lg font-bold mb-2">Loaded Store: {{ currentStoreName }}</h3>
    <pre class="rounded-lg bg-gray-100 p-4 overflow-auto">{{ storeData }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useMediaStore } from './../../../stores/mediaStore'
import { useProjectStore } from './../../../stores/projectStore'
import { usePromptStore } from './../../../stores/promptStore'
import { useReactionStore } from './../../../stores/reactionStore'
import { useResourceStore } from './../../../stores/resourceStore'

const stores = {
  botStore: useBotStore(),
  mediaStore: useMediaStore(),
  projectStore: useProjectStore(),
  promptStore: usePromptStore(),
  reactionStore: useReactionStore(),
  resourceStore: useResourceStore()
}

const currentStoreName = ref('')
const storeData = ref<string | null>(null)

const loadStore = async (storeName: string) => {
  const key = storeName as keyof typeof stores
  currentStoreName.value = storeName
  try {
    await stores[key].loadStore()
    storeData.value = JSON.stringify(stores[key], null, 2)
  } catch (error) {
    console.log('Error loading store: ' + error)
  }
}
</script>

<style scoped>
.card {
  transition: all 0.3s ease-in-out;
}

.card:hover {
  transform: scale(1.05);
  cursor: pointer;
}
</style>
