<template>
  <div
    v-if="hydrated"
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

    <!-- Conditionally show butterfly's name below -->
    <div
      v-if="showName"
      class="butterfly-name text-center text-xs text-gray-700 w-full absolute"
      :style="{ top: `${40 * props.butterfly.z + 10}px` }"
    >
      {{ props.butterfly.id }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Butterfly } from '@/stores/butterflyStore'
import { useButterflyStore } from '@/stores/butterflyStore'

const props = defineProps<{ butterfly: Butterfly }>()
const butterflyStore = useButterflyStore()

const showName = computed(() => butterflyStore.showNames)

const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})
</script>

<style scoped>
.butterfly {
  position: absolute;
  width: 40px;
  height: 40px;
}

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

.butterfly-name {
  position: absolute;
  top: calc(100% + 10px);
  width: 100%;
}
</style>
