<template>
  <div class="fx-viewer">
    <butterfly-effect v-if="fxStore.showAmiSwarm" />
    <rain-effect v-if="fxStore.showRainEffect" />
    <bubble-effect v-if="fxStore.showSoapBubbles" />
  </div>
</template>

<script setup lang="ts">
import { useScreenStore } from '../../../stores/screenStore'

const fxStore = useScreenStore()
</script>
