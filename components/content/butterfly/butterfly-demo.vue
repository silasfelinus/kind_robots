<template>
  <div class="relative w-full h-full flex items-center justify-center bg-gray-100">
    <!-- Card container for the butterfly -->
    <div class="butterfly-card bg-white shadow-lg rounded-xl p-4 border border-gray-300 relative">
      <!-- Butterfly demo section for selected butterfly -->
      <div
        v-if="currentButterfly && currentButterfly !== undefined"
        class="butterfly z-50 mx-auto"
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
      </div>

      <!-- Name and Message Section outside of butterfly transform -->
      <div
        v-if="currentButterfly && currentButterfly !== undefined"
        class="w-full text-center mt-4 text-lg text-gray-700"
      >
        <p class="font-bold">{{ currentButterfly.id }}</p>
        <p class="italic">{{ currentButterfly.message }}</p>
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
.butterfly-card {
  width: 300px;
  height: 450px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background-color: white;
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
