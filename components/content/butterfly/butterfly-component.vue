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
    <!-- Left Wing -->
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

    <!-- Right Wing -->
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

    <!-- Conditionally show butterfly's name -->
    <div
      v-if="showName"
      class="absolute text-center text-xs text-gray-700 w-full"
      :style="{ top: '50px' }"
    >
      {{ props.butterfly.id }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Butterfly } from '@/stores/butterflyStore'

// Access the store (if you need to conditionally show names from the store)
import { useButterflyStore } from '@/stores/butterflyStore'

// Props for the butterfly object
const props = defineProps<{ butterfly: Butterfly }>()
const butterflyStore = useButterflyStore()

// Compute whether to show the name
const showName = computed(() => butterflyStore.showNames)
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
