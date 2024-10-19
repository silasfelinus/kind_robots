<template>
  <div
    class="relative w-full h-full flex items-center justify-center bg-gray-200"
  >
    <!-- Butterfly demo section for selected butterfly -->
    <div
      v-if="currentButterfly"
      class="butterfly z-50"
      :style="{
        transform:
          'rotate3d(1, 1, 0, ' +
          currentButterfly.rotation +
          'deg) scale(' +
          currentButterfly.scale +
          ')',
      }"
    >
      <div class="left-wing">
        <div
          class="top"
          :style="{ background: currentButterfly.wingTopColor }"
        ></div>
        <div
          class="bottom"
          :style="{ background: currentButterfly.wingBottomColor }"
        ></div>
      </div>
      <div class="right-wing">
        <div
          class="top"
          :style="{ background: currentButterfly.wingTopColor }"
        ></div>
        <div
          class="bottom"
          :style="{ background: currentButterfly.wingBottomColor }"
        ></div>
      </div>

      <!-- Conditionally show the butterfly's name -->
      <div class="absolute top-20 w-full text-center text-lg text-gray-700">
        <p>{{ currentButterfly.id }}</p>
        <p>{{ currentButterfly.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Computed property to get the selected butterfly from the store
const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)
</script>

<style scoped>
.butterfly {
  width: 100px;
  height: 100px;
  position: absolute;
  transform-style: preserve-3d;
  pointer-events: none;
}

/* Adjust wing animation for proper view */
@keyframes flutter-left {
  0% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, 70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
}

@keyframes flutter-right {
  0% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, -70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
}

.left-wing,
.right-wing {
  width: 24px;
  height: 42px;
  position: absolute;
  top: 10px;
  pointer-events: none;
}

.left-wing {
  left: 10px;
  transform-origin: 24px 50%;
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 34px;
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

.top,
.bottom {
  opacity: 0.7;
  position: absolute;
}

.top {
  width: 20px;
  height: 20px;
  border-radius: 10px;
}
.bottom {
  top: 18px;
  width: 24px;
  height: 24px;
  border-radius: 12px;
}
</style>
