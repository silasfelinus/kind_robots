<template>
  <ButterflyNet v-model="butterflyStore.gameOpen" />

  <Teleport to="body">
    <div v-if="butterflyStore.gameOpen" class="butterfly-panel">
      <ButterflyGame
        :active="butterflyStore.gameOpen"
        :butterflies="butterflyStore.spawnableButterflies"
        @close="butterflyStore.gameOpen = false"
        @captured="butterflyStore.recordCapture"
      />
      <ButterflyGallery
        :slots="butterflyStore.gallerySlots"
        @inspect="butterflyStore.setInspected"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useButterflyStore } from '~/stores/butterflyStore'
import ButterflyNet from './butterfly-net.vue'
import ButterflyGame from './butterfly-game.vue'
import ButterflyGallery from './butterfly-gallery.vue'

const butterflyStore = useButterflyStore()

onMounted(() => butterflyStore.initGame())
</script>
