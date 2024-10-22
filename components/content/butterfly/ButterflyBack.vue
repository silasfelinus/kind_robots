<template>
  <div class="relative w-full h-full flex items-center justify-center bg-gray-100 p-6">
    <!-- Card container for the butterfly -->
    <div class="butterfly-card bg-white shadow-lg rounded-xl p-6 border border-gray-300 relative flex flex-col items-center">
      <!-- Butterfly demo section for selected butterfly -->
      <div
        v-if="selectedButterfly"
        class="butterfly z-50 mb-6"
        :style="{
          transform:
            'rotate3d(1, 1, 0, ' +
            selectedButterflyRotation +
            'deg) scale(' +
            selectedButterflySize +
            ')',
        }"
      >
        <div class="left-wing">
          <div
            class="top"
            :style="{ background: selectedButterflyWingTopColor }"
          ></div>
          <div
            class="bottom"
            :style="{ background: selectedButterflyWingBottomColor }"
          ></div>
        </div>
        <div class="right-wing">
          <div
            class="top"
            :style="{ background: selectedButterflyWingTopColor }"
          ></div>
          <div
            class="bottom"
            :style="{ background: selectedButterflyWingBottomColor }"
          ></div>
        </div>
      </div>

      <!-- Wing Colors -->
      <div class="mb-4 w-full max-w-xs">
        <label for="wingTopColor" class="block mb-2 text-center">Wing Top Color:</label>
        <input
          id="wingTopColor"
          v-model="selectedButterflyWingTopColor"
          type="color"
          class="w-full p-2 rounded"
        />
      </div>

      <div class="mb-4 w-full max-w-xs">
        <label for="wingBottomColor" class="block mb-2 text-center"
          >Wing Bottom Color:</label
        >
        <input
          id="wingBottomColor"
          v-model="selectedButterflyWingBottomColor"
          type="color"
          class="w-full p-2 rounded"
        />
      </div>

      <!-- Name and Message Section -->
      <div v-if="selectedButterfly" class="w-full text-center text-lg text-gray-700 mt-6">
        <p class="font-bold">{{ selectedButterfly.id }}</p>
        <p class="italic">{{ selectedButterfly.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

// Access the butterfly store
const butterflyStore = useButterflyStore()

// Computed properties for butterfly settings
const butterflies = computed(() => butterflyStore.getAllButterflies)
const selectedButterfly = computed(() => butterflyStore.getSelectedButterfly)

const selectedButterflySize = computed({
  get: () => selectedButterfly.value?.scale || 1,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.scale = val
    }
  },
})

const selectedButterflyWingTopColor = computed({
  get: () => selectedButterfly.value?.wingTopColor || '#ffffff',
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.wingTopColor = val
    }
  },
})

const selectedButterflyWingBottomColor = computed({
  get: () => selectedButterfly.value?.wingBottomColor || '#ffffff',
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.wingBottomColor = val
    }
  },
})

const selectedButterflyRotation = computed({
  get: () => selectedButterfly.value?.rotation || 0,
  set: (val) => {
    if (selectedButterfly.value) {
      selectedButterfly.value.rotation = val
    }
  },
})
</script>

<style scoped>
.butterfly-card {
  width: 320px;
  height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}

.butterfly {
  width: 120px;
  height: 120px;
  position: relative;
  transform-style: preserve-3d;
  pointer-events: none;
}

.left-wing,
.right-wing {
  width: 32px;
  height: 54px;
  position: absolute;
  top: 16px;
  pointer-events: none;
}

.left-wing {
  left: 12px;
  transform-origin: 32px 50%;
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 46px;
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

.top,
.bottom {
  opacity: 0.8;
  position: absolute;
}

.top {
  width: 28px;
  height: 28px;
  border-radius: 14px;
}
.bottom {
  top: 20px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
}

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
</style>
