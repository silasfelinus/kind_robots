<template>
  <!-- Main Container -->
  <div
    class="flex flex-col items-center p-8 bg-base-300 rounded-lg shadow-lg relative w-64 h-64"
  >
    <!-- Tip Toggles -->
    <div class="absolute bottom-0 right-0 mb-2 mr-2 flex flex-col items-end">
      <button
        v-if="page.tooltip && !tipStatus.Silas.seen"
        @click="toggleTip('Silas')"
      >
        <Icon
          name="solar:cat-bold"
          class="text-3xl"
          :class="tipStatus.Silas.show ? 'text-accent flash' : 'text-default'"
        />
      </button>
      <button
        v-if="page.amitip && !tipStatus.Ami.seen"
        @click="toggleTip('Ami')"
      >
        <Icon
          name="ph:butterfly-duotone"
          class="text-3xl"
          :class="tipStatus.Ami.show ? 'text-accent flash' : 'text-default'"
        />
      </button>
    </div>
    <!-- Display Tip -->
    <div v-if="currentTip" class="flex flex-col items-start w-full h-full">
      <h3 class="text-lg font-semibold">{{ currentTipType }} says:</h3>
      <p class="flex-1">
        {{ currentTip }}
      </p>
      <button @click="clearTip">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'

// Define the Page interface for expected page properties
interface Page {
  tooltip?: string | null
  amitip?: string | null
}

// Fetching the page content with proper typing
const { page } = useContent() as { page: Page }

const currentTipType = ref<'Ami' | 'Silas' | null>(null)
const currentTip = computed(() => {
  if (currentTipType.value === 'Silas') return page.tooltip
  if (currentTipType.value === 'Ami') return page.amitip
  return null
})

// Tip status using reactive API
const tipStatus = reactive({
  Ami: { show: false, seen: true },
  Silas: { show: false, seen: true },
})

const toggleTip = (type: 'Ami' | 'Silas') => {
  // Reset all tips to not show
  Object.keys(tipStatus).forEach((key) => {
    tipStatus[key as 'Ami' | 'Silas'].show = false
  })

  // Set the current tip to show and mark it as seen
  tipStatus[type].show = true
  tipStatus[type].seen = true
  currentTipType.value = type
}

const clearTip = () => {
  currentTipType.value = null
}

// Watchers for tooltip and amitip
watch(
  () => page.tooltip,
  (newTip) => {
    tipStatus.Silas.seen = !newTip
  },
)
watch(
  () => page.amitip,
  (newTip) => {
    tipStatus.Ami.seen = !newTip
  },
)
</script>

<style scoped>
.flash {
  animation: flash 1.5s infinite;
}

@keyframes flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
