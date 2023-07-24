<template>
  <div class="fx-viewer">
    <butterfly-effect v-if="fxStore.showAmiSwarm" />
    <rain-effect v-if="fxStore.showRainEffect" />
    <bubble-effect v-if="fxStore.showSoapBubbles" />
  </div>
</template>

<script setup lang="ts">
import { useFxStore } from '../stores/screenfx'

const fxStore = useFxStore()
</script>
