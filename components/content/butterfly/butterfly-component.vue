<template>
  <div
    class="butterfly z-50 absolute"
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
import type { Butterfly } from '@/stores/butterflyStore'

const props = defineProps<{ butterfly: Butterfly }>()
</script>

<style scoped>
/* Position butterflies absolutely */
.butterfly {
  position: absolute;
  width: 40px;
  height: 40px;
}

/* Custom styles for wings */
.left-wing,
.right-wing {
  position: relative;
  width: 100%;
  height: 100%;
}

.left-wing .top,
.right-wing .top {
  width: 100%;
  height: 50%;
  border-radius: 50%;
}

.left-wing .bottom,
.right-wing .bottom {
  width: 100%;
  height: 50%;
  border-radius: 50%;
}
</style>
