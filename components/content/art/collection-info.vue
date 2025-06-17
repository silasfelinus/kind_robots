// /components/content/art/collection-info.vue
<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 flex items-center justify-center pointer-events-none z-[1000]"
      >
        <div
          class="bg-black bg-opacity-90 text-white p-4 rounded-xl max-w-xl w-full mx-4 shadow-xl"
        >
          <h2 class="text-lg font-bold mb-2">🛠️ Debug Info</h2>
          <div
            class="text-xs whitespace-pre-wrap break-words max-h-[70vh] overflow-auto"
          >
            <p class="mb-2">
              <span class="font-bold">Collection:</span>
              {{ collection?.label || '—' }}
            </p>
            <p class="mb-2">
              <span class="font-bold">Art:</span> {{ art?.id || '—' }}
            </p>
            <p class="mb-2">
              <span class="font-bold">ArtImage:</span> {{ artImage?.id || '—' }}
            </p>

            <pre v-if="art">{{ JSON.stringify(art, null, 2) }}</pre>
            <pre v-if="artImage">{{ JSON.stringify(artImage, null, 2) }}</pre>
            <pre v-if="collection">{{
              JSON.stringify(collection, null, 2)
            }}</pre>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'

const artStore = useArtStore()
const collectionStore = useCollectionStore()

const visible = computed(() => !!artStore.hoverArt)
const art = computed(() => artStore.hoverArt)

const artImage = computed(() =>
  artStore.getArtImageByArtId(art.value?.id || -1),
)
const collection = computed(() => {
  if (!art.value) return null
  return (
    collectionStore.collections.find((c) =>
      (c.art || []).some((a) => a.id === art.value?.id),
    ) || null
  )
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
