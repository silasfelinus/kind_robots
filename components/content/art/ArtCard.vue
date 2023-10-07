<template>
  <div
    class="art-viewer bg-primary rounded-2xl p-4 transition-shadow hover:shadow-lg cursor-pointer"
    @click="selectArt"
  >
    <h3 class="text-lg font-semibold mb-2">{{ art.prompt }}</h3>
    <div class="image-wrapper">
      <img
        :src="art.path"
        alt="Artwork"
        class="rounded-2xl transition-transform ease-in-out hover:scale-105"
      />
    </div>
    <p class="mt-2 text-base">{{ art.pitch }}</p>
    <p class="mt-2 text-base">claps: {{ art.claps }}</p>
    <p class="mt-2 text-base">Adoptable?: {{ art.isOrphan }}</p>
  </div>
</template>

<script setup lang="ts">
import { useArtStore, Art } from '@/stores/artStore'
import { useMatureStore } from '@/stores/matureStore'

const filterStore = useMatureStore()
const showMature = computed(() => filterStore.showMature)
const artStore = useArtStore()
const props = defineProps<{
  art: Art
}>()

const selectArt = () => {
  artStore.selectArt(props.art.id)
}
</script>

<style scoped>
.art-viewer {
  @apply transition-all ease-in-out duration-300;
}

.image-wrapper {
  @apply overflow-hidden;
}
</style>
