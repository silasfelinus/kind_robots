<template>
  <div
    class="butterfly z-50"
    :style="{
      left: props.butterfly.x + '%',
      top: props.butterfly.y + '%',
      transform:
        'rotate3d(1, 0.5, 0, ' +
        props.butterfly.rotation +
        'deg) scale(' +
        props.butterfly.z +
        ')',
      zIndex: props.butterfly.zIndex,
    }"
  >
    <div class="left-wing">
      <div
        class="top"
        :style="{ background: props.butterfly.wingTopColor }"
      ></div>
      <div
        class="bottom"
        :style="{ background: props.butterfly.wingBottomColor }"
      ></div>
    </div>
    <div class="right-wing">
      <div
        class="top"
        :style="{ background: props.butterfly.wingTopColor }"
      ></div>
      <div
        class="bottom"
        :style="{ background: props.butterfly.wingBottomColor }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Butterfly } from './../../../stores/butterflyStore'

// Define the props and specify the type for 'butterfly'
const props = defineProps<{ butterfly: Butterfly }>()
</script>

<style scoped>
/* Styling for butterfly component */
</style>
